# 去哪儿参赛 · 黑客松报名指南

> 基于 2026-07-26 的网络调研（多来源核实，报名状态以官网为准）。
> 「小票管家」定位：AI 视觉 + 消费级 fintech web 应用——以下比赛按契合度排序。

## 🥇 首选：DevNetwork [API + Cloud + AI] Hackathon 2026（API World 官方赛）

- **链接**：https://api-cloud-ai-hackathon-2026.devpost.com/
- **时间**：线上赛 2026-08-17 开赛，**09-03 截止提交**；线下颁奖 9/2–3（加州 Santa Clara，可不到场）
- **资格**：18+，全球开放，**不限学生**（已核实）
- **为什么契合**：
  - 自由命题赛道直接交现有项目；
  - **Nutrient DWS 文档处理赛道（$1,500）几乎是为小票识别量身定做**——信息提取管道正是本项目内核，接入其文档 API 即可双线参赛；
  - 评审看重"解决真实问题 + 创业可行性"，与 PITCH.md 的叙事一致。
- **行动**：现在就 Devpost 预注册；8/17 开赛后按赛道要求补集成。

## 🥈 主攻：AI Genesis 2026（lablab.ai × /function1 迪拜 AI 大会）

- **链接**：https://lablab.ai/ai-hackathons/ai-genesis-2026（页面有反爬，浏览器打开）
- **时间**：报名开放中，**提交截止 2026-11-02**（双来源核实）；入选者 11/2–3 迪拜现场路演（15,000+ 参会）
- **要求**：作品开源（MIT），线上完赛即可
- **为什么契合**：截止最宽裕，开放 AI 赛道对完成度高的消费级应用友好；Claude 技术栈可直接沿用；有大会曝光和奖池（$60,000+ 宣称）。
- **行动**：把仓库补上 MIT LICENSE 即满足硬性要求；作为打磨后的主攻目标。

## 🥉 快打：CockroachDB × AWS「Agentic Memory」Hackathon

- **链接**：https://cockroachdb-ai.devpost.com/
- **时间**：**提交截止 2026-08-18**（时间紧）
- **要求**：≥2 个 CockroachDB 工具（托管 MCP Server / 向量索引）作记忆层 + ≥1 个 AWS 服务；开源 + 演示视频；18+ 全球
- **改造路径**：小票识别结果作为「消费记忆」入 CockroachDB（按消费语义向量检索），识别走 **AWS Bedrock 上的 Claude（视觉代码几乎不用改，模型 ID 换成 `anthropic.` 前缀）**，升级叙事为「消费管家智能体」。
- **奖金**：$8,750 现金。适合想在 8 月内快速拿结果。
- **当前进度（2026-07-27）**：
  - ✅ CockroachDB Cloud 集群已创建（Basic plan, ap-southeast-1, $400 免费试用，8/25 到期）
  - ✅ 数据库已建好：`receipts` + `receipt_items` + `VECTOR(1024)` 向量列 + `items_embedding_idx` 向量索引
  - ✅ Managed MCP Server 已授权 Claude Code（读写），两个 CockroachDB 工具就绪
  - ✅ 消费记忆问答 API 已实测通过：SQL 聚合 + 向量检索能回答"咖啡花了多少"等语义问题
  - ✅ 92 笔演示账目已同步到云端，仪表盘从 CockroachDB 读取
  - ⏳ AWS 账号 + Bedrock 还未开通

## 💰 高风险高奖池备选：Build with Gemini XPRIZE

- **链接**：https://xprize.devpost.com/ · **截止 2026-08-17** · **总奖池 $2,000,000**
- 「Money & Financial Access」赛道与本项目定位完美对口，但要求：识别引擎换成 Gemini、用至少一个 Google Cloud 产品、并在窗口期内**上线拉到真实用户和收入**。适合想把 demo 直接产品化的团队，工程改造量最大。

## 其他可关注

| 比赛 | 截止 | 备注 |
|---|---|---|
| AI Builders Hackathon (Devpost) | 08-25 | Best SaaS $4,000；标注 students only，非学生先邮件确认 |
| Hack-Nation Global AI（MIT 生态） | 10 月场滚动审核 | 24h 限时 + Venture Track 赛后孵化，想创业可投 |
| MLH Global Hack Week: Data | 09-11 ~ 09-17 | 免费社区活动，练手 + 曝光 |
| QuantumHacks (Devpost) | 08-20 | 明确 fintech 赛道，限学生，奖金小 |

## 多投规则（2026-07 核实）

**三个比赛可以同时报名**，注册免费且互不排斥。但各家对「项目新旧」要求不同：

- **CockroachDB × AWS**（规则已核实）：项目**必须在提交期内新建**（"newly created during the Submission Period"），允许引入已有代码但**必须披露**（"must disclose any other pre-existing code"）。✅ 合规打法：把 SnapLedger 作为披露的开源基础，比赛期内新建「消费记忆智能体」变体（CockroachDB 记忆层 + Bedrock + 部署都是新工作）。团队 ≤5 人，一人可跨多队；一个项目在本比赛内只能拿一个奖（不影响跨比赛获奖）。
- **DevNetwork**：规则全文尚未挂出（开赛 8/17 前后公布），届时确认新建/已有项目条款。稳妥做法相同：提交窗口内做实质新增（接入 Nutrient API、新功能、新录视频）并如实披露。
- **AI Genesis（lablab.ai）**：要求原创 + MIT 开源，惯例为黑客松周（10/26–11/2）内构建。打法：开发周内完成一次大版本迭代作为参赛版本。

**三投心法**：每个比赛交的是**不同的集成变体 + 各自窗口期内的真实新工作 + 单独录制的视频**，而不是同一份东西复制三遍——既合规，评委观感也好。

## 接力日历

| 时间 | 动作 |
|---|---|
| 本周 | 三个比赛全部注册；部署公网 demo；录基础版视频 |
| 7/28 – 8/17 | 开发 CockroachDB 变体（Bedrock + 向量记忆层），**8/17 前提交**（避开与 DevNetwork 开赛撞车） |
| 8/17 – 9/3 | DevNetwork 窗口：接入 Nutrient 文档 API + 按公布的规则补新增，9/3 前提交 |
| 10 月中旬 | 备战 AI Genesis：看伙伴赛道名单定集成方案 |
| 10/26 – 11/2 | AI Genesis 开发周内完成大迭代并提交 |

## 报名前 checklist

- [ ] 录一段 ≤3 分钟演示视频（多数比赛硬性要求；按 PITCH.md 脚本录）
- [ ] 仓库补 LICENSE（MIT）和英文版 README 摘要（国际赛需要）
- [ ] 部署一个公开可访问的 demo（`npm run build && npm start` 单进程，任何 Node 主机可跑）
- [ ] 针对所投比赛的评分维度（技术/创新/落地/演示）微调 PITCH 侧重
