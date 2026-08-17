# Domain: Lodats (Lô đất)

- **Slug:** `lodats`
- **Status:** Ready for mock
- **Owner:** An Hưng Land
- **Liên quan hệ cũ:** màn Quản lý lô đất (list + detail) — đối chiếu nghiệp vụ, không copy UI god-file

---

## 1. Mục đích

Nhân viên theo dõi danh sách lô đất: tìm/lọc, xem thông số (diện tích, mặt tiền, hướng), giá bán, trạng thái mở bán, ảnh, rồi mở chi tiết / giao dịch / sửa.

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | Xem list/detail lô được gắn với khách của mình (P2 mock: xem list demo); tạo/sửa lô gắn khách mình | Hard-delete; sửa lô của NV khác |
| ADMIN | Toàn bộ list, sửa trạng thái, quản trị | — |

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Lodat | Một lô / nền / căn đang rao hoặc theo dõi |
| Cover | Ảnh đại diện; `extraPhotoCount` = số ảnh thêm |
| Giá bán | `priceVnd` + ghi chú giá + % hoa hồng |

**Trạng thái bán (`LodatSaleStatus`):**

| Enum | Nhãn |
|------|------|
| `DANG_BAN` | Đang bán |
| `DAT_COC` | Đặt cọc |
| `DA_BAN` | Đã bán |
| `TAM_DUNG` | Tạm dừng |

Tìm kiếm: `@` = gồm cả lô tạm dừng; `@@` = chỉ tạm dừng.

## 4. Use cases

1. Vào `/lo-dat` → bảng list, tìm theo tiêu đề / địa chỉ / tên khách
2. Lọc cột trạng thái, giá (có / chưa nhập)
3. Menu thao tác: Xem chi tiết (placeholder), Giao dịch / Sửa (toast mock)
4. (Sau) Chi tiết: ảnh, ghi chú, danh sách chủ — `/lo-dat/[id]` placeholder

## 5. Quan hệ dữ liệu

- Lodat n—n Customer qua map (P2 sâu hơn)
- Ownership: theo nhân viên gắn / khách sở hữu map

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| List | `/lo-dat` | Ô tìm + bảng §4.5; cột theo §4.3.5 (mock P2) |
| Detail | `/lo-dat/[id]` | Placeholder (tên lô + quay lại list) |

Không H1 trùng menu header. Không dropdown lọc trùng icon cột.

## 7. Contract / API dự kiến

Contract: `packages/shared/src/lodats.ts`  
Prefix: `/api/v1/lodats`

| Method | Path | Auth |
|--------|------|------|
| GET | `/lodats` | JWT |
| GET | `/lodats/:id` | JWT |
| POST | `/lodats` | JWT (sau) |
| PATCH | `/lodats/:id` | JWT (sau) |

## 8. Mock data cần có

- Đang bán có ảnh + giá + hoa hồng
- Đặt cọc, đã bán, tạm dừng
- Thiếu ảnh / thiếu giá
- Đủ dòng để cuộn bảng (~12+)

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Map gần: Title, address/project, AreaM2, FrontageM, Direction, PriceVnd, PriceNote, BrokerFee, SaleStatus, photos, UpdatedAt.

## 11. Open questions

- Toggle «Mở bán» trên list (CRM cũ) vs hangtag trạng thái — **P2 mock dùng hangtag §4.5.4**
- Nút thêm lô trên thanh tìm — chưa có trên ảnh mẫu; chưa làm
