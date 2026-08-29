# ADR 0005 — Cloudflare R2 cho file upload

- **Status:** Accepted
- **Date:** 2026-08-09
- **Updated:** 2026-08-29 — ảnh public encode WebP (`sharp`) trước khi PutObject

## Quyết định

- File lưu trên **Cloudflare R2**, không lưu disk VPS.
- API dùng S3 SDK (`@aws-sdk/client-s3` + `s3-request-presigner`).
- DB lưu **object key** (+ cờ visibility nếu cần).

### Hai bucket

| Mục đích | Bucket | Truy cập |
|----------|--------|----------|
| Ảnh / file **công khai** (CDN) | `anhungland-crm` | `https://cdn.anhungland.com/<key>` |
| **Tài liệu mật** (hợp đồng, giấy tờ…) | `anhungland-crm-private` | Chỉ qua **signed URL** từ API (có hạn). **Không** public URL, **không** custom domain |

## Lý do

- CDN nhanh cho ảnh marketing / CRM không mật.
- Tài liệu mật không được “ai có link cũng xem” trên CDN public.
- Signed URL: API kiểm tra quyền user rồi mới cấp link tạm.

## Hệ quả

| Env | Giá trị chốt |
|-----|----------------|
| `R2_BUCKET` | `anhungland-crm` |
| `R2_PUBLIC_BASE_URL` | `https://cdn.anhungland.com` |
| `R2_PRIVATE_BUCKET` | `anhungland-crm-private` |
| Keys / endpoint | Skill `cloudflare-r2` + `.env` |

Code: `StorageService.upload` (public, raster → WebP via `sharp`) · `uploadPrivate` (không convert) · `getPrivateSignedUrl`.

Hướng dẫn owner: [`../R2-SETUP.md`](../R2-SETUP.md).

## Khi nào revisit

- Cloudflare Access trước CDN (hiếm khi cần nếu đã tách bucket).
- Lifecycle / compression khi cost tăng.
