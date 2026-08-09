# Hướng dẫn Cloudflare R2 — CRMAnHung

Dành cho chủ sở hữu (không cần biết lập trình). Làm lần lượt các bước dưới.

**Đã lưu trong repo (từ màn Settings bucket):**

| Mục | Giá trị |
|-----|---------|
| Account ID | `271dac0fb7f61cb74a3d5427b93661bc` |
| Bucket | `anhungland-crm` |
| Endpoint | `https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com` |
| Region | Asia-Pacific (APAC) |

File cấu hình mẫu: `apps/api/.env.example` (đã điền 3 dòng trên).

**Trạng thái cấu hình (cập nhật 2026-08-09):**

| Mục | Trạng thái |
|-----|------------|
| Account ID / Endpoint / Bucket | Đã lưu trong `.env.example` + `.env` local |
| Access Key ID + Secret | Đã lưu trong `apps/api/.env` (**không** commit git) |
| Token `cfat_…` (Cloudflare API) | Không cần cho upload S3 — giữ riêng nếu dùng API Cloudflare khác |
| `R2_PUBLIC_BASE_URL` | **Chưa** — cần Bước B bên dưới |

---

## Bước A — Tạo API Token (lấy 2 key)

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → đăng nhập.
2. Menu trái: **R2 Object Storage**.
3. Góc phải / phía trên: **Manage R2 API Tokens** (hoặc **API Tokens**).
4. Bấm **Create API token**.
5. Đặt tên, ví dụ: `crmanhung-api`.
6. Permissions:
   - Object: **Read & Write**
   - (Nếu hỏi Apply to) chọn bucket **`anhungland-crm`** — hoặc All buckets nếu chỉ có 1 bucket.
7. Bấm **Create API Token**.
8. Màn hình sẽ hiện **một lần**:
   - **Access Key ID**
   - **Secret Access Key**
9. **Copy ngay** 2 dòng đó (Secret không hiện lại lần sau).
10. Gửi cho agent qua chat **hoặc** tự dán vào file `.env` trên máy/server (không đưa lên GitHub công khai nếu repo public).

> Không chụp Secret lên group chat rộng / không commit vào git.

---

## Bước B — Cho phép web xem ảnh (Public URL)

Trên bucket **anhungland-crm** → **Settings**, hiện đang:

- Custom Domains: chưa gắn  
- Public Development URL: **Disabled**

App cần một URL công khai để `<img src="…">` hiển thị được.

### Cách 1 — Nhanh (dev / staging): bật R2.dev

1. Bucket **anhungland-crm** → **Settings**.
2. Mục **Public Development URL** → **Allow Access** / Enable.
3. Cloudflare cho một URL dạng:  
   `https://pub-xxxxxxxxxxxx.r2.dev`
4. Copy URL đó → đó là `R2_PUBLIC_BASE_URL` (không có dấu `/` ở cuối).

### Cách 2 — Production đẹp hơn: Custom Domain

1. Cùng trang Settings → **Custom Domains** → **Connect Domain**.
2. Ví dụ: `cdn.anhungland.com` (domain phải nằm trong Cloudflare).
3. Làm theo hướng dẫn DNS (thường tự thêm bản ghi).
4. Khi Active: `R2_PUBLIC_BASE_URL=https://cdn.anhungland.com`

Có thể làm Cách 1 trước để code chạy; sau gắn custom domain rồi đổi biến env.

---

## Bước C — Điền vào `.env` API

Trên máy dev hoặc server staging (`apps/api/.env`):

```env
R2_ACCOUNT_ID=271dac0fb7f61cb74a3d5427b93661bc
R2_BUCKET=anhungland-crm
R2_ENDPOINT=https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com
R2_ACCESS_KEY_ID=...dán Access Key ID...
R2_SECRET_ACCESS_KEY=...dán Secret...
R2_PUBLIC_BASE_URL=https://pub-....r2.dev
```

Production mẫu: `apps/api/.env.production.example`.

---

## App dùng R2 thế nào (để bạn hiểu)

1. Nhân viên / extension upload ảnh → **API Nest** nhận file.
2. API kiểm tra loại/size → gửi lên R2 (`PutObject`).
3. Database chỉ lưu **object key** (đường dẫn trong bucket), không lưu file trên VPS.
4. Web hiện ảnh bằng: `R2_PUBLIC_BASE_URL` + `/` + object key.

Chi tiết kỹ thuật: [`adr/0005-cloudflare-r2.md`](./adr/0005-cloudflare-r2.md).

---

## Checklist gửi lại cho agent

Khi xong, gửi (hoặc xác nhận đã điền `.env`):

- [ ] Access Key ID  
- [ ] Secret Access Key  
- [ ] Public base URL (sau khi bật R2.dev hoặc custom domain)  

Account ID + bucket + endpoint **không cần gửi lại** — đã lưu trong repo.
