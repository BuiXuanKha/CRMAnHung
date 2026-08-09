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
| `R2_ACCESS_KEY_ID` | `7a6b2fb153f8469fc4d09e242aea725a` |
| `R2_SECRET_ACCESS_KEY` | `908590b4b338ecb65ffa0a84661eefa5bb32f693ac28a359a8eb6cbf7932111f` |
| `R2_BUCKET` (public) | `anhungland-crm` |
| `R2_PUBLIC_BASE_URL` | `https://cdn.anhungland.com` |
| `R2_PRIVATE_BUCKET` | `anhungland-crm-private` |

- Token `cfat_…` không dùng cho S3.
- API token hiện có thể **chỉ** quyền bucket public — owner cần token Read & Write **cả hai** bucket (xem `docs/R2-SETUP.md`).

## Khi nào dùng bucket nào

| Loại file | Method | Ghi chú |
|-----------|--------|---------|
| Ảnh công khai / CRM không mật | `upload()` | URL = CDN |
| Hợp đồng, giấy tờ, đính kèm mật | `uploadPrivate()` | Chỉ lưu `objectKey` |
| Xem/tải file mật | `getPrivateSignedUrl(key)` | **Sau** khi API check authz; TTL mặc định 15 phút |

## Bootstrap `.env`

Copy `.env.example`, điền bảng Connection (kể cả `R2_PRIVATE_BUCKET`). Không `git add` `.env`.

## Code

`apps/api/src/storage/storage.service.ts` · ADR `docs/adr/0005-cloudflare-r2.md` · Owner `docs/R2-SETUP.md`

## Checklist agent

- [ ] Không hỏi lại R2 nếu bảng còn đúng
- [ ] Tài liệu mật → private bucket + signed URL, không `cdn.anhungland.com`
- [ ] Không commit Secret
