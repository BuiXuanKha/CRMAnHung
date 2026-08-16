# Cấu hình anhungland.com (CRM mới)

CRM cũ `crm.anhungland.com` **giữ nguyên** trên cùng VPS mới.

```
crm.anhungland.com  → CRM cũ (port 5000) — đang chạy
anhungland.com     → CRMAnHung mới (Next :5001 + API :5050)
cdn.anhungland.com  → R2 (đã xong)
```

| Hạng mục | Giá trị |
|----------|---------|
| Server mới | `103.15.51.19` |
| SSH deploy | user `deploy` (key-based; không commit mật khẩu) |
| App root mới | `/var/www/crmanhung/` |
| App root cũ | `/var/www/anhungland-crm/` |

---

## Việc bạn còn lại — Cloudflare DNS

1. [Cloudflare](https://dash.cloudflare.com) → domain **`anhungland.com`** → **DNS**
2. Thêm / sửa:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `@` | `103.15.51.19` | Proxied (cam) |
| **A** | `www` | `103.15.51.19` | Proxied (cam) |

3. Bản ghi **`crm`** → cũng `103.15.51.19` nếu CRM cũ đã chuyển sang server này (đang đúng hướng).
4. **`cdn`** — không sửa (R2).
5. SSL/TLS: **Full** (sau khi ổn có thể gắn Origin Certificate).

Sau DNS: mở https://anhungland.com

Tài khoản seed (đổi ngay): `admin` / `admin123` hoặc `staff` / `staff123`

---

## GitHub secrets (để Deploy Actions sau này)

Repo CRMAnHung → Settings → Secrets → Actions:

| Secret | Giá trị |
|--------|---------|
| `DEPLOY_SSH_HOST` | `103.15.51.19` |
| `DEPLOY_SSH_KEY` | Private key deploy (ed25519) — agent đã gắn public key trên server; nhờ agent gửi lại private key nếu cần |

---

## Đã làm trên server (agent)

- [x] Thư mục `/var/www/crmanhung`
- [x] Postgres db/user `crmanhung`
- [x] `.env` API + R2 + CORS `https://anhungland.com`
- [x] Nginx `anhungland.com` (không sửa site `crm`)
- [x] Build + PM2 `crmanhung-api` / `crmanhung-web`
- [x] Seed users
- [x] Health local OK (`:5050`, `:5001`, Host nginx)

Chi tiết kỹ thuật: [`DEPLOYMENT.md`](./DEPLOYMENT.md).
