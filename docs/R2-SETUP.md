# Hướng dẫn Cloudflare R2 — CRMAnHung

## Đã xong

| Mục | Giá trị |
|-----|---------|
| Bucket public | `anhungland-crm` + CDN `https://cdn.anhungland.com` |
| Bucket private | `anhungland-crm-private` (Public access Disabled) |
| Token API | `crmanhung-api-both` — All buckets, Read & Write |
| Endpoint | `https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com` |

Credentials nằm trong `apps/api/.env` (gitignored) + skill `cloudflare-r2`.

Tuỳ chọn: xoá token cũ `anhungland-crm-r2` trên Cloudflare (chỉ gắn 1 bucket).

## Hai loại file

| | Public | Mật |
|--|--------|-----|
| Bucket | `anhungland-crm` | `anhungland-crm-private` |
| Link | `cdn.anhungland.com/...` (lâu dài) | Signed URL tạm từ API |
| Ví dụ | Ảnh lô đất | Sổ đỏ, hợp đồng |

Skill: `.cursor/skills/cloudflare-r2` · ADR 0005.
