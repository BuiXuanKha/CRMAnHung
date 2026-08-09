# ADR 0005 — Cloudflare R2 cho file upload

- **Status:** Accepted
- **Date:** 2026-08-09

## Quyết định

- Mọi file người dùng tải lên (ảnh khách, lô đất, đính kèm giao dịch / sổ đỏ, messenger…) lưu trên **Cloudflare R2**.
- **Không** lưu file upload trên disk VPS (`/var/www/crmanhung/uploads`).
- API dùng SDK S3-compatible (`@aws-sdk/client-s3`) với endpoint R2.
- DB chỉ lưu **object key** (và metadata cần thiết); URL công khai ghép từ `R2_PUBLIC_BASE_URL` + key (hoặc signed URL khi cần private).

## Lý do

- VPS không phình disk theo ảnh.
- Deploy/rsync không đụng thư mục upload.
- CDN / custom domain R2 phục vụ ảnh nhanh hơn nginx local.
- Cùng pattern cho staging và production (bucket tách theo env).

## Hệ quả

| Env | Biến |
|-----|------|
| Account / keys | `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY` |
| Bucket | `R2_BUCKET` (vd. `crmanhung-staging`, `crmanhung-prod`) |
| Endpoint | `R2_ENDPOINT` = `https://<ACCOUNT_ID>.r2.cloudflarestorage.com` |
| Public URL | `R2_PUBLIC_BASE_URL` (custom domain hoặc `*.r2.dev`) |

- Nginx **không** serve `/uploads/` từ disk.
- Migrate từ hệ cũ: copy `img/` → R2, map path cũ → object key mới (P4).
- Validate MIME + size ở API trước khi `PutObject`.
- Object key do server đặt (`customers/…`, `lodats/…`) — không tin path client.

## Khi nào revisit

- File private-only (hợp đồng) → signed URL ngắn hạn thay vì public bucket.
- Quá nhiều egress / cost → cân nhắc lifecycle / compression.
