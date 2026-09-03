# Sổ theo dõi lỗi — CRM An Hưng Land

File này là sổ theo dõi lỗi của **toàn bộ project**. Không xóa và không tự ý sửa nội dung các bug đã ghi.

## Quy tắc audit

1. Audit theo từng module/chức năng. Không audit toàn bộ hệ thống trong một lần.
2. **Source code là nguồn sự thật.** Đọc code trước. Docs chỉ dùng để đối chiếu sau khi đã hiểu code.
3. Trong giai đoạn audit: chỉ ghi nhận. Không sửa code, không refactor, không migration, không commit/push thay đổi code nghiệp vụ.
4. Mỗi bug có ID tăng dần: `BUG-001`, `BUG-002`, …
5. Lần audit module mới: đọc bug cũ để tránh ghi trùng; chỉ **bổ sung** bug mới; giữ nguyên lịch sử.
6. Không kết luận khi chưa đủ bằng chứng. Ghi `NEEDS VERIFICATION` thay vì khẳng định đó là BUG.
7. Không tự sửa bug sau khi phát hiện. Owner quyết định bug nào được fix.

## Kiểm thử trình duyệt

Khi cần xác minh chức năng thực tế trên UI:

1. Chỉ dùng tài khoản kiểm thử do owner cung cấp (ngoài git). **Không** ghi mật khẩu vào file này hay bất kỳ file nào trong repo.
2. Tài khoản được phép: `Admin` (quản trị), `kha` (user). Không dùng tài khoản khác.
3. Chỉ đọc / điều hướng / quan sát. Mọi thao tác **tạo, sửa, hoặc xóa dữ liệu thực tế** phải báo owner trước và **không tự thực hiện**.
4. Bug phát hiện qua trình duyệt ghi thêm các trường dưới đây (ngoài mẫu chuẩn).

## Trạng thái sổ

| Trường | Giá trị |
|--------|---------|
| ID tiếp theo | `BUG-001` |
| Tổng bug đã ghi | 0 |
| OPEN | 0 |
| NEEDS VERIFICATION | 0 |
| FIXED / CLOSED | 0 |
| Lần audit gần nhất | Chưa audit module nào (chỉ khởi tạo sổ, 2026-09-03) |

## Cách ghi một bug

Mỗi mục bug tối thiểu gồm:

- **ID** — `BUG-NNN`
- **Severity** — `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`
- **Module**
- **File**
- **Function**
- **Vị trí code** — nếu xác định được (hàm, dòng, nhánh)
- **Problem**
- **Root cause**
- **Impact**
- **Evidence** — dẫn code / hành vi quan sát được; không suy đoán
- **Status** — mặc định `OPEN` (hoặc `NEEDS VERIFICATION` nếu chưa đủ bằng chứng)

Nếu phát hiện qua trình duyệt, **bắt buộc** thêm:

- **Test account** — `Admin` hoặc `kha`
- **Thao tác đã thực hiện**
- **Kết quả thực tế**
- **Kết quả mong đợi**
- **Cách tái hiện**

Mẫu:

```md
### BUG-NNN — <tiêu đề ngắn>

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/api/src/modules/customers/customers.service.ts`
- **Function:** `update`
- **Vị trí code:**
- **Problem:**
- **Root cause:**
- **Impact:**
- **Evidence:**
- **Status:** OPEN
```

Mẫu (phát hiện qua trình duyệt):

```md
### BUG-NNN — <tiêu đề ngắn>

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/web/src/features/customers/...`
- **Function:**
- **Vị trí code:**
- **Problem:**
- **Root cause:**
- **Impact:**
- **Evidence:**
- **Test account:** kha
- **Thao tác đã thực hiện:**
- **Kết quả thực tế:**
- **Kết quả mong đợi:**
- **Cách tái hiện:**
- **Status:** OPEN
```

## Nhật ký audit

| Ngày | Module | Bug mới | Ghi chú |
|------|--------|---------|---------|
| 2026-09-03 | — | — | Khởi tạo `docs/audit/BUGS.md`. Chưa audit. Chờ owner giao module đầu tiên. |
| 2026-09-03 | — | — | Bổ sung quy tắc kiểm thử trình duyệt (tài khoản Admin / kha; cấm tự tạo-sửa-xóa dữ liệu; mẫu bug UI). Mật khẩu không lưu trong repo. |

## Bản đồ module (quan sát cấu trúc, chưa audit)

Danh sách dưới đây chỉ phản ánh **thư mục/code hiện có**. Không phải kết luận audit.

| Module (code) | API | Web | Ghi chú |
|---------------|-----|-----|---------|
| auth | `apps/api/src/modules/auth` | `apps/web/src/features/auth` | Đăng nhập / JWT |
| users | `apps/api/src/modules/users` | `apps/web/src/features/users` | Quản trị user, hotline |
| customers | `apps/api/src/modules/customers` | `apps/web/src/features/customers` | Khách hàng, care, phone, extension ingest |
| addresses | `apps/api/src/modules/addresses` | `apps/web/src/features/addresses` | Địa chỉ, đơn vị hành chính |
| lodats | `apps/api/src/modules/lodats` | `apps/web/src/features/lodats` | Lô đất |
| transactions | `apps/api/src/modules/transactions` | `apps/web/src/features/transactions` | Giao dịch |
| title-services | `apps/api/src/modules/title-services` | `apps/web/src/features/title-services` | Dịch vụ sổ đỏ |
| lot-shares | `apps/api/src/modules/lot-shares` | `apps/web/src/features/lot-shares` | Share lô, thống kê xem |
| public-content | `apps/api/src/modules/public-content` | `apps/web/src/features/public-content` | CMS bài viết / listing admin |
| public web | controllers public trong API | `apps/web/src/features/public` | Site công khai anhungland.com |
| settings | — | `apps/web/src/features/settings` | Cài đặt CRM |
| health | `apps/api/src/modules/health` | — | Health check |
| storage | `apps/api/src/storage` | — | Cloudflare R2 |
| extension | — | `apps/extension` | Chrome MV3 |
| shared | — | `packages/shared` | Zod / types dùng chung |
| prisma | `apps/api/src/prisma` + schema | — | PostgreSQL |

## Tóm tắt bug

| ID | Severity | Module | Problem | Status |
|----|----------|--------|---------|--------|
| — | — | — | Chưa có bug. | — |

## Danh sách bug

_Chưa có mục nào. Mục đầu tiên sẽ là `BUG-001`._
