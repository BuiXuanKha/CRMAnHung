---
name: security-baseline
description: Apply CRMAnHung security baseline for auth, authorization, secrets, CORS, R2 uploads, and extension tokens. Use when touching auth, deploy env, file upload, or public endpoints.
---

# Security baseline

## Auth

- Access JWT ngắn (`JWT_ACCESS_EXPIRES_IN`, mặc định 15m)
- Refresh token **hash** trong DB, **rotation** khi refresh, revoke khi logout
- Password: bcrypt cost ≥ 12
- Rate limit login (Throttler)

## Authorization

- UI ẩn nút **không** phải là bảo mật
- Kiểm tra ownership / role trong **service**
- ADMIN mới vào registry / user CRUD / hard-delete

## HTTP / deploy

- CORS allowlist từ `CORS_ORIGINS` — không `origin: true` trên prod/staging
- Helmet bật
- Secrets chỉ `.env` trên server — không commit, không rsync đè từ CI
- Staging = `anhungland.com`; **không** deploy đè `/var/www/anhungland-crm`
- `DATABASE_URL` phải là `postgresql://…` (không `file:`)

## Uploads (Cloudflare R2)

- Đọc skill **`cloudflare-r2`** — credentials + bucket đã chốt; **không hỏi lại owner**
- Public: `upload()` → CDN `cdn.anhungland.com`
- Mật: `uploadPrivate()` + `getPrivateSignedUrl()` — bucket `anhungland-crm-private`, **không** CDN
- Giới hạn size + MIME ở API trước `PutObject`
- Object key do server đặt; không tin path từ client
- **Không** lưu / serve file trên disk VPS

## Extension

- Token trong `chrome.storage` có key rõ prefix `crmanhung_ext_`
- Mọi gọi API qua background service worker (tránh CORS page Facebook)
- API URL cấu hình được — không hardcode secret

## Khi nghi ngờ

Ưu tiên fail closed (403/401) hơn “cho qua để tiện”.
