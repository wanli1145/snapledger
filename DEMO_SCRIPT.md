# 演示视频分镜脚本 · Demo Video Script

> **总长**：3 分钟以内（Devpost / CockroachDB 硬性要求 ≤3min；lablab.ai 建议同长）。
> **录制规格**：1080p 浏览器无痕窗口、125% 缩放、隐藏书签栏。
> **配音**：英文（按本子念）、中文对照写在括号内。
> **语速**：放慢半拍、光标移动从容、动画不要跳过。

---

## Shot 0 · 冷开场（0:00–0:12）

**画面**：官网落地页（`/`），扫描光束正扫过 hero 小票。停 2 秒后缓慢下滑。

**VO (EN)**:
> How many expense-tracking apps have you abandoned? It's not laziness — it's typing. Every entry, every field, thirty seconds each. SnapLedger kills the typing.

**中文对照**：你放弃过几个记账 App？不是因为懒，是因为打字。小票管家干掉的就是「打字」。

---

## Shot 1 · 一句话定位（0:12–0:25）

**画面**：点「打开应用」，进入扫一扫页面，鼠标掠过拖放区。

**VO (EN)**:
> Snap a photo of any shopping receipt. AI reads it line by line — every item, every price — categorizes everything, and books it. You take photos. It keeps books.

**中文对照**：对任何小票拍一张照，AI 逐行识读每件商品和金额、自动分类、直接入账。

---

## Shot 2 · 扫描（0:25–0:45）

**画面**：点击演示票「超市采购」→ 扫描光束动画完整播放（**别跳过，这是产品记忆点**）→ 识别结果以小票形态浮现。

**VO (EN)**:
> Here's a typical supermarket receipt — six items, groceries mixed with household goods. *(beat, let the animation play)* Every line extracted. Milk and eggs filed under Groceries; tissues and detergent under Household.

**中文对照**：一张典型超市小票，六件商品。（停顿）每一行都读出来了。

---

## Shot 3 · 人在回路（0:45–1:05）

**画面**：点开「维达抽纸」那行的分类下拉，改成「其他」，再改回来；顺手把一个金额改一下再改回，展示合计实时变化。

**VO (EN)**:
> AI won't be right 100% of the time — so every single line is editable, right on the receipt. Change a category, fix a price; the total recalculates live, and it flags any mismatch against the printed total.

**中文对照**：AI 不可能永远正确——每一行都能直接改。合计实时重算，对不上还会标红。

---

## Shot 4 · 盖章入账（1:05–1:20）

**画面**：点「确认入账 ¥119.80」→ 红章砸下 → 自动跳转账本。章落时静音停顿 1 秒。

**VO (EN)**:
> Confirm — and stamp. *(pause for the seal)* Bookkeeping finally has a moment of ceremony.

**中文对照**：确认，盖章。（等印章落下）记账第一次有了仪式感。

---

## Shot 5 · 仪表盘讲故事（1:20–1:50）

**画面**：账本页从上到下：四个统计块 → 分类构成横条 → 鼠标沿趋势图滑动展示十字线 tooltip（在周末尖峰处停留）→ 滚到账单明细，刚入账的一笔在最上面。

**VO (EN)**:
> The ledger speaks for itself. Monthly total, biggest category, weekend spikes on the daily trend. The receipt I just scanned is already on top of the list.

**中文对照**：账本自己会说话：本月总支出、最大分类、周末尖峰。刚扫的那张已经躺在最上面。

---

## Shot 6 · CockroachDB 记忆层（1:50–2:30）← **CockroachDB 比赛专属**

**画面**：切到账本页底部的「消费记忆助手」面板 → 输入「上个月买过几次咖啡？」→ 点击提问 → 出现答案 + 展开向量证据。

**VO (EN)**:
> The receipts you just scanned are stored in CockroachDB Cloud, not just in the browser. I can ask it: "How many coffees last month?" CockroachDB's vector indexing finds semantically similar items, and SQL aggregation gives me the total: 4 receipts, ¥86.78.

**中文对照**：刚扫的小票存在 CockroachDB 云端，不只是浏览器本地。我可以问它：上个月买过几次咖啡？向量索引语义检索 + SQL 聚合，4 张小票，¥86.78。

**画面**：点击「查看查询证据」展开 JSON，展示 CockroachDB 语义召回结果的距离值。

**VO (EN)**:
> This is real agentic memory — every receipt becomes a persistent, queryable memory in CockroachDB. It uses the Managed MCP Server for database management and distributed vector indexing for semantic recall. Both CockroachDB tools required by the hackathon.

**中文对照**：这就是真正的 agentic memory——每张小票变成持久可查的记忆。比赛要求的两个 CockroachDB 工具：MCP Server 管理数据库，向量索引做语义检索。

---

## Shot 7 · 技术总结（2:30–2:45）

**画面**：切到 README 架构图（3 秒）→ 切回应用开发者工具 Network 面板展示演示票 0 网络请求。

**VO (EN)**:
> Three things under the hood: Claude vision with structured outputs — schema-constrained JSON, zero regex cleanup. Demo receipts run fully offline — no API key, no network. Charts are hand-written SVG with a color-vision-safe palette, operable by touch, keyboard, and screen reader.

**中文对照**：引擎盖下三件事：Claude 视觉 + 结构化输出；演示票完全离线；图表手写 SVG + 色盲安全校验。

---

## Shot 8 · 收尾（2:45–3:00）

**画面**：回到官网落地页 hero，光束继续扫。最后 3 秒定格在「拍张小票，账就记好了」。

**VO (EN)**:
> Receipts are the most honest data in consumer spending — line-item detail that bank statements never see. Today it's personal bookkeeping; next: one-click expense reports and household ledgers. SnapLedger — snap a receipt, and it's booked.

**中文对照**：小票是消费世界里最诚实的数据。今天是个人记账，明天是一键报销和家庭账本。小票管家：拍张小票，账就记好了。

---

## 三个比赛的差异化剪辑

| 比赛 | 需要调整的镜头 |
|---|---|
| **CockroachDB × AWS** | 必须完整保留 **Shot 6**（记忆层）；技术总结加一句"the entire memory layer runs on CockroachDB Cloud" |
| **DevNetwork (Nutrient)** | Shot 6 改成接入 Nutrient API 的画面（待 8/17 后）；技术总结加"document processing pipeline" |
| **AI Genesis (lablab.ai)** | 开头 5 秒加团队/项目名牌；结尾强调 MIT 开源；Shot 6 用通用版技术总结替代 |

---

## 录制清单

- [ ] 无痕窗口 + 1920×1080 + 125% 缩放
- [ ] 提前清 localStorage 再种演示数据，保证仪表盘数字和稿子一致
- [ ] 麦克风离嘴 15cm，录音后 -3dB 归一化
- [ ] 背景音乐可选，音量压到 -25dB 以下
- [ ] 导出 H.264 MP4，传 YouTube 设公开
- [ ] CockroachDB 版需要先确认云端账本有数据（运行 `npm run dev` 后在应用里走一遍演示票流程，数据会自动同步）

---

## 按比赛的英文 VO 差异化配音

**CockroachDB × AWS 版（最完整）**

**Shot 6 VO 完整**:
> The receipts you just scanned are stored in CockroachDB Cloud, not just in the browser. I can ask it: "How many coffees last month?" CockroachDB's vector indexing finds semantically similar items — I can see the distance scores in the evidence panel — and SQL aggregation gives me the total: 4 receipts, ¥86.78. This is real agentic memory: every receipt becomes a persistent, queryable memory. It uses the Managed MCP Server for database management and distributed vector indexing for semantic recall — both CockroachDB tools required by the hackathon. The embedding model is currently a reproducible hashing trick for demo stability, but the architecture is swap-ready: one function change to use AWS Bedrock embeddings without touching the vector index.

**DevNetwork 版（接 Nutrient 后更新）**

**Shot 6 VO 完整**:
> SnapLedger's recognition isn't a black box — it's a document processing pipeline. The receipt photo goes through client-side downscale, Claude vision extraction, and schema-validated JSON output. Nutrient's DWS API [待接入] handles document normalization and audit trails for enterprise compliance. All data stays in CockroachDB Cloud with full SQL audit capabilities.

**AI Genesis 版（通用）**

**Shot 6 VO 完整**:
> Under the hood, Claude vision with structured outputs returns schema-constrained JSON — amounts are always numbers, categories always land in the enum. Zero regex cleanup. The demo receipts run fully offline — no API key, no network. Charts are hand-written SVG with a color-vision-safe palette, operable by touch, keyboard, and screen reader. The project is MIT open-source and designed for scale.
