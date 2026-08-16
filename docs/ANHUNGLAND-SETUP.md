# Cấu hình anhungland.com (CRM mới)

Hướng dẫn **bấm từng bước** cho chủ sở hữu.  
CRM cũ `crm.anhungland.com` **giữ nguyên** (kể cả khi đã chuyển server).

```
crm.anhungland.com  → CRM cũ (giữ nguyên)
anhungland.com     → CRMAnHung mới (server mới)
cdn.anhungland.com  → R2 (đã xong)
```

> **Server:** không còn dùng IP cũ `125.253.113.104`.  
> Điền **IP server mới** vào chỗ `<IP_SERVER_MOI>` bên dưới và vào GitHub secret `DEPLOY_SSH_HOST`.

Agent **không** đăng nhập Cloudflare / SSH giúp bạn. Bạn làm các việc dưới rồi báo lại.

---

## Việc 1 — Cloudflare DNS (bắt buộc)

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → domain **`anhungland.com`**
2. **DNS** → **Records**
3. Thêm / sửa (dùng **IP server mới**):

| Type | Name | Content | Proxy |
|------|------|---------|-------|
| **A** | `@` | `<IP_SERVER_MOI>` | Proxied (đám mây **cam**) |
| **A** | `www` | `<IP_SERVER_MOI>` | Proxied (cam) |

- Bản ghi **`crm`**: nếu CRM cũ cũng chuyển server thì trỏ `crm` → IP server đang chạy CRM cũ; nếu CRM cũ vẫn chỗ khác thì giữ IP cũ của CRM cũ. **Không xóa** `crm` nếu nhân viên còn dùng.
- Bản ghi **`cdn`**: để Cloudflare R2 quản — không sửa tay.

4. **SSL/TLS** → Overview → **Full** (sau khi origin có cert; lúc đầu có thể dùng HTTP origin — xem bootstrap).

5. Đợi 1–5 phút; DNS apex phải resolve được.

---

## Việc 2 — GitHub secrets (repo CRMAnHung)

Repo: **[BuiXuanKha/CRMAnHung](https://github.com/BuiXuanKha/CRMAnHung)**  
→ Settings → Secrets and variables → Actions → **New repository secret**:

| Secret | Giá trị |
|--------|---------|
| `DEPLOY_SSH_HOST` | IP (hoặc hostname) **server mới** |
| `DEPLOY_SSH_KEY` | Private key OpenSSH user `deploy` trên server mới |

---

## Việc 3 — Một lần trên VPS mới (SSH)

```bash
ssh deploy@<IP_SERVER_MOI>
# Sau khi sync/clone repo:
sudo bash /var/www/crmanhung/repo/scripts/bootstrap-vps.sh
```

Script: Postgres + nginx `anhungland.com` + `.env` API.  
**Không** đụng cây / PM2 của CRM cũ.

---

## Việc 4 — Deploy

GitHub **CRMAnHung** → Actions → **Deploy CRMAnHung (staging)** → Run workflow.

---

## Checklist

- [ ] Biết IP server mới → gửi cho agent hoặc điền `DEPLOY_SSH_HOST`
- [ ] DNS A `@` + `www` → IP mới (proxied)
- [ ] Secrets `DEPLOY_SSH_HOST` + `DEPLOY_SSH_KEY` trên CRMAnHung
- [ ] `bootstrap-vps.sh` đã chạy trên server mới
- [ ] Workflow deploy OK
- [ ] `crm.anhungland.com` vẫn vào được như cũ

Chi tiết: [`DEPLOYMENT.md`](./DEPLOYMENT.md).
