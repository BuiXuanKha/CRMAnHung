# Domain: Kênh liên hệ (hotline + profile Facebook)

- **Slug:** `contact-channels`
- **Status:** Ready for API — copy bảng sau User; UI modal mock làm sau
- **Nguồn:** CRM cũ Cài đặt → **Quản lý SĐT** + **Profile Facebook**
- **UI:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) dialog §4.7
- **Contract:** `packages/shared/src/contact-channels.ts`

Slice này **chỉ bảng + copy data**. Modal cài đặt trên web mới = mock/API sau. Không copy tin nhắn / ảnh / lô.

**Thứ tự copy:** User → **kênh liên hệ** → khách → lô → giao dịch → sổ đỏ.

---

## 1. Mục đích

Mỗi NV có SĐT hotline (thêm khách bằng số) và nick/page Facebook (lọc kênh trên list khách). Phải có trước khi copy khách vì `SourceHotlineId` và cột kênh.

## 2. Actors

| Actor | Được | Không |
|-------|------|--------|
| STAFF | Hotline / profile **của mình** | Của NV khác |
| ADMIN | Của mình; (sau) xem kênh trên list mọi NV | Sửa hotline hộ NV khác trên modal này |

## 3. Khái niệm

| Thứ | CRM cũ | Mới |
|-----|--------|-----|
| Hotline | `tblEmployeeHotline` | `EmployeeHotline` |
| Tắt hotline | `IsActive = 0` (không xóa) | `isActive` |
| Nguồn khách SĐT | `tblPerson.SourceHotlineId` | `Customer.sourceHotlineId` (khi copy khách) |
| Profile FB NV | `tblEmployeeFacebookProfiles` | `EmployeeFacebookProfile` |
| Tên nick/page | `NameProfile` | `nickname` |
| UID page/nick | `EmployeeFacebookUid` | `facebookUid` |

Hotline tắt: không chọn khi **thêm khách mới**; khách cũ vẫn giữ nguồn.

List «Profile Facebook» CRM cũ = UID đã gắn trên **khách của NV**, JOIN tên từ bảng profile. Copy bảng profile trước để có tên; UID đủ sau khi copy khách.

## 4. Use cases

1. **Quản lý SĐT** — thêm số + tên; sửa tên; tắt / bật lại
2. **Thêm khách bằng SĐT** — bắt buộc chọn hotline đang bật; chưa có hotline → bảo vào Cài đặt
3. **Profile Facebook** — đặt tên cho UID đã quét; lọc kênh trên `/khach-hang`
4. **Copy data** — sau User, trước khách

## 5. Quan hệ

`User` 1–n `EmployeeHotline` (unique `employeeId` + `phone`).  
`User` 1–n `EmployeeFacebookProfile` (unique `employeeId` + `facebookUid`).  
`EmployeeHotline` 1–n `Customer` qua `sourceHotlineId`.

STAFF chỉ thấy kênh của mình.

## 6. UI

| Màn | Mở từ | Việc |
|-----|-------|------|
| Quản lý SĐT | Cài đặt → Quản lý SĐT | Thêm / sửa tên / tắt |
| Profile Facebook | Cài đặt → Profile Facebook | Đặt tên UID |
| Thêm khách SĐT | `/khach-hang` | Chọn hotline * — `customers.md` §12 |

### 6.1 Giao diện máy tính — modal Quản lý SĐT

```
┌ Quản lý SĐT (hotline) ─────────────────────────┐
├ Form: Số hotline · Tên hiển thị · [Thêm]       │
├ Bảng: # · Số · Tên · Tắt/Bật                   │
└ Ghi chú: tắt = không chọn khi thêm khách mới   ┘
```

1. Ô số hotline (`0` + 9 số)
2. Ô tên hiển thị (bắt buộc, tối đa 80)
3. Nút Thêm
4. Dòng: số; badge «Đã tắt» nếu `isActive = false`
5. Sửa tên trên dòng → Lưu tên
6. Nút Tắt / Bật lại (không xóa)
7. Trống: «Thêm ít nhất một số trước khi tạo khách bằng SĐT»

### 6.2 Giao diện mobile — modal Quản lý SĐT

Cùng control 6.1. Ô nhập ≥ 16px. Nút đủ vùng chạm.

### 6.3 Giao diện máy tính — modal Profile Facebook

```
┌ Số profile Facebook ───────────────────────────┐
├ Bảng: # · UID · Số khách · Lần cuối · Tên     │
└ Ô tên + Lưu                                    ┘
```

1. UID Facebook (chỉ đọc)
2. Số khách đã gắn UID đó (sau khi copy khách)
3. Lần cuối quét
4. Ô tên profile → Lưu
5. Trống: «Chưa có UID Facebook nào» (trước khi copy khách)

### 6.4 Giao diện mobile — modal Profile Facebook

Cùng control 6.3.

## 7. API (sau UI mock)

Prefix `/api/v1`

| Method | Path | Auth |
|--------|------|------|
| GET | `/users/me/hotlines` | JWT; `?active=1` chỉ đang bật |
| POST | `/users/me/hotlines` | JWT; `{ phone, label }` |
| PATCH | `/users/me/hotlines/:id` | JWT; `{ label?, isActive? }` |
| GET | `/users/me/facebook-pages` | JWT — UID từ khách của mình + tên đã lưu |
| POST | `/users/me/facebook-pages` | JWT; `{ facebookUid, nickname }` |

Zod: `packages/shared/src/contact-channels.ts`. **Chưa** nối web.

## 8. Seed / mock

Dev: hotline mẫu gắn user mock. Production: copy từ SQLite (3 hotline, 9 profile — số lúc freeze 2026-08-20).

## 9. Extension?

- [x] Có — UID page inbox → `EmployeeFacebookProfile` (phase extension, chưa làm)

## 10. Migrate từ hệ cũ

| Cũ | Mới |
|----|-----|
| `tblEmployeeHotline` | `EmployeeHotline` |
| `Phone` | `phone` (giữ số đã chuẩn hóa) |
| `Label` | `label` |
| `IsActive` | `isActive` |
| `SortOrder` | `sortOrder` |
| `tblEmployeeFacebookProfiles` | `EmployeeFacebookProfile` |
| `EmployeeFacebookUid` | `facebookUid` |
| `NameProfile` | `nickname` |

`EmployeeId` → `User.id` qua `migrate.legacy_id_map` entity `user`.  
Map mới: entity `employee_hotline`, `employee_facebook_profile`.

Copy **cả** hotline tắt và profile không còn dùng. Không gộp giữa NV.

Script: `apps/api/scripts/migrate-contact-channels-from-legacy.ts` (`pnpm channels:migrate-legacy`). Chỉ đọc SQLite. Idempotent: đã có trong map thì cập nhật, không tạo trùng.

NV không có trong map user → **bỏ dòng + log**, không gán lung tung.

## 11. Việc tiếp theo

1. ~~Schema đủ cột + copy hotline / profile~~ (slice này)
2. UI mock 2 modal Cài đặt
3. API + nối web
4. Copy khách (`SourceHotlineId` trỏ id mới)
