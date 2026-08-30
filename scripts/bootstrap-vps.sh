#!/usr/bin/env bash
# Bootstrap một lần trên VPS Mắt Bão cho anhungland.com (CRMAnHung).
# KHÔNG đụng /var/www/anhungland-crm hay PM2 anhungland-api.
#
# Chạy: sudo bash scripts/bootstrap-vps.sh
# (từ cây repo đã sync, hoặc copy file này lên server)
set -euo pipefail

if [[ "$(id -u)" -ne 0 ]]; then
  echo "Chạy với sudo: sudo bash $0"
  exit 1
fi

ROOT="${CRMANHUNG_ROOT:-/var/www/crmanhung}"
REPO="$ROOT/repo"
API_ENV="$REPO/apps/api/.env"
NGINX_SRC="$REPO/deploy/nginx/anhungland.com.conf"
NGINX_AVAIL="/etc/nginx/sites-available/anhungland.com.conf"
NGINX_ENABLED="/etc/nginx/sites-enabled/anhungland.com.conf"
DEPLOY_USER="${DEPLOY_USER:-deploy}"

echo "==> CRMAnHung bootstrap → $ROOT (user app: $DEPLOY_USER)"

# --- dirs ---
mkdir -p "$ROOT/repo" "$ROOT/scripts" /var/www/certbot
if id "$DEPLOY_USER" >/dev/null 2>&1; then
  chown -R "$DEPLOY_USER:$DEPLOY_USER" "$ROOT"
fi

# --- PostgreSQL ---
if ! command -v psql >/dev/null 2>&1; then
  echo "==> Cài postgresql"
  apt-get update -y
  apt-get install -y postgresql postgresql-contrib
  systemctl enable --now postgresql
fi

DB_PASS_FILE="$ROOT/.pg_crmanhung_password"
if [[ ! -f "$DB_PASS_FILE" ]]; then
  openssl rand -base64 24 | tr -d '/+=' | head -c 32 > "$DB_PASS_FILE"
  chmod 600 "$DB_PASS_FILE"
  if id "$DEPLOY_USER" >/dev/null 2>&1; then
    chown "$DEPLOY_USER:$DEPLOY_USER" "$DB_PASS_FILE"
  fi
fi
DB_PASS="$(cat "$DB_PASS_FILE")"

sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='crmanhung'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE USER crmanhung WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -c "ALTER USER crmanhung WITH PASSWORD '$DB_PASS';"
sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='crmanhung'" | grep -q 1 \
  || sudo -u postgres psql -c "CREATE DATABASE crmanhung OWNER crmanhung;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE crmanhung TO crmanhung;"

echo "==> Postgres OK (db=crmanhung user=crmanhung; password in $DB_PASS_FILE)"

# --- API .env ---
if [[ ! -f "$API_ENV" ]]; then
  echo "==> Tạo $API_ENV"
  mkdir -p "$(dirname "$API_ENV")"
  JWT_A="$(openssl rand -hex 32)"
  JWT_R="$(openssl rand -hex 32)"
  cat > "$API_ENV" <<EOF
PORT=5050
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL="postgresql://crmanhung:${DB_PASS}@127.0.0.1:5432/crmanhung?schema=public"
JWT_ACCESS_SECRET=${JWT_A}
JWT_REFRESH_SECRET=${JWT_R}
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://anhungland.com,https://www.anhungland.com
R2_ACCOUNT_ID=271dac0fb7f61cb74a3d5427b93661bc
R2_ACCESS_KEY_ID=8477fa7a9ce04776b38339ee13b0a87f
R2_SECRET_ACCESS_KEY=f15f49556ff7d3f03f928043d31736b61bff9da9c7e94b47d56c343bd9598126
R2_BUCKET=anhungland-crm
R2_ENDPOINT=https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://cdn.anhungland.com
R2_PRIVATE_BUCKET=anhungland-crm-private
EOF
  chmod 600 "$API_ENV"
  if id "$DEPLOY_USER" >/dev/null 2>&1; then
    chown "$DEPLOY_USER:$DEPLOY_USER" "$API_ENV"
  fi
else
  echo "==> Giữ nguyên $API_ENV (đã có)"
fi

# --- Web env production hint ---
WEB_ENV="$REPO/apps/web/.env.production"
if [[ -d "$REPO/apps/web" && ! -f "$WEB_ENV" ]]; then
  printf 'NEXT_PUBLIC_API_URL=/api/v1\nNEXT_PUBLIC_USE_MOCK=false\nPUBLIC_SEO_INDEX=1\n' > "$WEB_ENV"
  if id "$DEPLOY_USER" >/dev/null 2>&1; then
    chown "$DEPLOY_USER:$DEPLOY_USER" "$WEB_ENV"
  fi
fi

# --- Nginx ---
if [[ -f "$NGINX_SRC" ]]; then
  cp "$NGINX_SRC" "$NGINX_AVAIL"
  ln -sfn "$NGINX_AVAIL" "$NGINX_ENABLED"
  # Bỏ default conflict nếu trùng server_name (không đụng crm)
  nginx -t
  systemctl reload nginx
  echo "==> Nginx anhungland.com đã gắn (sites-enabled)"
else
  echo "WARN: chưa có $NGINX_SRC — sync repo rồi chạy lại phần nginx"
fi

# --- PM2 sudoers hint ---
if [[ ! -f /etc/sudoers.d/crmanhung-deploy ]]; then
  echo "$DEPLOY_USER ALL=(root) NOPASSWD: /usr/bin/pm2" > /etc/sudoers.d/crmanhung-deploy
  chmod 440 /etc/sudoers.d/crmanhung-deploy
  echo "==> sudoers pm2 cho $DEPLOY_USER"
fi

echo
echo "==== Bootstrap xong ===="
echo "1. DNS Cloudflare: A @ và www → IP server mới (proxied)"
echo "2. GitHub secrets: DEPLOY_SSH_HOST + DEPLOY_SSH_KEY"
echo "3. SSL: Cloudflare Full + Origin Certificate, hoặc certbot"
echo "4. Deploy: GitHub Actions → Deploy CRMAnHung (staging)"
echo "5. Kiểm tra crm.anhungland.com vẫn OK"
echo
