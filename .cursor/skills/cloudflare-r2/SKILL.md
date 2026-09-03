---
name: cloudflare-r2
description: CRMAnHung Cloudflare R2 connection and StorageService usage (public CDN + private signed URLs). Use when uploading files, configuring R2_* env, or secret documents. Do not ask the owner to re-provide R2 credentials already recorded here.
---

# Cloudflare R2 — CRMAnHung (đã chốt)

**Không hỏi lại** credentials / bucket / CDN — bảng dưới. Repo **private**.

## Connection

| Biến | Giá trị |
|------|---------|
| `R2_ACCOUNT_ID` | `271dac0fb7f61cb74a3d5427b93661bc` |
| `R2_ENDPOINT` | `https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com` |
| `R2_ACCESS_KEY_ID` | `8477fa7a9ce04776b38339ee13b0a87f` |
| `R2_SECRET_ACCESS_KEY` | `f15f49556ff7d3f03f928043d31736b61bff9da9c7e94b47d56c343bd9598126` |
| `R2_BUCKET` (public) | `anhungland-crm` |
| `R2_PUBLIC_BASE_URL` | `https://cdn.anhungland.com` |
| `R2_PRIVATE_BUCKET` | `anhungland-crm-private` |

- Token Account API: `crmanhung-api-both` (All buckets, Object Read & Write)
- Token `cfat_…` không dùng cho S3 upload — bỏ qua
- Token cũ `anhungland-crm-r2` (chỉ 1 bucket) có thể **Revoke/Delete** trên Cloudflare cho gọn

## Khi nào dùng bucket nào

| Loại file | Method | Ghi chú |
|-----------|--------|---------|
| Ảnh công khai / CRM không mật | `upload()` | Raster → **WebP** (`sharp`, cạnh dài ≤ 2560) rồi CDN. Gồm ảnh chat **và avatar khách** mới từ `POST /customers/from-extension`. JPEG/PNG cũ: `pnpm images:webp-replace` |
| Hợp đồng, giấy tờ, đính kèm mật | `uploadPrivate()` | Giữ file gốc; chỉ lưu `objectKey` |
| Xem/tải file mật | `getPrivateSignedUrl(key)` | **Sau** khi API check authz; TTL mặc định 15 phút |

## Bootstrap `.env`

Copy `.env.example`, điền bảng Connection (kể cả `R2_PRIVATE_BUCKET`). Không `git add` `.env`.

## Code

`apps/api/src/storage/storage.service.ts` · ADR `docs/adr/0005-cloudflare-r2.md` · Owner `docs/R2-SETUP.md`

## Checklist agent

- [ ] Không hỏi lại R2 nếu bảng còn đúng
- [ ] Tài liệu mật → private bucket + signed URL, không `cdn.anhungland.com`
- [ ] Không commit Secret
