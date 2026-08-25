---
name: crm-list-state
description: Persist CRM list search, filters, and scroll in sessionStorage via shared helper. Use when adding or changing list memory on /khach-hang, /lo-dat, /giao-dich, /dich-vu-so-do, or similar list pages.
---

# CRM list state (shared)

Nhớ **ô tìm + lọc + selectedId + vị trí cuộn** khi rời list (chi tiết / sửa / Back / F5 cùng tab).

## Quy tắc đã chốt

| Hạng mục | Quy tắc |
|----------|---------|
| Storage | `sessionStorage` — theo tab; đóng tab mất |
| Key | `crmanhung:<feature>-list-state` |
| Payload | search, filters, `selectedId`, `scrollTop`, `anchorId` |
| Row DOM | `data-list-row-id={id}` trên mỗi dòng/thẻ |
| Đổi lọc/search | Reset `scrollTop` về 0 |
| Logout | `clearAllListStates()` (auth) — xóa mọi `*-list-state` |
| Không nhớ | Panel rail / tab phải |

## Code

1. Import từ `@/shared/list-state`:
   - `createListStateStore` — thin store per feature
   - `getActiveListScrollEl`, `needsMoreListScrollHeight` (nếu infinite scroll)
2. Feature file ví dụ: `features/lodats/list-state.ts`, `features/customers/list-state.ts`
3. Trên list page: peek → restore filters trước fetch; save khi scroll / đổi lọc / `pagehide` / trước `router.push`
4. Gắn `scrollRef` + `onScroll` vào vùng cuộn (bảng desktop / thẻ mobile)
5. Che list lúc restore (`is-restoring` opacity 0, timeout ~4s) nếu cần tránh nháy đầu trang

## Docs

- `docs/ARCHITECTURE.md` — mục List CRM
- Domain: `customers.md` §12.1.5, `lodats.md` §12.1.5

## Khi thêm trang list mới

1. Tạo `features/<x>/list-state.ts` với `createListStateStore`
2. Wire page giống `/lo-dat` hoặc `/khach-hang`
3. Cập nhật domain § nhớ list
4. Không invent localStorage / URL sync trừ khi product yêu cầu
