#!/usr/bin/env bash
# Deploy IQNexus free-tier stack to eu-north-1 (infra bootstrap — not for routine app updates)
set -euo pipefail

REGION="${AWS_REGION:-eu-north-1}"
STACK_NAME="${STACK_NAME:-iqnexus-freetier}"
ACCOUNT_ID="$(aws sts get-caller-identity --query Account --output text)"
BUCKET="iqnexus-freetier-artifacts-${ACCOUNT_ID}-${REGION}"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
PKG="$ROOT/aws-deploy/package/iqnexus-freetier.tar.gz"

unset HTTP_PROXY HTTPS_PROXY http_proxy https_proxy ALL_PROXY all_proxy || true

echo "==> Packaging app"
bash "$ROOT/aws-deploy/package.sh"

echo "==> Ensuring artifact bucket s3://$BUCKET"
if ! aws s3api head-bucket --bucket "$BUCKET" --region "$REGION" 2>/dev/null; then
  aws s3api create-bucket \
    --bucket "$BUCKET" \
    --region "$REGION" \
    --create-bucket-configuration LocationConstraint="$REGION"
  aws s3api put-public-access-block \
    --bucket "$BUCKET" \
    --public-access-block-configuration BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true
fi

echo "==> Uploading artifact"
aws s3 cp "$PKG" "s3://$BUCKET/iqnexus-freetier.tar.gz" --region "$REGION"

echo "==> Deploying CloudFormation stack $STACK_NAME"
PARAMS=(
  "ParameterKey=ArtifactBucket,ParameterValue=$BUCKET"
  "ParameterKey=ArtifactKey,ParameterValue=iqnexus-freetier.tar.gz"
  "ParameterKey=AwsBucketName,ParameterValue=${AWS_BUCKET_NAME:-epocho-1.2}"
  "ParameterKey=AwsAppRegion,ParameterValue=${AWS_APP_REGION:-ap-south-1}"
)

# Optional app S3 credentials from env (not printed)
if [[ -n "${AWS_KEY:-}" && -n "${AWS_SECRET:-}" ]]; then
  PARAMS+=(
    "ParameterKey=AwsAccessKeyId,ParameterValue=${AWS_KEY}"
    "ParameterKey=AwsSecretAccessKey,ParameterValue=${AWS_SECRET}"
  )
fi

aws cloudformation deploy \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --template-file "$ROOT/aws-deploy/cloudformation.yml" \
  --capabilities CAPABILITY_NAMED_IAM \
  --parameter-overrides "${PARAMS[@]}"

echo "==> Stack outputs"
aws cloudformation describe-stacks \
  --region "$REGION" \
  --stack-name "$STACK_NAME" \
  --query 'Stacks[0].Outputs' \
  --output table

echo "Done. Client: https://student.iqnexus.in/  Admin: https://admin.iqnexus.in/"
echo "Bootstrap may take 5–15 minutes after instance launch (Docker build)."
echo "For routine code updates on an existing instance, use deploy-remote.sh or GitHub Actions."
