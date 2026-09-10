# Domain: Addresses (Sổ địa chỉ)

- **Slug:** `addresses`
- **Status:** Ready — schema + Nest + modal Admin (Cài đặt); STAFF picker sẵn; copy data: `pnpm addresses:migrate-legacy` trên VPS
- **Nguồn:** CRM cũ Cài đặt → Quản lý địa chỉ (`tblAddresses` + `tblAddr*`)
- **Liên quan:** [`lodats.md`](./lodats.md) — địa chỉ tạo **trước** lô
- **Contract:** `packages/shared/src/addresses.ts`
- **API:** `/api/v1/addresses`, `/api/v1/admin-units/*`
- **UI:** Cài đặt → Quản lý địa chỉ (modal giống CRM cũ) · route `/cai-dat/dia-chi` · `AddressPicker` (STAFF chọn)

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
| Dự án | `PROJECT` | Tên dự án — bắt buộc | **Có** — chỉ Admin | Admin import `ProjectLot`; NV tạo `Lodat` **trỏ** kho |

**4 cấp như DB cũ (chốt 2026-08-24):**

```
1. Tỉnh
2. Huyện
3. Xã
4. Địa chỉ trong xã  →  đất dân: thôn/tổ (tuỳ chọn)
                     →  dự án:   tên dự án (bắt buộc)  ← vẫn thuộc xã, không thay xã
```

`tblAddresses` trỏ 3 FK: `provinceId`, `districtId`, `wardId`. BE nhận `wardId`, tự suy huyện/tỉnh.

**Hiển thị dự án:** `Tên dự án (N lô) · Xã, Huyện, Tỉnh`.

## 4. Use cases

1. **Admin thêm đất dân** — chọn/tạo Tỉnh → Huyện → Xã, thôn tuỳ chọn, lưu. Không ảnh.
2. **Admin thêm dự án** — cùng cascade + tên dự án + ảnh dự án.
3. **Admin import lô kho** — chỉ địa chỉ `PROJECT`, Excel: tên lô, DT, MT, hướng, ghi chú. Không gắn khách.
4. **NV tạo lô** — chỉ **chọn** địa chỉ có sẵn (picker). Dự án → bắt buộc chọn lô kho. Đất dân → tạo thửa mới.

## 5. Quan hệ dữ liệu

- 1 địa chỉ dự án → nhiều `ProjectLot` (kho).
- 1 `ProjectLot` → nhiều `Lodat` (mỗi NV một luồng khi gắn chủ).
- 1 địa chỉ đất dân → nhiều `Lodat` dân (`projectLotId` trống).
- Xoá mềm địa chỉ (`isHidden`); không cascade xoá lô. Lô mới **bắt buộc** địa chỉ lúc tạo (dân: trên `Lodat`; dự án: trên `ProjectLot`).
- Ảnh dự án: `AddressImage.objectKey` (R2). Không có ảnh địa chỉ cho `REGULAR`.

Ownership: sổ **dùng chung** toàn công ty (không theo NV).

## 6. UI

| Màn | Route / chỗ | Hành vi |
|-----|-------------|---------|
| Sổ địa chỉ | Cài đặt → modal (Admin); `/cai-dat/dia-chi` | Tìm kiếm + tab Tất cả/Thường/Dự án + list + form cascade; giống CRM cũ |
| **Ảnh dự án** | Trong form khi **đang sửa** địa chỉ `PROJECT` | Thumbnail grid: thêm (file / kéo thả), gỡ ×; tối đa **24** ảnh; API `POST/DELETE /addresses/:id/images`. Tạo mới: lưu xong → giữ form sửa để thêm ảnh |
| Picker | Form tạo/sửa lô | STAFF chọn; không nút thêm địa chỉ |
| Import kho | Cài đặt → **Import lô đất Excel** (Admin) | Modal giống CRM cũ: chọn dự án **chưa có lô**, Excel 5 cột, xem trước, ghi `ProjectLot`. NV không thấy mục này. |

Đặc tả control: cascade 4 cấp đã chốt; gallery ảnh dự án trên form sửa (không placeholder).

## 7. Contract / API dự kiến

Prefix `/api/v1`. Schema Zod khi làm mock/API sổ địa chỉ.

| Method | Path | Ai |
|--------|------|-----|
| GET | `/addresses` | STAFF + ADMIN (chọn). Trả **hết** theo filter (`keyword`/`kind`/`includeHidden`/`withoutLodats`); `total` = COUNT — không cắt 500. `withoutLodats=1` + `kind=PROJECT` = chỉ dự án chưa có `ProjectLot` |
| POST/PATCH/DELETE | `/addresses`, `/addresses/:id` | ADMIN |
| POST | `/addresses/:id/lodats/import` | ADMIN. Body `{ rows: [{ title, areaM2?, frontageM?, direction?, note? }] }` — tối đa 2500. Chỉ địa chỉ `PROJECT` **chưa có lô**. Ghi `ProjectLot`, không gắn khách. |
| POST/DELETE | `/addresses/:id/images` | ADMIN |
| GET | `/admin-units/provinces\|districts\|wards` | STAFF + ADMIN (đọc); POST tạo đơn vị = ADMIN |

## 8. Dữ liệu

Sổ địa chỉ gọi API (copy CRM cũ). Không RAM mock.

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

1. ~~Dự án = xã~~ — **chốt:** 4 cấp như DB cũ; dự án thuộc xã (cấp 4), không thay xã.
2. Địa chỉ đất dân trùng (cùng xã + cùng thôn): cấm hay cho phép?
