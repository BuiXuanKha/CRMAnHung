# Hướng dẫn Cloudflare R2 — CRMAnHung

## Đã có

| Mục | Giá trị |
|-----|---------|
| Account / Endpoint | skill + `.env` |
| Bucket **public** | `anhungland-crm` + CDN `https://cdn.anhungland.com` |
| Bucket **private** | `anhungland-crm-private` (đã tạo, không public) |
| Access Key | skill + `.env` — **nên tạo token mới** quyền cả 2 bucket |

## Việc còn lại: token API cho cả 2 bucket

Token cũ lúc tạo có thể chỉ gắn `anhungland-crm`. Để upload tài liệu mật được:

1. R2 → **Manage R2 API Tokens** → **Create API token**
2. Tên: `crmanhung-api-both`
3. Object **Read & Write**
4. Apply to: **`anhungland-crm`** + **`anhungland-crm-private`** (hoặc All buckets)
5. Copy **Access Key ID** + **Secret Access Key** → gửi agent

(Nếu chắc token hiện tại đã All buckets → báo “token All buckets”, không cần tạo mới.)

## Hai loại file

| | Public | Mật |
|--|--------|-----|
| Bucket | `anhungland-crm` | `anhungland-crm-private` |
| Xem | `cdn.anhungland.com/...` | Signed URL từ API (~15 phút) |
| Ví dụ | Ảnh lô đất, avatar | Hợp đồng, giấy tờ nhạy cảm |

App: `R2_PRIVATE_BUCKET=anhungland-crm-private`. Skill: `cloudflare-r2`.
