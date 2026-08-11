# 🧾 小票管家 SnapLedger

> **拍张小票，账就记好了。**
> AI 视觉识别购物小票 → 逐行提取商品与金额 → 自动分类 → 消费仪表盘。

**[English README](README.en.md)** · [演示视频脚本](DEMO_SCRIPT.md) · [路演稿](PITCH.md) · [报名指南](HACKATHONS.md)

**[AWS 在线演示](https://sn-bca64ddba9d14c37b155bdfd35aa7f86.ecs.us-east-1.on.aws/app)** · [ECS Express 部署指南](AWS_DEPLOY.md)

手动记账坚持不下来，不是因为懒，而是因为「每一笔都要打字」。小票管家把记账压缩成一个动作：**对着小票拍一张照**。剩下的——读出每件商品、分好类、算好合计、画出你这个月的钱花在哪——全部自动完成。

## ✨ 功能亮点

- **📷 扫一扫**：拖入/选择小票照片，AI 逐行识读商品、金额、商家、日期。皱了、斜了、光线差都能认。
- **🏷️ 自动分类**：每件商品自动归入 8 个消费分类（食品生鲜、餐饮外卖、日用百货、交通出行……），拿不准的可一键改。
- **🖋️ 盖章入账**：识别结果以热敏小票形态呈现，逐行可编辑；确认后盖一枚红色「已入账」印章——记账也可以有仪式感。
- **📊 消费仪表盘**：本月支出、日均、环比、分类构成、每日趋势、账单明细，一屏看清钱去哪了。
- **🔌 断网可演示**：内置三张演示小票，不配 API key、甚至现场断网也能走完整流程。
- **🔒 数据不出浏览器**：账目存在 localStorage，照片仅用于单次识别。

## 🏗️ 技术架构

```
┌──────────────┐   照片(base64, 客户端压缩至≤2000px)   ┌──────────────┐
│  React 前端   │ ────────────────────────────────▶ │ Express 后端  │
│  Vite + SVG  │ ◀──────────────────────────────── │  Node.js     │
└──────┬───────┘        结构化账目 JSON               └──────┬───────┘
       │                                                  │ Messages API
  localStorage                                            ▼ (视觉 + 结构化输出)
  （账本持久化）                                     Claude claude-opus-5
```

- **识别引擎**：Anthropic Claude（`claude-opus-5`）视觉能力 + **结构化输出**（`output_config.format` JSON Schema），保证返回的账目 JSON 永远合法、字段完整、分类只会落在枚举里——不需要脆弱的正则后处理。
- **CockroachDB 云端记忆层**：本地 demo 可离线跑；配置 `COCKROACH_DATABASE_URL` 后，账目会同步到 CockroachDB Cloud。项目已启用两个比赛要求工具：**Managed MCP Server**（已授权 Claude Code 读写）+ **Distributed Vector Indexing**（`receipt_items.embedding VECTOR(1024)` + `items_embedding_idx`），并提供消费记忆问答 API。
- **图表**：零图表库，手写 SVG/CSS。分类色板经过**色觉缺陷（CVD）安全校验**（相邻色对 ΔE ≥ 8），每根条都带文字标签，色盲用户同样可读。
- **前端**：React 18 + Vite，手机/桌面自适应，支持 `prefers-reduced-motion`。

## 🚀 快速开始

```bash
npm install
npm run dev        # 官网 http://localhost:5173 · 应用 /app.html · 后端 :3801
```

打开 http://localhost:5173 是官网落地页，点「打开应用」进入应用。**不配置任何 key 就能用演示小票走完整流程。**

手机浏览器里可「添加到主屏幕」安装为 App（PWA，首次加载后离线可开）。

要识别真实小票照片，配置 Anthropic 凭证（任选其一）：

```bash
# 方式一：环境变量
export ANTHROPIC_API_KEY=sk-ant-...
npm run dev

# 方式二：本机已用 ant auth login 登录过，直接跑即可（SDK 自动读取凭证）
```

生产部署（单进程）：

```bash
npm run build && npm start   # Express 同时托管官网、应用与 API
```

AWS 参赛版本部署在 **Amazon ECS Express Mode**，镜像托管于 Amazon ECR，
并以只读模式连接 CockroachDB Cloud，避免匿名访客修改共享数据；完整步骤见
[AWS_DEPLOY.md](AWS_DEPLOY.md)。

纯静态部署（Netlify / Vercel / GitHub Pages）：直接部署 `dist/` 目录——官网与演示票全流程**不需要后端**就能跑，只有真实照片识别需要 API 服务。

## 📁 目录结构

```
server/index.js            # Express：/api/parse-receipt（Claude 视觉识别）
src/App.jsx                # 壳：导航、账本状态、toast
src/components/
  ScanView.jsx             # 上传/拖拽、客户端压图、扫描动画、演示票货架
  ReceiptCard.jsx          # 识别结果确认页（可编辑热敏小票 + 印章）
  Dashboard.jsx            # 仪表盘：统计块、分类条形、日趋势 SVG、明细
src/lib/
  categories.js            # 分类定义 + CVD 安全色板（固定色序）
  demoData.js              # 演示小票 + 可复现的种子账目
  store.js                 # localStorage 持久化
```

## 🎬 演示脚本（评委视角 90 秒）

1. 打开「扫一扫」→ 点演示票「超市采购」→ 扫描光束扫过票面（1.8s）
2. 识别结果以小票形态出现 → 现场把「维达抽纸」的分类从日用百货改成其他，展示可编辑
3. 点「确认入账」→ 红章「已入账」砸下 → 自动跳到账本
4. 仪表盘讲三句话：本月花了多少、哪个分类最烧钱、趋势图上周末的尖峰
5. 有网络时加映：掏出手机拍一张真小票上传，展示真实识别

详细路演稿见 [PITCH.md](PITCH.md)。

## 🗺️ Roadmap（如果继续做）

- 多币种与出差报销模式（小票 → 报销单一键导出）
- 微信/支付宝账单导入，与小票互补
- 月度 AI 消费点评（「这个月奶茶喝了 14 杯，比上月多 5 杯」）
- 家庭共享账本

---

*Built for hackathon · 识别引擎 Claude · 数据存本地*
