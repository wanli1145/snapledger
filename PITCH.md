# 路演稿 · 小票管家 SnapLedger

> **版本**：通用完整版（3 分钟）+ 三个比赛的差异化剪辑点。
> 按照此脚本录制，口播逐句念英文 VO、中文括号内是表演提示。

---

## 开场钩子（0:00–0:25）

**EN VO**:
> How many expense-tracking apps have you abandoned? It's not laziness — it's typing. Every entry, every field, thirty seconds each. SnapLedger kills the typing. Snap a receipt, and it's booked.

**中文对照**：你放弃过几个记账 App？不是因为懒，是因为打字。每一笔 30 秒。小票管家干掉的就是「打字」这个动作——拍张小票，账就记好了。

**画面**：官网落地页，扫描光束扫过小票（3 秒停顿），点「打开应用」进入应用。

---

## 核心流程（0:25–1:25）

**EN VO (0:25–0:45)**:
> Here's a typical supermarket receipt — six items, groceries mixed with household goods. *(let animation play)* Every line extracted. Milk and eggs filed under Groceries; tissues and detergent under Household.

**中文对照**：一张典型超市小票，六件商品。（等动画）每一行都读出来了。

**画面**：点击演示票「超市采购」→ 扫描光束动画 → 结果呈现。

**EN VO (0:45–1:00)**:
> AI won't be right 100% of the time — so every single line is editable, right on the receipt. Change a category, fix a price. The total recalculates live, and it flags any mismatch against the printed total.

**中文对照**：AI 不可能永远对——每一行都能直接改。改分类，改金额，合计实时重算，对不上还标红。

**画面**：点开一行的分类下拉改一下，再改回来；金额改一下再改回。

**EN VO (1:00–1:25)**:
> Confirm — and stamp. *(pause for seal)* Bookkeeping finally has a moment of ceremony. *(navigate to ledger)* The ledger speaks for itself: monthly total, biggest category, weekend spikes on the trend line. The receipt I just scanned is already on top of the list.

**中文对照**：确认，盖章。（等印章）记账第一次有了仪式感。账本自己会说话：本月总支出、最大分类、周末的尖峰。

**画面**：点确认入账 → 红章落下 → 自动跳账本 → 仪表盘从上到下扫：统计块 → 分类条形 → 趋势图周末尖峰 → 明细最上面一笔。

---

## 技术亮点（1:25–2:10）

### 通用版（所有比赛可用）

**EN VO (1:25–1:40)**:
> Three things under the hood worth knowing. One: Claude vision with structured outputs — the model returns schema-constrained JSON, so amounts are always numbers and categories always land in the enum. Zero regex cleanup.

**中文对照**：引擎盖下三件事：第一，Claude 视觉 + 结构化输出，返回的账目 JSON 被 Schema 约束死，金额必是数字，分类必落枚举。

**画面**：切到 README 架构图（2 秒）→ 切回应用。

**EN VO (1:40–1:55)**:
> Two: the demo receipts run fully offline — no API key, no network, judges-proof. Three: charts are hand-written SVG with a color-vision-safe palette, operable by touch, keyboard, and screen reader.

**中文对照**：第二，演示票完全离线，断网也能演示；第三，图表手写 SVG，配色过了色盲安全校验。

**画面**：开发者工具 Network 面板看演示票请求（0 请求）。

### CockroachDB × AWS 比赛版本（追加 20 秒）

**EN VO (1:55–2:15)**:
> The receipts you just scanned are stored in CockroachDB Cloud, not just in the browser. I can ask it: "How many coffees last month?" *(navigate to memory assistant, ask question, show answer)* CockroachDB's vector indexing finds semantically similar items, and SQL aggregation gives me the total: 4 receipts, ¥86.78.

**中文对照**：刚刚扫描的小票存在 CockroachDB 云端。我可以问它：上个月买过几次咖啡？（到记忆助手，提问，出答案）向量索引语义检索 + SQL 聚合，4 张小票，合计 ¥86.78。

**画面**：切到账本页 → 记忆助手 → 输入「上个月买过几次咖啡？」→ 回答 + 向量证据展开。

**EN VO (2:15–2:30)**:
> This is real agentic memory — every receipt becomes a persistent, queryable memory in CockroachDB. It uses the Managed MCP Server for database management and distributed vector indexing for semantic recall. Both CockroachDB tools required by the hackathon.

**中文对照**：这就是真正的 agentic memory——每张小票变成 CockroachDB 里持久可查的记忆。用的是比赛要求的两个 CockroachDB 工具：Managed MCP Server 管理数据库，分布式向量索引做语义检索。

**画面**：回到架构图，指 MCP 和向量索引两个模块。

---

## 收尾（2:30–3:00）

**EN VO (2:30–2:50)**:
> Receipts are the most honest data in consumer spending — line-item detail that bank statements never see. Today it's personal bookkeeping; next: one-click expense reports and household ledgers. SnapLedger — snap a receipt, and it's booked.

**中文对照**：小票是消费世界里最诚实的数据——银行流水永远看不到的逐行明细。今天是个人记账，明天是一键报销和家庭账本。小票管家：拍张小票，账就记好了。

**画面**：官网落地页 hero 区定格。

**EN VO (2:50–3:00)**:
> Thank you.

**画面**：黑底白字，仓库地址 + demo URL + 视频标题。

---

## 三个比赛的差异化剪辑

| 比赛 | 主要调整 |
|---|---|
| **CockroachDB × AWS** | 技术亮点段（1:25–2:30）全量展示云端记忆层：MCP + 向量索引 + 消费问答。额外需要录一段"memory assistant 真实运行"画面。**最需要这个版本** |
| **DevNetwork (Nutrient 文档赛道)** | 技术亮点段弱化 CockroachDB，强调"文档处理管道"：小票照片 → AI 信息提取 → 结构化数据 → 仪表盘。可加 5 秒接入 Nutrient API 的画面（开赛后） |
| **AI Genesis (lablab.ai)** | 开头 5 秒加团队/项目名牌。技术亮点用通用版。结尾强调 MIT 开源、消费级 AI 应用、适合大规模推广 |

---

## 常见评委提问

**Q: 和支付宝账单导入比，优势在哪？**
> A: 支付流水只有「永辉超市花了 ¥119.80」；小票有逐行明细（牛奶 ¥49.90、鸡蛋 ¥16.80……），颗粒度差一个数量级。两者互补，Roadmap 里就有账单导入。

**Q: 识别准确率？**
> A: 结构化输出杜绝了格式错误这一类问题；内容层面，模型对印刷体小票表现很强，且产品层面用「逐行可编辑 + 合计校验提示」兜底——合计对不上会当场标红。

**Q: 成本？**
> A: 客户端先把图压到 ≤2000px 再上传，单张识别成本约几美分；重度用户每月成本远低于一杯咖啡，可被订阅/增值服务覆盖。

**Q: 为什么不用 OCR + 规则？**
> A: 传统 OCR 输出的是字符流，商品行、折扣行、合计行的语义要靠规则拼，换一家超市就崩。多模态模型直接理解「这是一张小票」，泛化强得多。

**Q: CockroachDB 部分怎么换成真实 embeddings？**
> A: 当前版本用可复现的 hashing trick 做零成本演示；接 AWS Bedrock Titan embeddings 时，只替换 `makeEmbedding()` 函数，VECTOR 列和向量索引路径完全不变。这就是 agentic memory 的设计哲学——模型是可替换的插件，记忆层是持久的基础设施。
