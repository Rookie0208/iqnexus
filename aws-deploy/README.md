# IQNexus AWS free-tier deploy (eu-north-1)

## URLs
- **Student:** https://student.iqnexus.in/
- **Admin:** https://admin.iqnexus.in/
- **API:** `/api` on both hosts

## Cloudflare DNS
| Name | Type | Content | Proxy |
|------|------|---------|-------|
| `student` | A | EC2 public IP | Proxied |
| `admin` | A | EC2 public IP | Proxied |

SSL/TLS mode: **Flexible** until origin has its own certificates.

## CI/CD (routine deploys)
Push to `main` runs GitHub Actions: build → S3 artifact → SSH to existing EC2 → `deploy-remote.sh`.

Required GitHub secrets: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_REGION`, `ARTIFACT_BUCKET`, `EC2_HOST`, `EC2_USER`, `EC2_SSH_KEY`.

Manual redeploy from your machine:
```bash
bash aws-deploy/package.sh
aws s3 cp aws-deploy/package/iqnexus-freetier.tar.gz s3://YOUR_ARTIFACT_BUCKET/iqnexus-freetier.tar.gz
ssh ec2-user@EC2_HOST 'cd /opt/iqnexus && ARTIFACT_BUCKET=YOUR_ARTIFACT_BUCKET AWS_REGION=eu-north-1 bash deploy-remote.sh'
```

## Infra bootstrap (new EC2 only)
```bash
bash aws-deploy/deploy.sh
```

## EC2 app env (`/opt/iqnexus/.env`)
```env
AWS_KEY=...
AWS_SECRET=...
AWS_REGION=ap-south-1
AWS_BUCKET_NAME=epocho-1.2
```

## SSH key (from SSM)
```bash
aws ssm get-parameter \
  --name /ec2/keypair/KEY_PAIR_ID \
  --with-decryption \
  --query Parameter.Value --output text \
  --region eu-north-1 > iqnexus.pem
chmod 400 iqnexus.pem
ssh -i iqnexus.pem ec2-user@PUBLIC_IP
```
