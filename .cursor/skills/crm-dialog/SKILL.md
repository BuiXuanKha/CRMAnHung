---
name: crm-dialog
description: Enforce shared CRM dialog / alert / confirm / toast patterns from docs/UI-GUIDELINES.md §4.7 when showing messages or asking confirmation in apps/web CRM.
---

# CRM dialog (shared)

Thông báo và xác nhận dùng **một** khung modal. **Không** `window.alert` / `confirm` / `prompt`.

## Trước khi code

1. Đọc [`docs/UI-GUIDELINES.md`](../../../docs/UI-GUIDELINES.md) **§4.7** (+ §4.6 icon Lucide).
2. Dùng `CrmDialog` / `CrmConfirmDialog` / `CrmAlertDialog` / `CrmToast` trong `apps/web/src/shared/ui/`.
   Dialog/toast **portal tới `document.body`** (z-index 200) — không để nằm trong shell `overflow: hidden`.
3. Form ngắn (thêm SĐT, ghi chú…) = `CrmDialog` + body form — cùng chrome với confirm.

## Đã chốt (tóm tắt)

| Loại | Actions |
|------|---------|
| Alert | 1 nút primary |
| Confirm | Huỷ + Xác nhận (danger nếu phá hủy) |
| Form | Huỷ + Submit |
| Toast | Không chặn; tự ẩn |

## Cấm

- Invent modal CSS từng feature.
- Emoji / icon khác Lucide trong header modal.
- Confirm xóa bằng `window.confirm`.
