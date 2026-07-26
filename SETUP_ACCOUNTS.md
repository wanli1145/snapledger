# 云账号开通教程（CockroachDB 变体开发前置）

> 两个账号，前者 10 分钟零门槛，后者约 40 分钟需要一张 Visa/Mastercard 信用卡。
> 完成后把「交付清单」里的东西给 Claude，即可开工「消费记忆智能体」变体。

---

## 一、CockroachDB Cloud（约 10 分钟，不需要信用卡）

1. 打开 **https://cockroachlabs.cloud/signup** → 点 **Sign up with GitHub**（就用 wanli1145 那个号，最快）。
2. 进控制台后点 **Create Cluster**：
   - Plan 选 **Basic**（免费层：10 GiB 存储 + 每月固定免费请求量，比赛够用）
   - Cloud provider 选 **AWS**（和比赛的 AWS 叙事保持一致）
   - Region 选 **us-east-1**（N. Virginia）
   - 确认费用面板显示 Free，点 **Create**
3. 首次会弹出 **Create SQL user**：记下用户名和自动生成的密码——**密码只显示这一次**，存到备忘录。
4. 集群页点 **Connect** → 选 General connection string → 复制 `postgresql://...` 开头的连接串。
5. 启用 **Managed MCP Server**（比赛要求工具之一）：控制台选中集群 → 找到 MCP Server 配置片段 → 复制备用。
   官方文档：https://www.cockroachlabs.com/docs/cockroachcloud/connect-to-the-cockroachdb-cloud-mcp-server

**✅ 交付清单 A**：连接串、SQL 用户密码、MCP 配置片段。

---

## 二、AWS + Bedrock Claude（约 40 分钟）

> ⚠️ 注册的是 **AWS 国际版（aws.amazon.com）**，不是 AWS 中国区（amazonaws.cn）——
> Bedrock 的 Claude 模型只在国际版提供。国际版**不支持银联**，需要 Visa 或
> Mastercard 的双币/全币种信用卡（会有 $1 预授权验证，几天后退回）。

### 1. 注册账号（约 15 分钟）

1. https://aws.amazon.com → **Create an AWS Account**
2. 填邮箱 + 账户名 → 收邮箱验证码 → 设置 root 密码
3. 联系信息：选 **Personal**，姓名地址用拼音如实填写
4. 绑卡：Visa / Mastercard 信用卡
5. 手机验证：+86 手机号可正常收短信
6. Support plan 选 **Basic support - Free**
7. 注册完成，用 root 账号登录控制台

### 2. 开通 Bedrock 的 Claude 模型（约 10 分钟）

1. 控制台右上角把 **Region 切到 US West (Oregon) us-west-2**（或 us-east-1，记住选了哪个）
2. 顶部搜索栏搜 **Bedrock** → 进入 Amazon Bedrock 控制台
3. 左侧菜单最下方 **Model access** → 点 **Manage model access / Modify model access**
4. 勾选 **Anthropic** 下的 Claude 模型（有哪个新勾哪个，多勾无妨）
5. Anthropic 模型会要求填一个用途表单：Company name 填 `Personal project`，用途写
   `Hackathon project: AI receipt-recognition expense tracker` 即可
6. 提交后回到 Model access 页，通常几分钟内状态变为 **Access granted** ✅

### 3. 创建给代码用的密钥（约 10 分钟）

1. 顶部搜 **IAM** → 左侧 **Users** → **Create user**，名字 `snapledger-dev`，
   **不要**勾选控制台访问
2. 权限：选 **Attach policies directly** → 搜索并勾选 **AmazonBedrockFullAccess**
3. 创建完成 → 点进该用户 → **Security credentials** 标签 → **Create access key**
   → 用途选 **Local code / CLI** → 创建
4. 记下 **Access key ID** 和 **Secret access key**——Secret 只显示这一次

### 4. 设置费用告警（强烈建议，5 分钟）

控制台搜 **Budgets** → Create budget → 模板选 Monthly cost budget → 金额填 **$10**
→ 填自己邮箱。超支会发邮件。

**费用预期**：Bedrock 按 token 计费（Claude 无免费额度），识别一张小票约几美分，
整个比赛开发 + 演示 **< $5**；Lambda/S3 在免费层内。

**✅ 交付清单 B**：`AWS_ACCESS_KEY_ID`、`AWS_SECRET_ACCESS_KEY`、所选 Region。

---

## 三、密钥怎么交给 Claude（安全）

**不要**把密钥贴进截图、git 提交、Slack 或任何公开位置。正确姿势——在项目目录建
`.env` 文件（已被 .gitignore 忽略，不会被提交）：

```bash
# /Users/caomai/hackthon/.env
COCKROACH_DATABASE_URL=postgresql://...
AWS_ACCESS_KEY_ID=AKIA...
AWS_SECRET_ACCESS_KEY=...
AWS_REGION=us-west-2
```

建好后在对话里说一句「密钥放 .env 了」即可开工。

## 常见问题

- **没有 Visa/MC 信用卡？** 可用家人的卡（姓名填持卡人）、或办一张虚拟全币卡。
  银联卡只在 AWS 中国区可用，而中国区没有 Bedrock Claude。
- **Model access 一直 pending？** 检查是否填了用途表单；换 us-east-1 再试；
  超过 1 小时可在比赛 Slack 的 AWS 频道问。
- **担心花超？** 除了 Budgets 告警，比赛结束后把 IAM 密钥删除、集群删掉即可归零。
