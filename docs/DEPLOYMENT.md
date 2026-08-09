# Deploy CRMAnHung trên server Mắt Bão

## Hiện trạng (hệ cũ — không đụng)

| Hạng mục | Giá trị |
|----------|---------|
| Domain production | `https://crm.anhungland.com` |
| Server | Mắt Bão — `125.253.113.104` |
| SSH | `deploy@…` |
| App root | `/var/www/anhungland-crm/` |
| API (PM2) | `anhungland-api` · port **5000** |
| Web (nginx `root`) | `/var/www/anhungland-crm/web/` |
| DB / ảnh | SQLite + `img/` trong cây `anhungland-crm` (không sync từ CI) |

CRM cũ tiếp tục phục vụ nhân viên cho đến khi crmanhung đủ parity + đã migrate data.

---

## Phương án đã chốt: **cùng VPS, chạy song song**

Không thuê server mới. Trên cùng Mắt Bão:

```
crm.anhungland.com          →  /var/www/anhungland-crm   (cũ, port 5000)
crm-next.anhungland.com     →  Next :5001 + API :5050
```

| Lý do chọn | |
|------------|--|
| An toàn | Deploy nhầm không ghi đè production |
| Rẻ / đơn giản | Một VPS, một user `deploy`, cùng SSH key |
| So sánh dễ | Nhân viên / bạn test `crm-next` trong khi `crm` vẫn chạy |
| Rollback | Cutover chỉ là đổi nginx; giữ cây cũ ≥ 30 ngày |

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

### 1. DNS (panel Mắt Bão)

Tạo bản ghi A:

| Host | Type | Value |
|------|------|-------|
| `crm-next` | A | `125.253.113.104` |

(Hoặc CNAME trỏ về cùng host với `crm` nếu bạn đang dùng pattern đó.)

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

1. Tạo bucket (vd. `crmanhung-staging`).
2. Tạo API token (Object Read & Write) → Access Key ID + Secret.
3. (Khuyến nghị) Custom domain public cho bucket, hoặc bật `r2.dev` public URL.
4. Điền biến R2 vào `.env` (xem dưới).

Chi tiết: [`adr/0005-cloudflare-r2.md`](./adr/0005-cloudflare-r2.md).

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
CORS_ORIGINS=https://crm-next.anhungland.com
R2_ACCOUNT_ID=<cloudflare_account_id>
R2_ACCESS_KEY_ID=<r2_access_key>
R2_SECRET_ACCESS_KEY=<r2_secret>
R2_BUCKET=crmanhung-staging
R2_ENDPOINT=https://<ACCOUNT_ID>.r2.cloudflarestorage.com
R2_PUBLIC_BASE_URL=https://<your-r2-public-domain>
```

### 6. Nginx + SSL

Mẫu server block: [`deploy/nginx/crm-next.anhungland.com.conf`](../deploy/nginx/crm-next.anhungland.com.conf)

```bash
sudo cp .../crm-next.anhungland.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/crm-next.anhungland.com.conf /etc/nginx/sites-enabled/
sudo certbot --nginx -d crm-next.anhungland.com
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
| `DEPLOY_SSH_KEY` | Cùng private key đang dùng cho FacebookCustomerCRM (user `deploy`) |

---

## Deploy tự động

Workflow: [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml)

- Trigger: **workflow_dispatch** (bấm tay) — chưa auto-deploy mỗi push `main`.
- Rsync monorepo → `/var/www/crmanhung/repo/` (giữ `.env` trên server)
- Chạy `scripts/remote_deploy.sh`: `pnpm install` → Prisma migrate → build Nest + Next standalone → `pm2 restart crmanhung-api` + `crmanhung-web`

Sau khi DNS + nginx + Postgres + R2 + `.env` sẵn sàng: Actions → **Deploy CRMAnHung (staging)** → Run workflow.

---

## Cutover production (sau P4 — chưa làm bây giờ)

1. Backup Postgres staging/prod + snapshot R2  
2. Migrate data từ SQLite/`img/` hệ cũ → Postgres + R2  
3. Đổi nginx `crm.anhungland.com` → proxy Next (5001) + API (5050)  
4. Giữ `crm-next` hoặc tắt sau khi ổn định  
5. Giữ `/var/www/anhungland-crm` tối thiểu 30 ngày để rollback  

Chi tiết data: [`MIGRATION.md`](./MIGRATION.md).

---

## Checklist an toàn

- [ ] Không rsync đè `.env`
- [ ] Port 5050 ≠ 5000; Web Next 5001
- [ ] PM2 `crmanhung-api` / `crmanhung-web` ≠ `anhungland-api`
- [ ] CORS chỉ origin `crm-next` (rồi thêm `crm` lúc cutover)
- [ ] `DATABASE_URL` trỏ Postgres (không `file:`)
- [ ] R2 keys chỉ nằm trên server / secrets — không commit
- [ ] Đổi mật khẩu seed `admin123` / `staff123` trên staging
