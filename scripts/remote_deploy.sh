#!/usr/bin/env bash
# Chạy TRÊN server Mắt Bão sau khi monorepo đã sync vào /var/www/crmanhung/repo
# User deploy: pm2 qua sudo (giống FacebookCustomerCRM).
set -euo pipefail

ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}"
REPO="$ROOT/repo"
API="$REPO/apps/api"
WEB="$REPO/apps/web"
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

echo "==> Build Web (Next.js standalone)"
cd "$WEB"
if [[ ! -f .env.production ]]; then
  # List lô/GD vẫn mock; /login + /khach-hang = API
  printf 'NEXT_PUBLIC_API_URL=/api/v1\nNEXT_PUBLIC_USE_MOCK=true\nNEXT_PUBLIC_USE_MOCK_AUTH=false\n' > .env.production
elif ! grep -q '^NEXT_PUBLIC_USE_MOCK_AUTH=' .env.production; then
  echo 'NEXT_PUBLIC_USE_MOCK_AUTH=false' >> .env.production
fi
pnpm run build

# standalone cần static + public cạnh server.js
# distDir = .next-build → Next phục vụ /_next/static từ .next-build/static, không phải .next/static
STANDALONE="$WEB/.next-build/standalone"
mkdir -p "$STANDALONE/apps/web/.next-build/static"
rsync -a "$WEB/.next-build/static/" "$STANDALONE/apps/web/.next-build/static/"
if [[ -d "$WEB/public" ]]; then
  rsync -a "$WEB/public/" "$STANDALONE/apps/web/public/"
fi

echo "==> PM2 restart crmanhung-api"
if pm2_cmd describe crmanhung-api >/dev/null 2>&1; then
  pm2_cmd restart crmanhung-api --update-env
else
  cd "$API"
  pm2_cmd start ecosystem.config.cjs
fi

echo "==> PM2 restart crmanhung-web"
cd "$WEB"
if pm2_cmd describe crmanhung-web >/dev/null 2>&1; then
  pm2_cmd delete crmanhung-web
fi
pm2_cmd start ecosystem.config.cjs
pm2_cmd save

echo "==> Health checks"
sleep 2
curl -sf "http://127.0.0.1:5050/api/v1/health"
echo
curl -sf "http://127.0.0.1:5001/" >/dev/null && echo "web_local=ok" || echo "web_local=fail"
code=$(curl -s -o /dev/null -w '%{http_code}' https://anhungland.com/ || true)
echo "web_http=$code"
pm2_cmd list
echo "Done. Production crm.anhungland.com không bị thay đổi."
