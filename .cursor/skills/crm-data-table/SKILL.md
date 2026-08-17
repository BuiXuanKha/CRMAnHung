---
name: crm-data-table
description: Enforce shared CRM list-table rules (hover, scroll, typography, badges, column filters, footer) from docs/UI-GUIDELINES.md §4.5 when building or changing any CRM data table in apps/web.
---

# CRM data table (shared)

Bảng danh sách dùng lại nhiều màn CRM. **Không** invent style mới mỗi trang.

## Trước khi code / sửa bảng list

1. Đọc [`docs/UI-GUIDELINES.md`](../../../docs/UI-GUIDELINES.md) **§4.5** (bắt buộc) + §4.3.3 nếu có cột Thao tác + §4.5.5 nếu có lọc cột.
2. Tái dùng component / CSS shared:
   - Tham chiếu list: `apps/web/src/features/customers` (`CustomerTable` + `customers-table.css`)
   - `ColumnFilter` — `apps/web/src/shared/ui/column-filter.tsx`
   - `CrmBadge` — `apps/web/src/shared/ui/badge.tsx`
   - Số tiền — class `crm-money` (`shared/ui/money.css`)
3. Chỉ đổi **cột & dữ liệu** theo domain; giữ nguyên token hover / font / scroll / badge / footer / lọc cột.

## Đã chốt (tóm tắt)

| Hạng mục | Quy tắc |
|----------|---------|
| Scroll | Header cột **ngoài** overflow; chỉ thân dòng cuộn |
| Chrome header/footer | Cùng token `--kh-chrome` `#f1f5f9`; ô tên cột **không** nền trắng đè |
| Font | Noto Sans; lưới ~**0.84rem**; không Be Vietnam Pro trong CRM list |
| Hover | `#f1f5f9` |
| Selected | `#eff6ff` |
| Ghim / nổi bật | `#fef9c3` + viền trái `#ca8a04` |
| Link | `#2563eb` |
| Số tiền / giá | `#b45309` (class `crm-money`) |
| Footer | `Hiển thị N / Tổng M …`; cùng màu header |
| Thao tác | Một nút chevron → menu; xóa = đỏ |
| Icon | Lucide (§4.6); mini cạnh tên 12px |
| Hangtag | `CrmBadge` tone green/blue/amber/gray/red |
| Lọc cột | `ColumnFilter`: `ListFilter` **sát phải chữ** tên cột (không mép phải ô). **Chỉ click icon** mới mở menu |
| Xóa lọc | Icon Lucide `X` **bên phải** icon lọc; **chỉ hiện khi đang lọc**. Mặc định `#fee2e2` / `#b91c1c`; hover `#fecaca` / `#7f1d1d` |
| Ô trống | `—` (số đếm như lô đất: hiện `0`) |

Cột `#` và **Thao tác** không gắn icon lọc. Không lặp dropdown cùng nghĩa trên thanh tìm.

## Cấm

- Copy bảng rồi sửa màu/hover “cho đẹp từng màn”.
- Sticky header bên trong cùng box đang `overflow: auto` (scrollbar sẽ cắt qua header).
- Bỏ footer đếm hoặc thiếu trạng thái trống.
- `window.confirm` / emoji icon / hangtag màu ngoài 5 tone.
- Đẩy icon lọc ra mép phải ô (`justify-content: space-between` trên tên cột).

## Sau này

Khi có `shared/ui` DataTable: mọi màn list import đó; vẫn bám §4.5 nếu chỉnh visual.
