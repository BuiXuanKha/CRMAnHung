# Domain: Addresses (Sổ địa chỉ)

- **Slug:** `addresses`
- **Status:** Draft — chốt quyền + 2 loại; còn chỗ «dự án vs xã»
- **Nguồn:** CRM cũ Cài đặt → Quản lý địa chỉ (`tblAddresses` + `tblAddr*`)
- **Liên quan:** [`lodats.md`](./lodats.md) — địa chỉ tạo **trước** lô

---

## 1. Mục đích

Sổ địa chỉ dùng chung. Admin tạo trước. NV chọn khi tạo/gắn lô — không gõ địa chỉ tự do.

## 2. Actors

| Actor | Được | Không |
|-------|------|--------|
| ADMIN | CRUD địa chỉ; thêm Tỉnh/Huyện/Xã; ảnh dự án; import lô kho vào địa chỉ dự án | — |
| STAFF | Xem / chọn địa chỉ khi tạo lô | Tạo–sửa–xoá địa chỉ; thêm đơn vị hành chính; thêm/sửa/xoá ảnh dự án |

Cũ: mọi user đăng nhập CRUD địa chỉ. **Mới: chỉ Admin.**

## 3. Khái niệm

Hai loại địa chỉ (`kind`):

| Loại | `kind` | Cấp 4 (`detail`) | Ảnh trên địa chỉ | Lô gắn vào |
|------|--------|------------------|------------------|------------|
| Đất dân | `REGULAR` | Thôn / tổ — tuỳ chọn | **Không** | NV tạo thửa dân |
| Dự án | `PROJECT` | Tên dự án — bắt buộc | **Có** — chỉ Admin | Kho lô admin import |

Đơn vị hành chính (master, như DB cũ):

```
Tỉnh (tblAddrProvinces)
  → Huyện (tblAddrDistricts)
    → Xã (tblAddrWards)
```

`tblAddresses` trỏ 3 FK: `provinceId`, `districtId`, `wardId`. BE nhận `wardId`, tự suy huyện/tỉnh.

**Hiển thị dự án (DB cũ):** `Tên dự án (N lô) · Xã, Huyện, Tỉnh`.

Chốt chủ: «Tỉnh, Huyện, Xã (Dự án) — dự án tương đương xã». **DB cũ không làm vậy** — dự án không nằm trong bảng xã; đó là địa chỉ `PROJECT` **dưới một xã**, tên dự án = `detail`. Xem §11.

## 4. Use cases

1. **Admin thêm đất dân** — chọn/tạo Tỉnh → Huyện → Xã, thôn tuỳ chọn, lưu. Không ảnh.
2. **Admin thêm dự án** — cùng cascade + tên dự án + ảnh dự án.
3. **Admin import lô kho** — chỉ địa chỉ `PROJECT`, Excel: tên lô, DT, MT, hướng, ghi chú. Không gắn khách.
4. **NV tạo lô** — chỉ **chọn** địa chỉ có sẵn (picker). Dự án → bắt buộc chọn lô kho. Đất dân → tạo thửa mới.

## 5. Quan hệ dữ liệu

- 1 địa chỉ → nhiều lô (`Lodat.addressId`).
- Xoá mềm địa chỉ (`isHidden`); không cascade xoá lô (`ON DELETE SET NULL` — lô mới nên **bắt buộc** địa chỉ lúc tạo).
- Ảnh dự án: `AddressImage.objectKey` (R2). Không có `AddressImage` cho `REGULAR`.

Ownership: sổ **dùng chung** toàn công ty (không theo NV).

## 6. UI

| Màn | Route / chỗ | Hành vi |
|-----|-------------|---------|
| Sổ địa chỉ | Cài đặt — chỉ Admin | List + form 2 loại; gallery ảnh khi dự án |
| Picker | Form tạo/sửa lô | STAFF chọn; không nút thêm địa chỉ |
| Import kho | Từ địa chỉ dự án | Excel; chỉ Admin |

Đặc tả control: làm khi chốt §11 (dự án vs xã).

## 7. Contract / API dự kiến

Prefix `/api/v1`. Schema Zod sau khi §11 chốt.

| Method | Path | Ai |
|--------|------|-----|
| GET | `/addresses` | STAFF + ADMIN (chọn) |
| POST/PATCH/DELETE | `/addresses`, `/addresses/:id` | ADMIN |
| POST | `/addresses/:id/lodats/import` | ADMIN |
| POST/DELETE | `/addresses/:id/images` | ADMIN |
| GET | `/admin-units/provinces\|districts\|wards` | STAFF + ADMIN (đọc); POST tạo đơn vị = ADMIN |

## 8. Mock data

- ≥ 1 dự án có ảnh + vài lô kho (có/chưa chủ)
- ≥ 1 đất dân (có thôn / không thôn)
- Picker rỗng / không quyền Admin

## 9. Extension?

- [x] Không

## 10. Migrate

| Cũ | Mới |
|----|-----|
| `tblAddrProvinces/Districts/Wards` | `Province`, `District`, `Ward` (giữ 3 cấp, copy tên) |
| `tblAddresses` | `Address` (`kind`, 3 FK, `detail`, `isHidden`, người tạo) |
| `tblAddressImages` | `AddressImage.objectKey` (R2), **chỉ** `Kind=PROJECT` |

Thứ tự: master hành chính → địa chỉ → ảnh dự án → lô.

## 11. Open questions

1. **Dự án «tương đương xã»** — chọn một:
   - **A (đề xuất, khớp DB cũ):** cascade luôn Tỉnh → Huyện → Xã. Dự án = địa chỉ loại PROJECT dưới xã đó + tên dự án. Copy 1–1. List có thể hiện `Tỉnh · Huyện · Tên dự án` (ẩn xã) nếu muốn nói ngắn.
   - **B:** form dự án **bỏ chọn xã** (Tỉnh → Huyện → Tên dự án). `wardId` cho phép trống với PROJECT. Data cũ vẫn giữ xã nếu đã có.
   - **C:** đưa tên dự án vào bảng xã (trộn master hành chính với kho BĐS). **Không đề xuất** — copy khó, lọc xã nhà nước gãy.

2. Địa chỉ đất dân trùng (cùng xã + cùng thôn): cấm hay cho phép?
