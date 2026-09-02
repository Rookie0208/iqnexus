# GitHub Actions setup checklist

## 1. Create environment

Repository **Settings → Environments → New environment** → name: `production`

(Optional: add protection rules / required reviewers.)

## 2. Add secrets to `production`

| Secret | Description |
|--------|-------------|
| `AWS_ACCESS_KEY_ID` | IAM user for CI (S3 artifact upload to `iqnexus-freetier-artifacts-*`) |
| `AWS_SECRET_ACCESS_KEY` | Secret for CI IAM user |
| `AWS_REGION` | `eu-north-1` |
| `ARTIFACT_BUCKET` | e.g. `iqnexus-freetier-artifacts-149219722014-eu-north-1` |
| `EC2_HOST` | EC2 public IP (e.g. `13.53.108.37`) |
| `EC2_USER` | `ec2-user` |
| `EC2_SSH_KEY` | Full contents of `iqnexus.pem` |

App S3 keys for study material uploads live only in `/opt/iqnexus/.env` on EC2 — **not** in GitHub.

## 3. EC2 prerequisites

- `/opt/iqnexus/.env` exists with app AWS credentials
- Security group allows SSH (port 22) from GitHub Actions IPs, or use a stable runner IP
- Instance can `aws s3 cp` from artifact bucket (instance IAM role or AWS CLI on host)

## 4. Test

1. **Actions → CI** — should pass on push
2. **Actions → Deploy to EC2 → Run workflow** — manual first deploy
3. Verify: `curl http://EC2_HOST/api/health`

## Workflows

- **ci.yml** — build only on PR/push
- **deploy.yml** — deploy on push (when app paths change) or manual trigger

Branches: `main`, `master`, `deploy`
