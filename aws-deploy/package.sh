#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
OUT="$ROOT/aws-deploy/package"
STAGE="$OUT/stage"

rm -rf "$OUT"
mkdir -p "$STAGE/nginx" "$STAGE/client-build" "$STAGE/admin-build"

echo "==> Building client (REACT_APP_BASE_API_URL=/api)"
cd "$ROOT/iqnexus-client-main"
if [ ! -d node_modules ]; then npm ci --legacy-peer-deps || npm install --legacy-peer-deps; fi
REACT_APP_BASE_API_URL=/api CI=false npm run build
rm -rf "$STAGE/client-build"/*
cp -R build/* "$STAGE/client-build/"

echo "==> Building admin (VITE_BASE_API_URL=/api)"
cd "$ROOT/iqnexus-admin-main"
if [ ! -d node_modules ]; then npm ci || npm install; fi
VITE_BASE_API_URL=/api npm run build
rm -rf "$STAGE/admin-build"/*
cp -R dist/* "$STAGE/admin-build/"

echo "==> Copying backend + compose"
cp -R "$ROOT/iqnexus-backend-main" "$STAGE/iqnexus-backend-main"
rm -rf "$STAGE/iqnexus-backend-main/node_modules" \
       "$STAGE/iqnexus-backend-main/.git" \
       "$STAGE/iqnexus-backend-main/.env" \
       "$STAGE/iqnexus-backend-main/uploads" \
       "$STAGE/iqnexus-backend-main/utils/db-dump-"* 2>/dev/null || true
cp "$ROOT/aws-deploy/docker-compose.freetier.yml" "$STAGE/docker-compose.freetier.yml"
cp "$ROOT/aws-deploy/nginx/freetier.conf" "$STAGE/nginx/freetier.conf"
cp "$ROOT/aws-deploy/deploy-remote.sh" "$STAGE/deploy-remote.sh"
chmod +x "$STAGE/deploy-remote.sh"

# Optional: include DB dump from repo root or parent directory
DB_DUMP=""
for candidate in \
  "$ROOT/db-dump-2026-03-14-1773488291594" \
  "$ROOT/../db-dump-2026-03-14-1773488291594"; do
  if [ -d "$candidate" ]; then
    DB_DUMP="$candidate"
    break
  fi
done

if [ -n "$DB_DUMP" ]; then
  echo "==> Copying DB dump (without admitCards blobs)"
  mkdir -p "$STAGE/db-dump"
  for f in "$DB_DUMP"/*.json; do
    base="$(basename "$f")"
    case "$base" in
      admitCards.*) echo "    skip $base";;
      *) cp "$f" "$STAGE/db-dump/";;
    esac
  done
fi

echo "==> Creating tarball"
cd "$STAGE"
tar -czf "$OUT/iqnexus-freetier.tar.gz" .
ls -lh "$OUT/iqnexus-freetier.tar.gz"
echo "Package ready: $OUT/iqnexus-freetier.tar.gz"
