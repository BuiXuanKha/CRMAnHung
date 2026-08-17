# Domain: Customers (Khách hàng)

- **Slug:** `customers`
- **Status:** Ready for mock
- **Liên quan hệ cũ:** `Web` khách hàng + `AnhunglandExtension` ingest + `API` `customer.*`

---

## 1. Mục đích

Quản lý lead/khách từ Facebook Messenger / Business Suite Inbox hoặc nhập tay (SĐT), để nhân viên chăm sóc, gắn lô đất, theo dõi lịch sử.

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | CRUD khách **của mình**; pin/hide; care notes; gắn lodat | Xem/xóa khách nhân viên khác; hard-delete |
| ADMIN | Toàn bộ của STAFF + registry toàn hệ + soft/hard delete theo policy | — |

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Customer | Hồ sơ khách (Person hệ cũ) |
| CustomerFacebook | Metadata FB (uid, thread, avatar, scan source) |
| Care note | Ghi chú chăm sóc append-only |
| Source hotline | SĐT nóng của NV được gắn khi tạo khách |

**Status:** `KHACH_MOI` | `KHACH_NET` | `KHACH_CAN_CHAM_SOC` | `KHAC`

**Ẩn / xoá mềm (P1):** `isHidden = true` — không dùng `deletedAt` ở phase này (khớp Prisma hiện tại).

## 4. Use cases (P1 tối thiểu)

1. Đăng nhập → danh sách khách (filter status, ẩn/hiện, pin)
2. Xem chi tiết: phones, FB info, care notes, lodat maps (read)
3. Tạo khách thủ công (tên + SĐT)
4. Sửa tên / phones / status / pin / hide / restore
5. Thêm care note
6. Ingest từ extension (`POST .../from-extension`) — phase 1b

## 5. Quan hệ dữ liệu

- Customer 1—1 CustomerFacebook (optional)
- Customer 1—n CustomerPhone, CareNote
- Customer n—n Lodat qua LodatCustomerMap (P2 mới làm sâu UI)

Ownership: `customer.employeeId` = user tạo / được gán.

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| List | `/khach-hang` | Tìm/lọc, bảng, menu hành động, rail phải (UI-GUIDELINES §4.3); pin/ẩn; thêm SĐT |
| Detail | `/khach-hang/[id]` | Tabs: thông tin, care; lodat (read count) |
| Create | modal trên list | Form thủ công tên + SĐT |

## 7. Contract / API dự kiến

Contract: `packages/shared/src/customers.ts`

| Method | Path | Auth |
|--------|------|------|
| GET | `/customers` | JWT |
| GET | `/customers/:id` | JWT + ownership |
| POST | `/customers` | JWT |
| PATCH | `/customers/:id` | JWT + ownership |
| POST | `/customers/:id/care-notes` | JWT + ownership |
| POST | `/customers/from-extension` | JWT (extension) — 1b |
| DELETE | `/customers/:id` | JWT — soft hide (`isHidden`) |

## 8. Mock data cần có

- 1 khách mới (`KHACH_MOI`) có FB
- 1 khách nét có nhiều SĐT
- 1 khách đang ẩn
- 1 khách của “nhân viên khác” (để test 403 trên API)

## 9. Extension

- [x] Có — port scanner sau khi API ingest ổn

## 10. Migrate

`tblPerson*` → `Customer*` (xem MIGRATION.md)

## 11. Open questions

- ~~Soft-delete = `isHidden` hay `deletedAt`?~~ → **P1: `isHidden`**. Revisit hard-delete / `deletedAt` ở P4 nếu cần.
