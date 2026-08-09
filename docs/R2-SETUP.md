# Hướng dẫn Cloudflare R2 — CRMAnHung

Dành cho chủ sở hữu. Agent đọc thêm skill `.cursor/skills/cloudflare-r2/SKILL.md`.

## Đã có sẵn

| Mục | Giá trị |
|-----|---------|
| Account ID | `271dac0fb7f61cb74a3d5427b93661bc` |
| Bucket | `anhungland-crm` |
| Endpoint | `https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com` |
| Region | Asia-Pacific (APAC) |
| Access Key + Secret | Trong `apps/api/.env` + skill `cloudflare-r2` |
| Public URL tạm (`r2.dev`) | `https://pub-a7fdc52e01074525b49243e98faf8b81.r2.dev` |

## Đang chuẩn bị (web public): Custom Domain

**Domain đã chốt:** `cdn.anhungland.com`  
→ Sau khi Active: `R2_PUBLIC_BASE_URL=https://cdn.anhungland.com`

Vì sao: URL `pub-*.r2.dev` bị giới hạn tốc độ, không phù hợp production / web khách xem ảnh.

---

## Việc bạn làm trên Cloudflare (Custom Domain)

### Điều kiện

- Domain `anhungland.com` **đang quản lý DNS trên Cloudflare** (cùng account với R2).  
  Nếu domain đang ở nhà khác (Mắt Bão / nhà đăng ký) mà **chưa** trỏ nameserver về Cloudflare → báo agent trước khi làm.

### Các bước

1. Vào [Cloudflare Dashboard](https://dash.cloudflare.com) → **R2** → bucket **`anhungland-crm`**.
2. Tab **Settings**.
3. Mục **Custom Domains** → **Connect Domain** (hoặc Add).
4. Nhập: `cdn.anhungland.com` → Continue / Connect.
5. Cloudflare thường **tự tạo** bản ghi DNS kiểu CNAME cho `cdn` trỏ về R2.  
   Nếu hỏi xác nhận DNS → **Confirm** / Allow.
6. Đợi trạng thái **Active** (có thể vài phút). SSL sẽ hiện hợp lệ khi xong.
7. Thử mở trình duyệt:  
   `https://cdn.anhungland.com`  
   (có thể 404 / trang trống nếu chưa có file — miễn là **không** lỗi DNS/SSL là được).
8. **Gửi cho agent** (hoặc chụp màn Active):  
   `R2_PUBLIC_BASE_URL=https://cdn.anhungland.com`

Agent sẽ cập nhật `.env`, `.env.example`, skill `cloudflare-r2`.

### Giữ hay tắt `r2.dev`?

- Có thể **giữ Enable** `pub-….r2.dev` làm dự phòng khi test.
- App **chính** dùng `cdn.anhungland.com` sau khi Active.

---

## API Token (đã làm — chỉ khi tạo lại)

1. R2 → **Manage R2 API Tokens** → Create  
2. Object Read & Write · bucket `anhungland-crm`  
3. Lưu Access Key ID + Secret (hiện một lần)

Token `cfat_…` không dùng cho upload S3.

---

## App dùng R2 thế nào

1. Upload → API Nest → R2 `PutObject`  
2. DB lưu `objectKey`  
3. Web hiện: `https://cdn.anhungland.com/<objectKey>`

ADR: [`adr/0005-cloudflare-r2.md`](./adr/0005-cloudflare-r2.md).

---

## Checklist

- [x] Account / bucket / endpoint  
- [x] Access Key + Secret  
- [x] Public URL tạm `r2.dev`  
- [ ] **Custom domain `cdn.anhungland.com` Active** ← bạn làm bước này  
- [ ] Agent đổi `R2_PUBLIC_BASE_URL` sang `https://cdn.anhungland.com`
