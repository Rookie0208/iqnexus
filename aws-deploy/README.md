# IQNexus AWS deploy (eu-north-1)

Production deploy artifacts for EC2. Local dev uses root `docker-compose.yml` — see [../README.md](../README.md).

## URLs
- **Student:** https://student.iqnexus.in/
- **Admin:** https://admin.iqnexus.in/
- **API:** `/api` on both hosts

## GitHub Actions deploy

1. Add secrets (see root README).
2. Merge to `master` (auto-deploy when app paths change), or run **Deploy to EC2** manually in Actions (always deploys `master`).
3. Workflow runs `package.sh` → uploads tarball → SSH → `deploy-remote.sh`.

`deploy-remote.sh` backs up and restores `/opt/iqnexus/.env` so prod S3 keys are never overwritten.

## EC2 app env (`/opt/iqnexus/.env`)

```env
AWS_KEY=...
AWS_SECRET=...
AWS_REGION=eu-north-1
AWS_BUCKET_NAME=epocho-1.2
```

## Manual redeploy

```bash
bash aws-deploy/package.sh
aws s3 cp aws-deploy/package/iqnexus-freetier.tar.gz s3://YOUR_ARTIFACT_BUCKET/ --region eu-north-1
ssh -i ~/iqnexus.pem ec2-user@EC2_HOST \
  'cd /opt/iqnexus && ARTIFACT_BUCKET=YOUR_ARTIFACT_BUCKET AWS_REGION=eu-north-1 bash deploy-remote.sh'
```

## Infra bootstrap (new EC2 only)

```bash
export AWS_REGION=eu-north-1
export AWS_APP_REGION=eu-north-1
export AWS_BUCKET_NAME=epocho-1.2
bash aws-deploy/deploy.sh
```

## SSH key (from SSM)

```bash
aws ssm get-parameter \
  --name /ec2/keypair/KEY_PAIR_ID \
  --with-decryption \
  --query Parameter.Value --output text \
  --region eu-north-1 > iqnexus.pem
chmod 400 iqnexus.pem
```
