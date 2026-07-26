import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import Anthropic from "@anthropic-ai/sdk";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// 用专属变量名，避免与开发工具注入的通用 PORT 冲突
const PORT = Number(process.env.SNAPLEDGER_PORT || 3801);

const app = express();
app.use(express.json({ limit: "25mb" }));

// SDK 会自动解析凭证：ANTHROPIC_API_KEY / ANTHROPIC_AUTH_TOKEN / `ant auth login` 的本地档案。
const client = new Anthropic();

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

const RECEIPT_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["merchant", "date", "items", "total", "confidence_note"],
  properties: {
    merchant: { type: "string", description: "商家名称；识别不出时为空字符串" },
    date: {
      type: "string",
      description: "小票上的交易日期，格式 YYYY-MM-DD；识别不出时为空字符串",
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

app.get("/api/status", (_req, res) => {
  res.json({
    ok: true,
    hasEnvCredential: Boolean(
      process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN
    ),
  });
});

app.post("/api/parse-receipt", async (req, res) => {
  const { image, mediaType } = req.body || {};
  if (!image || typeof image !== "string") {
    return res.status(400).json({ code: "bad_request", message: "缺少图片数据" });
  }

  try {
    const response = await client.messages.create({
      model: "claude-opus-5",
      max_tokens: 16000,
      system: SYSTEM_PROMPT,
      output_config: { format: { type: "json_schema", schema: RECEIPT_SCHEMA } },
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image",
              source: {
                type: "base64",
                media_type: mediaType || "image/jpeg",
                data: image,
              },
            },
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
        message: "小票内容过长导致输出被截断，请分段拍摄后重试。",
      });
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock) {
      return res.status(502).json({ code: "empty", message: "识别结果为空，请重试。" });
    }

    const parsed = JSON.parse(textBlock.text);
    return res.json({ ok: true, receipt: parsed, usage: response.usage });
  } catch (err) {
    if (err instanceof Anthropic.AuthenticationError) {
      return res.status(401).json({
        code: "no_auth",
        message:
          "未配置 Anthropic API key。设置 ANTHROPIC_API_KEY 环境变量后重启服务，或先用内置演示小票体验完整流程。",
      });
    }
    if (err instanceof Anthropic.RateLimitError) {
      return res
        .status(429)
        .json({ code: "rate_limited", message: "请求太频繁，稍等几秒再试。" });
    }
    if (err instanceof Anthropic.APIConnectionError) {
      return res
        .status(502)
        .json({ code: "network", message: "连不上识别服务，请检查网络后重试。" });
    }
    if (err instanceof Anthropic.APIError) {
      return res.status(502).json({
        code: "api_error",
        message: `识别服务出错（${err.status ?? "?"}）：${err.message}`,
      });
    }
    console.error("parse-receipt failed:", err);
    return res.status(500).json({ code: "server_error", message: "服务器内部错误。" });
  }
});

// 生产模式：serve 构建产物，`npm run build && npm start` 即可单进程部署
const distDir = path.join(__dirname, "..", "dist");
app.use(express.static(distDir));
app.get(/^\/(?!api\/).*/, (_req, res, next) => {
  res.sendFile(path.join(distDir, "index.html"), (err) => {
    if (err) next();
  });
});

app.listen(PORT, () => {
  console.log(`SnapLedger server listening on http://localhost:${PORT}`);
});
