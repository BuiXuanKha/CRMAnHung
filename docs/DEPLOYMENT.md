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
| DB / ảnh | nằm trong cây `anhungland-crm` (không sync từ CI) |

CRM cũ tiếp tục phục vụ nhân viên cho đến khi crmanhung đủ parity + đã migrate data.

---

## Phương án đã chốt: **cùng VPS, chạy song song**

Không thuê server mới. Trên cùng Mắt Bão:

```
crm.anhungland.com          →  /var/www/anhungland-crm   (cũ, port 5000)
crm-next.anhungland.com     →  /var/www/crmanhung       (mới, port 5050)
```

| Lý do chọn | |
|------------|--|
| An toàn | Deploy nhầm không ghi đè production |
| Rẻ / đơn giản | Một VPS, một user `deploy`, cùng SSH key |
| So sánh dễ | Nhân viên / bạn test `crm-next` trong khi `crm` vẫn chạy |
| Rollback | Cutover chỉ là đổi nginx; giữ cây cũ ≥ 30 ngày |

**Không** dùng chung thư mục / PM2 name / port / file SQLite với hệ cũ.

---

## Bố cục server cho CRMAnHung

```
/var/www/crmanhung/
├── repo/                 # monorepo sync từ GitHub (apps/, packages/, …)
├── web/                  # nginx root = bản build apps/web/dist
├── uploads/              # ảnh upload (không xóa khi rsync)
├── database/             # SQLite production (không sync từ CI)
└── scripts/
    └── remote_deploy.sh
```

| Process | Port | Ghi chú |
|---------|------|---------|
| `anhungland-api` (cũ) | 5000 | Giữ nguyên |
| `crmanhung-api` (mới) | **5050** | `apps/api/ecosystem.config.cjs` |

---

## Việc cần làm **một lần** trên Mắt Bão / DNS

### 1. DNS (panel Mắt Bão)

Tạo bản ghi A:

| Host | Type | Value |
|------|------|-------|
| `crm-next` | A | `125.253.113.104` |

(Hoặc CNAME trỏ về cùng host với `crm` nếu bạn đang dùng pattern đó.)

### 2. Thư mục + quyền

SSH bằng `deploy` (hoặc root rồi `chown`):

```bash
sudo mkdir -p /var/www/crmanhung/{repo,web,uploads,database,scripts}
sudo chown -R deploy:deploy /var/www/crmanhung
```

### 3. File `.env` API (chỉ trên server)

```bash
nano /var/www/crmanhung/repo/apps/api/.env
```

Gợi ý (đổi secret thật):

```env
PORT=5050
HOST=0.0.0.0
NODE_ENV=production
DATABASE_URL="file:/var/www/crmanhung/database/crmanhung.db"
JWT_ACCESS_SECRET=<random ≥ 32 ký tự>
JWT_REFRESH_SECRET=<random ≥ 32 ký tự khác>
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGINS=https://crm-next.anhungland.com
UPLOAD_DIR=/var/www/crmanhung/uploads
```

### 4. Nginx + SSL

Mẫu server block: [`deploy/nginx/crm-next.anhungland.com.conf`](../deploy/nginx/crm-next.anhungland.com.conf)

```bash
sudo cp .../crm-next.anhungland.com.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/crm-next.anhungland.com.conf /etc/nginx/sites-enabled/
# Certbot (giống cách bạn đã làm cho crm.anhungland.com)
sudo certbot --nginx -d crm-next.anhungland.com
sudo nginx -t && sudo systemctl reload nginx
```

### 5. Sudo PM2 cho user `deploy`

Hệ cũ đã có `/etc/sudoers.d/anhungland-deploy`. Bổ sung quyền restart process mới, ví dụ:

```
deploy ALL=(root) NOPASSWD: /usr/bin/pm2
```

(Nếu đã cho full `pm2` thì không cần sửa.)

### 6. GitHub secret (repo **CRMAnHung**)

Settings → Secrets → Actions:

| Secret | Giá trị |
|--------|---------|
| `DEPLOY_SSH_KEY` | Cùng private key đang dùng cho FacebookCustomerCRM (user `deploy`) |

---

## Deploy tự động

Workflow: [`.github/workflows/deploy-staging.yml`](../.github/workflows/deploy-staging.yml)

- Trigger: **workflow_dispatch** (bấm tay) — chưa auto-deploy mỗi push `main` để tránh đụng server khi foundation còn thay đổi nhiều.
- Rsync monorepo → `/var/www/crmanhung/repo/` (giữ `.env`, `uploads/`, `database/`)
- Chạy `scripts/remote_deploy.sh`: `pnpm install` → migrate → build web → publish `web/` → `pm2 restart crmanhung-api`

Sau khi DNS + nginx + `.env` sẵn sàng: Actions → **Deploy CRMAnHung (staging)** → Run workflow.

---

## Cutover production (sau P4 — chưa làm bây giờ)

1. Backup DB + uploads hệ cũ  
2. Migrate data vào `/var/www/crmanhung/database/`  
3. Đổi nginx `crm.anhungland.com` → `root` + `proxy_pass` sang crmanhung (port 5050)  
4. Giữ `crm-next` hoặc tắt sau khi ổn định  
5. Giữ `/var/www/anhungland-crm` tối thiểu 30 ngày để rollback  

Chi tiết data: [`MIGRATION.md`](./MIGRATION.md).

---

## Checklist an toàn

- [ ] Không rsync đè `.env` / `database/` / `uploads/`
- [ ] Port 5050 ≠ 5000
- [ ] PM2 name `crmanhung-api` ≠ `anhungland-api`
- [ ] CORS chỉ origin `crm-next` (rồi thêm `crm` lúc cutover)
- [ ] Đổi mật khẩu seed `admin123` / `staff123` trên staging
