#!/usr/bin/env bash
# Chạy TRÊN server Mắt Bão sau khi monorepo đã sync vào /var/www/crmanhung/repo
# User deploy: pm2 qua sudo (giống FacebookCustomerCRM).
set -euo pipefail

ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}"
REPO="$ROOT/repo"
API="$REPO/apps/api"
WEB="$REPO/apps/web"
WEB_DIST="$ROOT/web"
PM2_BIN="$(command -v pm2)"

pm2_cmd() {
  if [[ "$(id -u)" -eq 0 ]]; then
    "$PM2_BIN" "$@"
  else
    sudo -n "$PM2_BIN" "$@"
  fi
}

echo "==> Deploy CRMAnHung from $REPO (user=$(id -un))"

if [[ ! -f "$API/.env" ]]; then
  echo "ERROR: thiếu $API/.env — không ghi đè .env từ CI. Tạo thủ công trước (xem docs/DEPLOYMENT.md)."
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "==> Cài pnpm (corepack)"
  corepack enable
  corepack prepare pnpm@10.33.3 --activate
fi

echo "==> pnpm install (frozen lockfile)"
cd "$REPO"
pnpm install --frozen-lockfile

echo "==> Shared build"
pnpm --filter @crmanhung/shared build

echo "==> Prisma generate + migrate deploy"
cd "$API"
pnpm exec prisma generate
pnpm exec prisma migrate deploy

echo "==> Build API"
cd "$API"
pnpm run build

echo "==> Build Web"
cd "$WEB"
# Production web gọi API same-origin /api/v1 (nginx proxy)
if [[ ! -f .env.production ]]; then
  printf 'VITE_API_URL=/api/v1\n' > .env.production
fi
pnpm run build

echo "==> Publish Web dist → $WEB_DIST"
mkdir -p "$WEB_DIST"
rsync -a --delete "$WEB/dist/" "$WEB_DIST/"

echo "==> PM2 restart crmanhung-api"
if pm2_cmd describe crmanhung-api >/dev/null 2>&1; then
  pm2_cmd restart crmanhung-api --update-env
else
  cd "$API"
  pm2_cmd start ecosystem.config.cjs
fi
pm2_cmd save

echo "==> Health checks"
sleep 2
curl -sf "http://127.0.0.1:5050/api/v1/health"
echo
code=$(curl -s -o /dev/null -w '%{http_code}' https://crm-next.anhungland.com/ || true)
echo "web_http=$code"
pm2_cmd list
echo "Done. Production crm.anhungland.com không bị thay đổi."
