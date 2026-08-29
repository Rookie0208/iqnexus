#!/usr/bin/env bash
# Redeploy app on an existing EC2 instance (does not recreate the instance).
set -euo pipefail

APP_DIR="${APP_DIR:-/opt/iqnexus}"
BUCKET="${ARTIFACT_BUCKET:?ARTIFACT_BUCKET required}"
KEY="${ARTIFACT_KEY:-iqnexus-freetier.tar.gz}"
REGION="${AWS_REGION:-eu-north-1}"

cd "$APP_DIR"

if [ ! -f .env ]; then
  echo "Missing $APP_DIR/.env — create it with AWS_KEY, AWS_SECRET, AWS_REGION, AWS_BUCKET_NAME"
  exit 1
fi

echo "==> Downloading s3://${BUCKET}/${KEY}"
aws s3 cp "s3://${BUCKET}/${KEY}" ./app.tar.gz --region "$REGION"

echo "==> Extracting release (preserving existing .env)"
tar -xzf app.tar.gz
rm -f app.tar.gz
chmod +x deploy-remote.sh 2>/dev/null || true

echo "==> Rebuilding containers"
COMPOSE="docker compose"
if ! docker compose version >/dev/null 2>&1; then
  COMPOSE="docker-compose"
fi
$COMPOSE -f docker-compose.freetier.yml up -d --build

$COMPOSE -f docker-compose.freetier.yml ps
echo "Deploy complete."
