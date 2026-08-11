# Deploy SnapLedger to AWS ECS Express Mode

Production demo: <https://sn-bca64ddba9d14c37b155bdfd35aa7f86.ecs.us-east-1.on.aws/app>

SnapLedger runs as one Node.js container on Amazon ECS Express Mode. The
container serves the landing page, React application, Express API, and the
CockroachDB-backed memory assistant. The public deployment is read-only so
anonymous visitors cannot modify the shared judging dataset.

> AWS App Runner stopped accepting new customers on April 30, 2026. The
> repository keeps `apprunner.yaml` only as a legacy reference; new deployments
> should use ECS Express Mode.

## Architecture

```text
Browser → ECS Express public endpoint / Application Load Balancer
        → Fargate task (SnapLedger Node.js container)
        → CockroachDB Cloud persistent memory

Source → Docker build → Amazon ECR → ECS Express Mode
Logs   → Amazon CloudWatch Logs
```

## 1. Build the container

The root `Dockerfile` builds the Vite frontend and packages it with the Express
server. Build locally or in AWS CloudShell:

```bash
docker build -t snapledger:latest .
```

The container listens on port `3801` and exposes a database-independent health
endpoint at `/api/health`.

## 2. Push to Amazon ECR

Create an ECR repository in `us-east-1`, authenticate Docker, and push the
image. Replace `AWS_ACCOUNT_ID` where shown.

```bash
aws ecr create-repository \
  --repository-name snapledger \
  --image-scanning-configuration scanOnPush=true \
  --region us-east-1

aws ecr get-login-password --region us-east-1 | \
  docker login --username AWS --password-stdin \
  AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com

docker tag snapledger:latest \
  AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/snapledger:latest
docker push AWS_ACCOUNT_ID.dkr.ecr.us-east-1.amazonaws.com/snapledger:latest
```

## 3. Create the ECS Express service

Open **Amazon ECS → Express Mode** in `us-east-1` and configure:

- Image URI: the ECR image from step 2
- Name: `snapledger`
- Container port: `3801`
- Health check path: `/api/health`
- CPU: `0.25 vCPU`
- Memory: `0.5 GB`
- Minimum tasks: `1`
- Maximum tasks: `1`

Environment variables:

```text
COCKROACH_DATABASE_URL=<CockroachDB connection URL>
SNAPLEDGER_PUBLIC_DEMO=true
SNAPLEDGER_PORT=3801
```

For a long-lived production deployment, store the database URL in AWS Secrets
Manager or Systems Manager Parameter Store and select that secret as the ECS
environment-variable source. Never commit the value to Git.

ECS Express Mode automatically creates the cluster, task definition, Fargate
service, networking, Application Load Balancer, TLS certificate, autoscaling,
and CloudWatch logging resources.

## 4. Verify

```bash
curl https://YOUR_ECS_DOMAIN/api/health
curl https://YOUR_ECS_DOMAIN/api/status
curl https://YOUR_ECS_DOMAIN/api/transactions
curl -H 'content-type: application/json' \
  -d '{"question":"上个月买过几次咖啡？"}' \
  https://YOUR_ECS_DOMAIN/api/memory/ask
```

Expected `/api/status` fields include:

```json
{
  "ok": true,
  "hasDatabase": true,
  "cloudWritable": false,
  "publicDemo": true
}
```

## Cost control

ECS/Fargate, the load balancer, ECR, and CloudWatch can incur charges. This demo
uses the smallest task size and a single task. After judging, delete the ECS
Express service and unused ECR images if the public demo is no longer needed.
