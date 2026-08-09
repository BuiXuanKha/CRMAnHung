# Hướng dẫn Cloudflare R2 — CRMAnHung

Dành cho chủ sở hữu. Agent đọc skill `.cursor/skills/cloudflare-r2/SKILL.md`.

## Đã cấu hình xong

| Mục | Giá trị |
|-----|---------|
| Account ID | `271dac0fb7f61cb74a3d5427b93661bc` |
| Bucket | `anhungland-crm` |
| Endpoint | `https://271dac0fb7f61cb74a3d5427b93661bc.r2.cloudflarestorage.com` |
| Region | Asia-Pacific (APAC) |
| Access Key + Secret | `apps/api/.env` + skill `cloudflare-r2` |
| **Public URL (chính)** | **`https://cdn.anhungland.com`** |
| Dự phòng `r2.dev` | `https://pub-a7fdc52e01074525b49243e98faf8b81.r2.dev` (có thể Disable sau) |

Domain `anhungland.com` đã trên Cloudflare DNS (`beau` / `lana`). Custom domain R2 đã Connect (TLS 1.3).

## App dùng R2 thế nào

1. Upload → API Nest → R2 `PutObject`  
2. DB lưu `objectKey`  
3. Web hiện: `https://cdn.anhungland.com/<objectKey>`

ADR: [`adr/0005-cloudflare-r2.md`](./adr/0005-cloudflare-r2.md).

## Checklist

- [x] Account / bucket / endpoint  
- [x] Access Key + Secret  
- [x] Domain trên Cloudflare  
- [x] Custom domain `cdn.anhungland.com` (Initializing → Active trong vài phút)  
- [x] `R2_PUBLIC_BASE_URL=https://cdn.anhungland.com` trong env + skill  
