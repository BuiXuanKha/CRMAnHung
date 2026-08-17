---
name: crm-data-table
description: Enforce shared CRM list-table rules (hover, scroll, typography, badges, footer) from docs/UI-GUIDELINES.md §4.5 when building or changing any CRM data table in apps/web.
---

# CRM data table (shared)

Bảng danh sách dùng lại nhiều màn CRM. **Không** invent style mới mỗi trang.

## Trước khi code / sửa bảng list

1. Đọc [`docs/UI-GUIDELINES.md`](../../../docs/UI-GUIDELINES.md) **§4.5** (bắt buộc) + §4.3.3 nếu có cột Thao tác.
2. Tái dùng component / CSS shared hiện có (tham chiếu `apps/web/src/features/customers` — `CustomerTable` + `customers-table.css`).
3. Chỉ đổi **cột & dữ liệu** theo domain; giữ nguyên token hover / font / scroll / badge / footer.

## Đã chốt (tóm tắt)

| Hạng mục | Quy tắc |
|----------|---------|
| Scroll | Header cột **ngoài** overflow; chỉ thân dòng cuộn |
| Font | Noto Sans; lưới ~**0.84rem**; không Be Vietnam Pro trong CRM list |
| Hover | `#f1f5f9` |
| Selected | `#eff6ff` |
| Ghim / nổi bật | `#fef9c3` + viền trái `#ca8a04` |
| Link | `#2563eb` |
| Footer | `Hiển thị N / Tổng M …` |
| Thao tác | Một nút chevron → menu; xóa = đỏ |
| Icon | Lucide (§4.6); mini cạnh tên 12px |
| Hangtag | `CrmBadge` tone green/blue/amber/gray/red |
| Ô trống | `—` |

## Cấm

- Copy bảng rồi sửa màu/hover “cho đẹp từng màn”.
- Sticky header bên trong cùng box đang `overflow: auto` (scrollbar sẽ cắt qua header).
- Bỏ footer đếm hoặc thiếu trạng thái trống.

## Sau này

Khi có `shared/ui` DataTable: mọi màn list import đó; vẫn bám §4.5 nếu chỉnh visual.
