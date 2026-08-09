# Hướng dẫn Cloudflare R2 — CRMAnHung

## Đã có

| Mục | Giá trị |
|-----|---------|
| Account / Endpoint | đã lưu skill + `.env` |
| Bucket **public** | `anhungland-crm` + CDN `https://cdn.anhungland.com` |
| Access Key (hiện tại) | trong `.env` / skill — có thể cần **token mới** cho cả 2 bucket |

## Việc bạn làm ngay: bucket tài liệu mật

### 1. Tạo bucket private

1. Cloudflare → **R2** → **Create bucket**
2. Tên: **`anhungland-crm-private`**
3. Location: **Asia-Pacific (APAC)** (giống bucket kia)
4. Create  

**Không** bật Public Development URL.  
**Không** Connect Custom Domain.

### 2. Cho API quyền ghi cả 2 bucket

Token cũ có thể chỉ gắn `anhungland-crm`. Làm một trong hai:

**A — Tạo token mới (khuyên dùng)**  
1. R2 → **Manage R2 API Tokens** → Create  
2. Tên: `crmanhung-api-both`  
3. Object **Read & Write**  
4. Apply to: chọn **cả** `anhungland-crm` **và** `anhungland-crm-private` (hoặc All buckets)  
5. Copy Access Key ID + Secret → gửi agent (đổi `.env` + skill)

**B —** Nếu token hiện tại đã là All buckets → chỉ cần tạo bucket, không tạo token mới.

### 3. Xác nhận với agent

Gửi:
```text
Bucket anhungland-crm-private đã tạo
(Token mới nếu có: Access Key + Secret)
```

## Hai loại file (để nhớ)

| | Public | Mật |
|--|--------|-----|
| Bucket | `anhungland-crm` | `anhungland-crm-private` |
| Xem | `cdn.anhungland.com/...` | Link tạm từ API (signed, ~15 phút) |
| Ví dụ | Ảnh lô đất, avatar | Hợp đồng, CMND, hồ sơ nhạy cảm |

App: `R2_PRIVATE_BUCKET=anhungland-crm-private` (đã ghi `.env.example`).

Chi tiết kỹ thuật: skill `cloudflare-r2` · ADR 0005.
