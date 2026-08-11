# Deploy SnapLedger to AWS App Runner

This deployment serves the landing page, React application, Express API, and
CockroachDB-backed memory assistant from one public AWS URL. The checked-in
`apprunner.yaml` uses the Node.js 22 managed runtime and enables public-demo
mode, which keeps the shared CockroachDB ledger read-only.

## 1. Store the CockroachDB URL in Secrets Manager

Use the same AWS Region for Secrets Manager and App Runner. The examples below
use `us-east-2`.

1. Open **AWS Secrets Manager** → **Store a new secret**.
2. Choose **Other type of secret**.
3. Switch to **Plaintext** and paste only the full value of
   `COCKROACH_DATABASE_URL` from the local `.env` file. Do not include the
   variable name or quotes.
4. Name the secret `snapledger/cockroach-database-url` and save it.
5. Copy the secret ARN from its details page.

Never put the database URL in App Runner's plain-text environment variables.

## 2. Create an App Runner instance role

App Runner needs an instance role to read the secret at runtime.

1. Open **IAM** → **Roles** → **Create role**.
2. Choose **Custom trust policy** and use:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": { "Service": "tasks.apprunner.amazonaws.com" },
      "Action": "sts:AssumeRole"
    }
  ]
}
```

3. Create a customer-managed permissions policy using the following JSON.
   Replace `SECRET_ARN` with the ARN copied in step 1.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": "secretsmanager:GetSecretValue",
      "Resource": "SECRET_ARN"
    }
  ]
}
```

4. Attach that policy to the role and name the role
   `SnapLedgerAppRunnerInstanceRole`.

## 3. Create the App Runner service

The repository changes must be pushed to GitHub before this step.

1. Open **AWS App Runner** in `us-east-2` → **Create service**.
2. Source: **Source code repository** → GitHub.
3. Connect GitHub if needed, then choose:
   - Repository: `wanli1145/snapledger`
   - Branch: `main`
   - Deployment: automatic or manual
4. Deployment settings: choose **Use a configuration file**. App Runner will
   read `/apprunner.yaml` from the repository.
5. Service name: `snapledger-memory`.
6. Use the smallest available CPU and memory settings for the demo.
7. Under **Security**, choose
   `SnapLedgerAppRunnerInstanceRole` as the instance role.
8. Under **Environment variables**, add a runtime secret:
   - Name: `COCKROACH_DATABASE_URL`
   - Source: Secrets Manager
   - Value: the secret ARN from step 1
9. Do not add `SNAPLEDGER_PUBLIC_DEMO` in the console; the checked-in config
   already sets it to `true`.
10. Create and deploy the service.

App Runner can take several minutes to build and start. The build log should
show `npm ci`, `npm run build`, and `npm start` succeeding.

## 4. Configure and verify health checks

If App Runner asks for a health-check path, select HTTP and use:

```text
/api/health
```

After the service becomes **Running**, open its default domain and verify:

```text
https://YOUR_APP_RUNNER_DOMAIN/api/health
https://YOUR_APP_RUNNER_DOMAIN/api/status
https://YOUR_APP_RUNNER_DOMAIN/app.html
```

Expected status fields include:

```json
{
  "ok": true,
  "hasDatabase": true,
  "cloudWritable": false,
  "publicDemo": true
}
```

Then open the ledger, ask the memory assistant a question, and confirm that
CockroachDB evidence is returned. Use the App Runner domain as the functional
demo URL in Devpost.

## Optional model credentials

Real-photo recognition currently uses Anthropic directly. If desired, store
`ANTHROPIC_API_KEY` in Secrets Manager and reference it as another App Runner
runtime secret. The three built-in demo receipts and the CockroachDB memory
assistant work without it.

When the Bedrock allowlisting request is approved, add Bedrock permissions to
the same instance role and deploy the Bedrock integration separately. Bedrock
approval is not required for the App Runner deployment itself.

## Cost control

App Runner is a paid service. After judging, pause or delete the service and
remove unused secrets if the deployment is no longer needed.
