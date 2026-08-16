# Cấu hình anhungland.com (CRM mới)

Hướng dẫn **bấm từng bước** cho chủ sở hữu.  
CRM cũ `crm.anhungland.com` **không đụng**.

```
crm.anhungland.com  → CRM cũ (giữ nguyên)
anhungland.com     → CRMAnHung mới
cdn.anhungland.com  → R2 (đã xong)
```

Agent **không** đăng nhập được Cloudflare / SSH VPS giúp bạn. Bạn làm 2 việc dưới; agent làm phần còn lại qua GitHub Actions.

---

## Việc 1 — Cloudflare DNS (bắt buộc)

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → chọn domain **`anhungland.com`**
2. Menu **DNS** → **Records**
3. Thêm / sửa:

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `@` | `125.253.113.104` | Proxied (đám mây **cam**) |
| **A** | `www` | `125.253.113.104` | Proxied (cam) |

- Nếu đã có A `@` trỏ chỗ khác → **Edit** thành IP trên (không xóa `crm`).
- Bản ghi **`crm`** giữ nguyên → VPS.
- Bản ghi **`cdn`** để Cloudflare R2 quản — không sửa tay.

4. **SSL/TLS** → Overview → mã hóa: chọn **Full** (không Flexible nếu đã có cert origin; lần đầu có thể **Full** sau khi gắn Origin Certificate — xem Việc 3).

5. Đợi ~1–5 phút. Kiểm tra: mở trình duyệt `http://anhungland.com` — có thể chưa ra CRM (chưa deploy), nhưng DNS không được báo “site not found”.

---

## Việc 2 — GitHub secret (bắt buộc để deploy)

Repo mới: **[BuiXuanKha/CRMAnHung](https://github.com/BuiXuanKha/CRMAnHung)**

1. Mở repo **FacebookCustomerCRM** → Settings → Secrets and variables → Actions  
   → mở secret **`DEPLOY_SSH_KEY`** (nếu thấy nút Update thì nhớ: GitHub **không hiện** lại private key đã lưu).
2. Nếu bạn còn file private key ed25519 đã dùng deploy CRM cũ: copy nguyên khối `-----BEGIN … KEY-----` … `-----END … KEY-----`.
3. Vào **CRMAnHung** → Settings → Secrets and variables → Actions → **New repository secret**  
   - Name: `DEPLOY_SSH_KEY`  
   - Value: dán private key  
4. Báo lại agent: *“đã thêm DEPLOY_SSH_KEY + DNS xong”*.

> Cùng key với CRM cũ (`deploy@125.253.113.104`) — an toàn, không đụng thư mục cũ.

---

## Việc 3 — Một lần trên VPS (SSH)

Ai có SSH `deploy@125.253.113.104` chạy:

```bash
# Sau khi code đã có trên server HOẶC clone tạm
sudo bash /var/www/crmanhung/repo/scripts/bootstrap-vps.sh
```

Hoặc từ máy bạn (nếu có key):

```bash
ssh deploy@125.253.113.104
```

Script sẽ:

1. Tạo `/var/www/crmanhung/{repo,scripts}`
2. Cài / kiểm tra PostgreSQL + user/db `crmanhung`
3. Tạo `apps/api/.env` (JWT random + R2 đã biết + CORS `https://anhungland.com`)
4. Gắn nginx `anhungland.com` (không sửa site `crm`)
5. Gợi ý Cloudflare Origin Certificate hoặc certbot

**Không** restart / ghi đè `anhungland-api` hay `/var/www/anhungland-crm`.

---

## Việc 4 — Deploy code (GitHub Actions)

Sau Việc 1–3:

1. GitHub **CRMAnHung** → Actions → **Deploy CRMAnHung (staging)** → **Run workflow**
2. Đợi xanh
3. Mở https://anhungland.com → landing / login CRM mới  
4. https://crm.anhungland.com vẫn là CRM cũ

---

## Checklist nhanh

- [ ] DNS A `@` + `www` → `125.253.113.104` (proxied)
- [ ] Secret `DEPLOY_SSH_KEY` trên repo CRMAnHung
- [ ] `bootstrap-vps.sh` đã chạy (Postgres + nginx + `.env`)
- [ ] Workflow deploy chạy OK
- [ ] `crm.anhungland.com` vẫn vào được như cũ

Chi tiết kỹ thuật: [`DEPLOYMENT.md`](./DEPLOYMENT.md).
