---
name: cloudflare-r2
description: CRMAnHung Cloudflare R2 connection and StorageService usage. Use when uploading files, configuring apps/api .env R2_*, migrating images, or any object storage task. Do not ask the owner to re-provide R2 credentials — they are recorded here and in apps/api/.env.
---

# Cloudflare R2 — CRMAnHung (đã chốt)

**Không hỏi lại chủ sở hữu** Account ID / bucket / endpoint / Access Key / Secret / Public URL — đã cấu hình bên dưới.

Repo phải **private**. Không đăng secrets ra chat công khai / PR screenshot.

## Connection (An Hưng Land)

| Biến | Giá trị |
|------|---------|
| `R2_ACCOUNT_ID` | `271dac0fb7f61cb74a3d5427b93661bc` |
| `R2_BUCKET` | `anhungland-crm` |
| `R2_ENDPOINT` | `https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | `7a6b2fb153f8469fc4d09e242aea725a` |
| `R2_SECRET_ACCESS_KEY` | `908590b4b338ecb65ffa0a84661eefa5bb32f693ac28a359a8eb6cbf7932111f` |
| `R2_PUBLIC_BASE_URL` | Tạm: `https://pub-a7fdc52e01074525b49243e98faf8b81.r2.dev` → **đổi sang** `https://cdn.anhungland.com` khi Custom Domain Active |

- Region: Asia-Pacific (APAC)
- Token Cloudflare dạng `cfat_…` **không** dùng cho S3 upload — bỏ qua
- **Production / web public:** bắt buộc custom domain `cdn.anhungland.com` (xem `docs/R2-SETUP.md`). Không dùng `pub-*.r2.dev` làm URL chính khi đã Active CDN.

## Bootstrap `.env` khi thiếu

1. Nếu `apps/api/.env` đã có đủ `R2_*` → dùng file đó.
2. Nếu thiếu `.env` hoặc thiếu `R2_*`:
   - Copy từ `apps/api/.env.example`
   - Điền đúng bảng Connection ở trên (kể cả Access Key + Secret)
   - **Không** `git add` file `.env`
3. Production/staging trên VPS: cùng giá trị trong `/var/www/crmanhung/repo/apps/api/.env` (không rsync đè từ CI).

## Code

- Service: `apps/api/src/storage/storage.service.ts` (`StorageModule` global)
- Upload → `storage.upload({ folder, buffer, contentType, originalName })` → `{ objectKey, url }`
- DB lưu **`objectKey`**, không lưu path VPS
- URL công khai = `R2_PUBLIC_BASE_URL` + `/` + `objectKey`
- Validate MIME + size trước `PutObject`
- Docs chủ sở hữu: [`docs/R2-SETUP.md`](../../../docs/R2-SETUP.md) · ADR [`docs/adr/0005-cloudflare-r2.md`](../../../docs/adr/0005-cloudflare-r2.md)

## Checklist agent

- [ ] Không hỏi lại R2 credentials nếu bảng trên còn đúng
- [ ] Không commit `.env` / Secret
- [ ] Feature upload dùng `StorageService`, không ghi disk `uploads/`
