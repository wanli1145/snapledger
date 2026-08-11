# Devpost 提交文案包 · Submission Kit

> 两个 Devpost 比赛「Create project」时直接复制粘贴。占位符 `[]` 记得替换。

---

## 通用素材

- **Repo URL**: https://github.com/wanli1145/snapledger （已 public，About 区记得选 MIT license）
- **Demo URL**: https://wanli1145.github.io/snapledger/ （GitHub Pages 自动部署；演示票流程纯静态可跑）
- **Video URL**: `[YouTube 链接]`（按 DEMO_SCRIPT.md 录，≤3 分钟）

**Elevator pitch（60 字内 tagline，二选一）**

> Snap a receipt, and it's booked — AI reads every line item, categorizes it, and charts your spending.

> Kill the typing in expense tracking: photo in, categorized ledger out.

---

## A · CockroachDB × AWS「Build with Agentic Memory」

⚠️ 提交的是**比赛期内新建的「消费记忆智能体」变体**，文案要以记忆层为主角。

**Project name**: `SnapLedger Memory — a spending agent that never forgets`

**Tagline**: `Receipts become agentic memory: scan, book, then ask "how many coffees last month?" — answered from CockroachDB vector memory.`

**About the project 各栏**：

- *Inspiration*: Expense apps die because entries require typing, and even AI scanners forget everything after each scan. We wanted an agent that **accumulates spending memory** — so every receipt makes it smarter.
- *What it does*: Snap a receipt → Claude extracts structured line items → items are embedded and persisted to **CockroachDB with distributed vector indexing** as long-term memory → a spending-memory agent answers semantic questions over the full history ("how often did I order delivery this month?"). The complete application is deployed as a container on AWS.
- *How we built it*: React/Vite front end and Node/Express API packaged in Docker, stored in Amazon ECR, and deployed with Amazon ECS Express Mode (Fargate, Application Load Balancer, TLS, autoscaling, and CloudWatch Logs). CockroachDB Cloud provides vector search and persistent agent memory. Base receipt-scanning UI is our pre-existing open-source work (disclosed); the entire memory/agent layer was built during the submission period.
- *Challenges / Accomplishments / What's next*: `[比赛期内如实填写]`
- **"Which CockroachDB tools did you use and how"**: (1) Managed MCP Server — authorized in Claude Code for read/write access to the snapledger cluster; used for schema management, demo data seeding, and interactive database inspection. (2) Distributed Vector Indexing — every booked line item gets a vector embedding (current: reproducible hashing trick, swap-ready for AWS Bedrock embeddings) stored in `VECTOR(1024)` columns; the agent's spending-memory queries run on vector search (`<=>` operator) alongside SQL aggregation, answering questions like "how many coffees last month?"
- **"Which AWS services"**: Amazon ECS Express Mode runs the complete public application on AWS Fargate; Amazon ECR stores the container image; an Application Load Balancer provides the public HTTPS endpoint; Amazon CloudWatch captures service logs and deployment metrics.

**Built with**: `react` `vite` `node.js` `express` `cockroachdb` `amazon-ecs` `aws-fargate` `amazon-ecr` `cloudwatch` `claude` `mcp`

---

## B · DevNetwork [API + Cloud + AI]（8/17 开赛后创建）

**Project name**: `SnapLedger — snap a receipt, and it's booked`

**Tagline**: 用上面通用 elevator pitch。

**About the project 各栏**：

- *Inspiration*: People don't abandon expense trackers out of laziness — they abandon typing. We collapsed bookkeeping into one action: take a photo.
- *What it does*: AI vision reads receipts line by line, auto-categorizes into 8 spending buckets, renders results as an editable thermal receipt (human-in-the-loop), stamps them into a local-first ledger, and charts monthly spending — offline demo mode included.
- *How we built it*: Claude vision + structured outputs (schema-constrained JSON, zero regex cleanup); hand-written SVG charts with a CVD-validated palette; React/Vite PWA; Express API. `[若接入 Nutrient：加一段 document-processing pipeline 集成说明，对准其赛道]`
- *Challenges*: hostile receipts (crumpled/tilted), demo reliability on venue Wi-Fi (solved with offline demo receipts), accessibility (touch/keyboard/screen-reader operable charts).
- *What's next*: expense-report export, WeChat/Alipay statement import, household ledgers.

**Built with**: `react` `vite` `node.js` `express` `claude` `anthropic-api` `pwa` `[nutrient]`

---

## 提交前最后核对

- [ ] 仓库 public + LICENSE 可见 + README.en.md 在首页
- [ ] Demo URL 打开 10 秒内能完成一次演示票扫描
- [ ] 视频公开可看（无地区限制），≤3:00
- [ ] CockroachDB 版：披露已有代码基础的说明写进 README 和 About
- [ ] 时区再确认：CockroachDB 截止 = 北京时间 8/19 凌晨 5:00
