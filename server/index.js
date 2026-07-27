import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";
import {
  deleteTransaction,
  hasDatabase,
  insertTransaction,
  listTransactions,
  spendingMemoryAnswer,
  syncTransactions,
} from "./db.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 用专属变量名，避免与开发工具注入的通用 PORT 冲突
const PORT = Number(process.env.SNAPLEDGER_PORT || 3801);

const app = express();
app.use(express.json({ limit: "25mb" }));

// SDK 会自动解析凭证：ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / `ant auth login` 的本地档案。
// 惰性初始化：完全没有凭证时部分 SDK 版本会在构造时抛错，不能让它在启动时炸掉服务——
// 没有 key 也要能跑演示模式。
let client = null;
function getClient() {
  if (!client) client = new Anthropic();
  return client;
}

const CATEGORIES = [
  "食品生鲜",
  "餐饮外卖",
  "日用百货",
  "交通出行",
  "服饰美妆",
  "医疗健康",
  "娱乐休闲",
  "其他",
];

const SUPPORTED_MEDIA = ["image/jpeg", "image/png", "image/gif", "image/webp"];

const RECEIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["merchant", "date", "items", "total", "confidence_note"],
  properties: {
    merchant: { type: "string", description: "商家名称；识别不出时为空字符串" },
    date: {
      type: "string",
      description: "小票上的交易日期，格式 YYYY-MM-DD（月日补零）；识别不出时为空字符串",
    },
    items: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "amount", "quantity", "category"],
        properties: {
          name: { type: "string", description: "商品名（可适当规整，如去掉规格编码）" },
          amount: { type: "number", description: "该行实付合计金额（元）" },
          quantity: { type: "number", description: "数量；小票未标注时为 1" },
          category: { type: "string", enum: CATEGORIES },
        },
      },
    },
    total: { type: "number", description: "小票实付合计金额（元）" },
    confidence_note: {
      type: "string",
      description: "对识别不确定之处的一句话中文说明（如金额模糊、被折痕遮挡）；没有则为空字符串",
    },
  },
};

const SYSTEM_PROMPT = `你是「小票管家」的小票识别引擎。用户上传一张购物小票/收据/发票照片，你负责把它转成结构化账目。
要求：
- 逐行读出商品与金额，金额一律使用实付价（有折扣时取折后价）。
- 每件商品归入给定分类之一；拿不准时选「其他」。
- total 用小票上的实付合计；如果照片里没有合计，就用各行金额之和。
- 照片如果不是小票（比如风景照），items 返回空数组，并在 confidence_note 里说明。
- 金额单位统一为元（人民币）；外币小票按面值数字记录并在 confidence_note 注明币种。`;

// 模型返回的日期做归一化：接受 2026-7-5 / 2026/07/05 / 2026年7月5日 等写法，
// 统一为 YYYY-MM-DD；非法或缺失返回空串（前端会兜底为今天）
function normalizeDate(s) {
  if (typeof s !== "string") return "";
  const m = s.trim().match(/^(\d{4})[-/年.](\d{1,2})[-/月.](\d{1,2})日?$/);
  if (!m) return "";
  const y = Number(m[1]);
  const mo = Number(m[2]);
  const d = Number(m[3]);
  const dt = new Date(y, mo - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== mo - 1 || dt.getDate() !== d) {
    return "";
  }
  return `${y}-${String(mo).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
}

app.get("/api/status", (_req, res) => {
  // 只探测凭证「存在」（env / ant auth 档案 / WIF），不验证有效性
  let hasCredential = true;
  try {
    getClient();
  } catch {
    hasCredential = false;
  }
  res.json({ ok: true, hasCredential, hasDatabase: hasDatabase() });
});

const NO_AUTH_MESSAGE =
  "未配置 Anthropic 凭证。设置 ANTHROPIC_API_KEY 环境变量（或运行 ant auth login）后重启服务，或先用内置演示小票体验完整流程。";

app.post("/api/parse-receipt", async (req, res) => {
  const { image, mediaType } = req.body || {};
  if (!image || typeof image !== "string") {
    return res.status(400).json({ code: "bad_request", message: "缺少图片数据" });
  }
  // 容忍前端传 data:URL：剥掉前缀
  const data = image.replace(/^data:[^,]+,/, "");
  const media_type = mediaType || "image/jpeg";
  if (!SUPPORTED_MEDIA.includes(media_type)) {
    return res.status(400).json({
      code: "bad_request",
      message: "不支持的图片格式，仅支持 JPEG / PNG / GIF / WebP。",
    });
  }

  let anthropic;
  try {
    anthropic = getClient();
  } catch {
    return res.status(401).json({ code: "no_auth", message: NO_AUTH_MESSAGE });
  }

  try {
    // 结构化提取属于简单视觉任务：effort low 明显更快更省，质量足够。
    // fallbacks "default"：安全分类器误伤时服务端自动换模型重跑，评委现场不吃闭门羹。
    const response = await anthropic.beta.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      betas: ["server-side-fallback-2026-07-01"],
      fallbacks: "default",
      system: SYSTEM_PROMPT,
      output_config: {
        effort: "low",
        format: { type: "json_schema", schema: RECEIPT_SCHEMA },
      },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type, data } },
            { type: "text", text: "识别这张小票，输出结构化账目。" },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return res.status(422).json({
        code: "refused",
        message: "模型拒绝处理这张图片，请换一张小票照片试试。",
      });
    }
    if (response.stop_reason === "max_tokens") {
      return res.status(422).json({
        code: "truncated",
        message: "识别输出超出长度限制，请换一张更清晰或内容更少的照片重试。",
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(502).json({ code: "empty", message: "识别结果为空，请重试。" });
    }

    let parsed;
    try {
      parsed = JSON.parse(textBlock.text);
    } catch (e) {
      console.error(
        "parse-receipt: invalid JSON from model:",
        e.message,
        textBlock.text.slice(0, 200)
      );
      return res
        .status(502)
        .json({ code: "bad_model_output", message: "识别结果格式异常，请重试。" });
    }

    parsed.date = normalizeDate(parsed.date);
    return res.json({ ok: true, receipt: parsed, usage: response.usage });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({ code: "no_auth", message: NO_AUTH_MESSAGE });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res
        .status(429)
        .json({ code: "rate_limited", message: "请求太频繁，稍等几秒再试。" });
    }
    // 注意：APIConnectionError 是 APIError 的子类，必须先判
    if (err instanceof Anthropic.APIConnectionError) {
      return res
        .status(502)
        .json({ code: "network", message: "连不上识别服务，请检查网络后重试。" });
    }
    if (err instanceof Anthropic.BadRequestError) {
      console.error("parse-receipt bad request:", err.message);
      return res.status(422).json({
        code: "bad_image",
        message: "图片数据无效（可能已损坏或过大），请重新拍摄或压缩后再试。",
      });
    }
    if (err instanceof Anthropic.APIError) {
      console.error("parse-receipt API error:", err.status, err.message);
      return res.status(502).json({
        code: "api_error",
        message: `识别服务出错（${err.status ?? "?"}）：${err.message}`,
      });
    }
    console.error("parse-receipt failed:", err);
    return res.status(500).json({ code: "server_error", message: "服务器内部错误。" });
  }
});

app.get("/api/transactions", async (_req, res) => {
  try {
    const transactions = await listTransactions();
    if (!transactions) {
      return res.json({ ok: true, source: "local", transactions: [] });
    }
    res.json({ ok: true, source: "cockroachdb", transactions });
  } catch (err) {
    console.error("list transactions failed:", err);
    res.status(502).json({
      code: "db_error",
      message: "云端账本暂时不可用，已切回本地演示模式。",
    });
  }
});

app.post("/api/transactions", async (req, res) => {
  try {
    const saved = await insertTransaction(req.body?.transaction || req.body);
    if (!saved) {
      return res.status(503).json({
        code: "db_not_configured",
        message: "未配置云端账本，已保存在本地。",
      });
    }
    res.json({ ok: true, transaction: saved });
  } catch (err) {
    console.error("insert transaction failed:", err);
    res.status(502).json({ code: "db_error", message: "云端入账失败，已保存在本地。" });
  }
});

app.delete("/api/transactions/:id", async (req, res) => {
  try {
    const deleted = await deleteTransaction(req.params.id);
    res.json({ ok: true, deleted });
  } catch (err) {
    console.error("delete transaction failed:", err);
    res.status(502).json({ code: "db_error", message: "云端删除失败。" });
  }
});

app.post("/api/transactions/sync", async (req, res) => {
  try {
    const result = await syncTransactions(req.body?.transactions || []);
    if (!result) {
      return res.status(503).json({ code: "db_not_configured", message: "未配置云端账本。" });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("sync transactions failed:", err);
    res.status(502).json({ code: "db_error", message: "云端同步失败。" });
  }
});

app.post("/api/memory/ask", async (req, res) => {
  try {
    const result = await spendingMemoryAnswer(req.body?.question);
    if (!result) {
      return res.status(503).json({
        code: "db_not_configured",
        message: "未配置 CockroachDB 记忆层。",
      });
    }
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error("memory ask failed:", err);
    res.status(502).json({ code: "db_error", message: "消费记忆查询失败。" });
  }
});

// 生产模式：serve 构建产物，`npm run build && npm start` 即可单进程部署
// `/` 是官网落地页，`/app`（或 /app.html）是应用
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
app.get("/app", (_req, res, next) => {
  res.sendFile(path.join(distDir, "app.html"), (err) => {
    if (err) next();
  });
});
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

// body 解析等中间件错误统一转成 JSON，前端 resp.json() 才不会炸
app.use((err, _req, res, _next) => {
  if (err?.type === "entity.too.large") {
    return res
      .status(413)
      .json({ code: "too_large", message: "上传内容过大，请压缩后重试。" });
  }
  if (err?.type === "entity.parse.failed") {
    return res.status(400).json({ code: "bad_request", message: "请求格式错误。" });
  }
  console.error(err);
  res.status(500).json({ code: "server_error", message: "服务器内部错误。" });
});

app.listen(PORT, () => {
  console.log(`SnapLedger server listening on http://localhost:${PORT}`);
});
