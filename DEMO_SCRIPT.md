# 演示视频分镜脚本 · Demo Video Script

> 目标：**3 分钟以内**（Devpost/CockroachDB 硬性要求 ≤3min；lablab.ai 建议同样长度）。
> 国际比赛用英文配音（每段附中文对照）。录屏 1080p、浏览器 125% 缩放、隐藏书签栏。
> 建议先照本子干读两遍再录；演示操作放慢半拍，光标移动要从容。

---

## Shot 0 · 冷开场（0:00–0:12）

**画面**：官网落地页（`/`），扫描光束正扫过 hero 小票。停 2 秒后缓慢下滑。

**VO (EN)**:
> How many expense-tracking apps have you abandoned? It's not laziness — it's typing. Every entry, every field, thirty seconds each. SnapLedger kills the typing.

**中文对照**：你放弃过几个记账 App？不是因为懒，是因为打字——每一笔 30 秒。小票管家干掉的就是「打字」这个动作。

## Shot 1 · 一句话定位（0:12–0:25）

**画面**：点「打开应用」，进入扫一扫页面，鼠标掠过拖放区。

**VO (EN)**:
> Snap a photo of any shopping receipt. AI reads it line by line — every item, every price — categorizes everything, and books it. You take photos. It keeps books.

**中文对照**：对任何购物小票拍一张照，AI 逐行识读每件商品和金额、自动分类、直接入账。你负责拍照，它负责记账。

## Shot 2 · 扫描（0:25–0:45）

**画面**：点击演示票「超市采购」→ 扫描光束动画完整播放（别跳过，这是产品记忆点）→ 识别结果以小票形态浮现。

**VO (EN)**:
> Here's a typical supermarket receipt — six items, groceries mixed with household goods. *(beat, let the animation play)* Every line extracted. Milk and eggs filed under Groceries; tissues and detergent under Household.

**中文对照**：一张典型的超市小票，六件商品，生鲜和日用品混在一起。（停顿，让动画自己演）每一行都读出来了——牛奶鸡蛋归入食品生鲜，抽纸洗洁精归入日用百货。

## Shot 3 · 人在回路（0:45–1:05）

**画面**：点开「维达抽纸」那行的分类下拉，改成「其他」，再改回来；顺手把一个金额改一下再改回，展示合计实时变化。

**VO (EN)**:
> AI won't be right 100% of the time — so every single line is editable, right on the receipt. Change a category, fix a price; the total recalculates live, and it flags any mismatch against the printed total.

**中文对照**：AI 不可能永远正确——所以每一行都能直接在小票上改。改分类、改金额，合计实时重算，和票面合计对不上还会标红提醒。

## Shot 4 · 盖章入账（1:05–1:20）

**画面**：点「确认入账 ¥119.80」→ 红章砸下 → 自动跳转账本。章落时静音停顿 1 秒。

**VO (EN)**:
> Confirm — and stamp. *(pause for the seal)* Bookkeeping finally has a moment of ceremony.

**中文对照**：确认，盖章。（等印章落下）记账第一次有了仪式感。

## Shot 5 · 仪表盘讲故事（1:20–2:00）

**画面**：账本页从上到下：四个统计块 → 分类构成横条 → 鼠标沿趋势图滑动展示十字线 tooltip（在周末尖峰处停留）→ 滚到账单明细，刚入账的一笔在最上面。

**VO (EN)**:
> The ledger speaks for itself. ¥4,100 this month, up 22% versus the same days last month. Apparel is the biggest bucket at 36%. And these two spikes on the daily trend? Both weekends. The receipt you just scanned is already on top of the list.

**中文对照**：账本自己会说话：本月四千一，环比上月同期涨 22%；服饰美妆占 36% 是大头；趋势图这两个尖峰都是周末。刚扫的那张小票已经躺在明细最上面。

## Shot 6 · 技术三连（2:00–2:35）

**画面**：切到 README 架构图 3 秒 → 切回应用，开发者工具 Network 面板展示一次 `/api/parse-receipt` 的 JSON 响应（提前录好或用演示票时切到代码编辑器展示 RECEIPT_SCHEMA）。

**VO (EN)**:
> Three things under the hood worth knowing. One: Claude vision with structured outputs — the model returns schema-constrained JSON, so amounts are always numbers and categories always land in the enum. Zero regex cleanup. Two: the demo receipts run fully offline — no API key, no network, judge-proof. Three: charts are hand-written SVG with a color-vision-safe palette, operable by touch, keyboard, and screen reader.

**中文对照**：引擎盖下三件事值得一提：一，Claude 视觉 + 结构化输出，模型返回被 Schema 约束死的 JSON，金额必是数字、分类必落枚举，零正则清洗；二，演示票完全离线运行，没有 key、没有网也能演示；三，图表是手写 SVG，配色过了色盲安全校验，触屏键盘读屏都可用。

## Shot 7 · 收尾（2:35–2:55）

**画面**：回到官网落地页 hero，光束继续扫。最后 3 秒定格在「拍张小票，账就记好了」。

**VO (EN)**:
> Receipts are the most honest data in consumer spending — line-item detail that bank statements never see. Today it's personal bookkeeping; next: one-click expense reports and household ledgers. SnapLedger — snap a receipt, and it's booked.

**中文对照**：小票是消费世界里最诚实的数据——银行流水永远看不到的逐行明细。今天是个人记账，明天是一键报销和家庭账本。小票管家：拍张小票，账就记好了。

---

## 按比赛的差异化剪辑

| 比赛 | 调整 |
|---|---|
| **DevNetwork (Nutrient 文档赛道)** | Shot 6 强调「文档处理管道」叙事：extraction pipeline；若接入 Nutrient API 补 5 秒集成画面 |
| **CockroachDB × AWS** | 必须展示记忆层实际运作：Shot 5 后插 20 秒——识别结果写入 CockroachDB、用向量检索按语义查历史消费（"上个月买过几次咖啡？"）；Shot 6 说明 Bedrock 上的 Claude + Lambda 架构 |
| **AI Genesis (lablab.ai)** | 开头 5 秒加"团队/项目名牌"；结尾提 MIT 开源仓库地址 |

## 录制清单

- [ ] 无痕窗口 + 1920×1080，系统语言不影响（应用是中文 UI，国际评委看得懂动效和数字）
- [ ] 提前清 localStorage 再种演示数据，保证仪表盘数字和稿子一致（或照当前数字改稿）
- [ ] 麦克风离嘴 15cm，录音后 -3dB 归一化；背景音乐可选、音量压到 -25dB 以下
- [ ] 导出 H.264 MP4，传 YouTube（Devpost/CockroachDB 要求公开链接）
