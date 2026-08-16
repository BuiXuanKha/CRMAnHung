# Deploy CRMAnHung trên server Mắt Bão

## Hiện trạng (hệ cũ — không đụng)

| Hạng mục | Giá trị |
|----------|---------|
| Domain production (cũ) | `https://crm.anhungland.com` — **đã chuyển** VPS `103.15.51.19` |
| Server (cũ + mới) | `103.15.51.19` (secret `DEPLOY_SSH_HOST`) |
| SSH | `deploy@103.15.51.19` |
| App root (cũ) | `/var/www/anhungland-crm/` |
| API (PM2) | `anhungland-api` · port **5000** |
| Web (nginx `root`) | `/var/www/anhungland-crm/web/` |
| DB / ảnh | SQLite + `img/` trong cây `anhungland-crm` (không sync từ CI) |

CRM cũ tiếp tục phục vụ nhân viên cho đến khi crmanhung đủ parity + đã migrate data.

---

## Phương án đã chốt: **cùng VPS, chạy song song**

Không thuê server mới. Trên cùng Mắt Bão:

```
crm.anhungland.com   →  CRM cũ (port 5000) — giữ đến khi migrate xong
anhungland.com       →  CRMAnHung mới (Next :5001 + API :5050) — web public + CRM
cdn.anhungland.com    →  R2 ảnh public
```

| Lý do chọn | |
|------------|--|
| Rõ ràng | Domain chính `anhungland.com` cho hệ mới (không dùng `crm-next`) |
| An toàn | CRM cũ vẫn ở `crm.anhungland.com` — không ghi đè |
| Rẻ / đơn giản | Một VPS, cùng SSH |
| Rollback | Giữ cây `/var/www/anhungland-crm` ≥ 30 ngày |

**Không** dùng chung thư mục / PM2 name / port / DB với hệ cũ.

**Storage mới:** PostgreSQL + Cloudflare R2 (không dùng SQLite file / thư mục `uploads` trên VPS).

---

## Bố cục server cho CRMAnHung

```
/var/www/crmanhung/
├── repo/                 # monorepo sync từ GitHub (apps/, packages/, …)
└── scripts/
    └── remote_deploy.sh
```

Postgres và R2 **không** nằm trong cây trên — kết nối qua `.env`.

| Process | Port | Ghi chú |
|---------|------|---------|
| `anhungland-api` (cũ) | 5000 | Giữ nguyên |
| `crmanhung-api` (mới) | **5050** | NestJS — `apps/api/ecosystem.config.cjs` |
| `crmanhung-web` (mới) | **5001** | Next.js standalone — `apps/web/ecosystem.config.cjs` |
| PostgreSQL | 5432 (hoặc socket) | DB `crmanhung` — user riêng |
| Cloudflare R2 | — | Bucket staging/prod; ảnh qua `R2_PUBLIC_BASE_URL` |

---

## Việc cần làm **một lần** trên Mắt Bão / DNS / Cloudflare

> **Chủ sở hữu (không kỹ thuật):** làm theo checklist có hình / bấm từng bước → [`ANHUNGLAND-SETUP.md`](./ANHUNGLAND-SETUP.md).  
> Script một lần trên VPS: [`scripts/bootstrap-vps.sh`](../scripts/bootstrap-vps.sh).

### 1. DNS (Cloudflare — domain đã trên CF)

Thêm / kiểm tra bản ghi:

| Host | Type | Value | Ghi chú |
|------|------|-------|---------|
| `@` | A | `103.15.51.19` | `anhungland.com` → VPS mới |
| `www` | CNAME hoặc A | `@` hoặc `103.15.51.19` | tuỳ chọn |
| `crm` | A | `103.15.51.19` | CRM cũ đã chuyển cùng VPS |
| `cdn` | (R2 Custom Domain) | do Cloudflare R2 quản | ảnh public |

Proxy (đám mây cam) OK cho `@` / `www` / `crm`. SSL Cloudflare: **Full**.

### 2. Thư mục + quyền

```bash
sudo mkdir -p /var/www/crmanhung/{repo,scripts}
sudo chown -R deploy:deploy /var/www/crmanhung
```

### 3. PostgreSQL

Trên VPS (hoặc managed Postgres):

```bash
sudo -u postgres createuser crmanhung -P   # đặt mật khẩu mạnh
sudo -u postgres createdb -O crmanhung crmanhung
```

Connection string trong `.env`:

```env
DATABASE_URL="postgresql://crmanhung:<password>@127.0.0.1:5432/crmanhung?schema=public"
```

### 4. Cloudflare R2

Đã chuẩn bị sẵn (xem skill `cloudflare-r2` / [`R2-SETUP.md`](./R2-SETUP.md)):

| Biến | Giá trị |
|------|---------|
| Public bucket | `anhungland-crm` + CDN `https://cdn.anhungland.com` |
| Private bucket | `anhungland-crm-private` (không CDN) |
| Token | `crmanhung-api-both` (Read & Write cả hai bucket) |

Chi tiết ADR: [`adr/0005-cloudflare-r2.md`](./adr/0005-cloudflare-r2.md).

### 5. File `.env` API (chỉ trên server)

```bash
nano /var/www/crmanhung/repo/apps/api/.env
```

Gợi ý (đổi secret thật):

```env
PORT=5050
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL="postgresql://crmanhung:<password>@127.0.0.1:5432/crmanhung?schema=public"
JWT_ACCESS_SECRET=<random ≥ 32 ký tự>
JWT_REFRESH_SECRET=<random ≥ 32 ký tự khác>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://anhungland.com
R2_ACCOUNT_ID=271dac0fb7f61cb74a3d5427b93661bc
R2_ACCESS_KEY_ID=<r2_access_key>
R2_SECRET_ACCESS_KEY=<r2_secret>
R2_BUCKET=anhungland-crm
R2_ENDPOINT=https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://cdn.anhungland.com
R2_PRIVATE_BUCKET=anhungland-crm-private
```

### 6. Nginx + SSL

Mẫu server block: [`deploy/nginx/anhungland.com.conf`](../deploy/nginx/anhungland.com.conf)

```bash
sudo cp .../anhungland.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/anhungland.com.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d anhungland.com
sudo nginx -t && sudo systemctl reload nginx
```

Ảnh **không** proxy qua nginx VPS — client lấy URL từ `R2_PUBLIC_BASE_URL`.
Web Next.js proxy tới port **5001**; API Nest proxy `/api/` tới **5050**.

### 7. Sudo PM2 cho user `deploy`

Hệ cũ đã có `/etc/sudoers.d/anhungland-deploy`. Bổ sung quyền restart process mới, ví dụ:

```
deploy ALL=(root) NOPASSWD: /usr/bin/pm2
```

(Nếu đã cho full `pm2` thì không cần sửa.)

### 8. GitHub secret (repo **CRMAnHung**)

Settings → Secrets → Actions:

| Secret | Giá trị |
|--------|---------|
| `DEPLOY_SSH_HOST` | IP (hoặc hostname) **server mới** |
| `DEPLOY_SSH_KEY` | Private key OpenSSH user `deploy` trên server mới |

---

## Deploy tự động

Workflow: [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml)

- Trigger: **workflow_dispatch** (bấm tay) — chưa auto-deploy mỗi push `main`.
- Rsync monorepo → `/var/www/crmanhung/repo/` (giữ `.env` trên server)
- Chạy `scripts/remote_deploy.sh`: `pnpm install` → Prisma migrate → build Nest + Next standalone → `pm2 restart crmanhung-api` + `crmanhung-web`

Sau khi DNS + nginx + Postgres + R2 + `.env` sẵn sàng: Actions → **Deploy CRMAnHung (staging)** → Run workflow.

---

## Cutover CRM cũ (sau P4 — chưa làm bây giờ)

Hệ mới đã chạy ở `anhungland.com`. Cutover chỉ xử lý subdomain CRM cũ:

1. Backup Postgres + snapshot R2  
2. Migrate data từ SQLite/`img/` hệ cũ → Postgres + R2  
3. Redirect `crm.anhungland.com` → `https://anhungland.com` (hoặc `/crm`)  
4. Giữ `/var/www/anhungland-crm` tối thiểu 30 ngày để rollback  

Chi tiết data: [`MIGRATION.md`](./MIGRATION.md).

---

## Checklist an toàn

- [ ] Không rsync đè `.env`
- [ ] Port 5050 ≠ 5000; Web Next 5001
- [ ] PM2 `crmanhung-api` / `crmanhung-web` ≠ `anhungland-api`
- [ ] CORS chỉ origin `https://anhungland.com` (thêm `crm` nếu còn redirect tạm)
- [ ] `DATABASE_URL` trỏ Postgres (không `file:`)
- [ ] R2 keys chỉ nằm trên server / secrets — không commit
- [ ] Đổi mật khẩu seed `admin123` / `staff123` trên production
