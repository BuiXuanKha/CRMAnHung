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
| Payload | search, filters, `selectedId`, `scrollTop`, `anchorId`, `anchorOffset` |
| Row DOM | `data-list-row-id={id}` trên mỗi dòng/thẻ |
| Đổi lọc/search | Reset `scrollTop` về 0 **sau** restore; không cùng layout pass với restore (cache RQ từng kéo list về đầu) |
| Restore | **Đúng pixel** `scrollTop`; `anchorId` + `anchorOffset` chỉ dự phòng khi list đã đổi. Căn anchor sát mép trên = lệch ~1 dòng, user thấy giật |
| Re-apply | `requestAnimationFrame` ×2 + `document.fonts.ready`; bỏ qua nếu user đã cuộn |
| Logout | `clearAllListStates()` (auth) — xóa mọi `*-list-state` |
| Không nhớ | Panel rail / tab phải |

## Code

1. Import từ `@/shared/list-state`:
   - `createListStateStore` — thin store per feature
   - `getActiveListScrollEl`, `needsMoreListScrollHeight` (nếu infinite scroll)
   - `useCrmInfiniteList` — tải 50, cuộn gần đáy 160px thì nối thêm (`CRM_LIST_PAGE_SIZE` / `CRM_LIST_LOAD_MORE_PX`)
2. Feature file ví dụ: `features/lodats/list-state.ts`, `features/customers/list-state.ts`
3. Trên list page: peek → restore filters trước fetch; save khi scroll / đổi lọc / `pagehide` / trước `router.push`. Đánh dấu `restoredFiltersKey` lúc restore xong; `resetListScrollIfFiltersChanged` chỉ cuộn về 0 khi lọc **thay đổi**.
4. Gắn `scrollRef` + `onScroll` vào vùng cuộn (bảng desktop / thẻ mobile); `onScroll` gọi `loadMoreIfNearEnd(el)`
5. Che list lúc restore (`is-restoring` opacity 0, timeout ~4s) nếu cần tránh nháy đầu trang
6. Footer: `Hiển thị n / Tổng N` khi chưa hết; `Tổng N` khi đã tải hết; `— Đang tải thêm…` khi `isFetchingNextPage`

## Docs

- `docs/ARCHITECTURE.md` — mục List CRM
- Domain: `customers.md` §12.1.5, `lodats.md` §12.1.5

## Khi thêm trang list mới

1. Tạo `features/<x>/list-state.ts` với `createListStateStore`
2. Wire page giống `/lo-dat` hoặc `/khach-hang`
3. Cập nhật domain § nhớ list
4. Không invent localStorage / URL sync trừ khi product yêu cầu
