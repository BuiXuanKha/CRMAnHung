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
| Phân loại | Nhà hoặc Đất (`LodatKind`) |
| Giá bán | `priceVnd` + ghi chú giá + % hoa hồng |

**Trạng thái rao bán (cột Trạng thái trên `/lo-dat`):** Mở bán ↔ Tạm dừng.  
**Không** phải đã bán / chưa bán / đặt cọc — những trạng thái đó thuộc **giao dịch** (P3).

| Enum | Nhãn trên công tắc |
|------|-------------------|
| `DANG_BAN` | Mở bán |
| `TAM_DUNG` | Tạm dừng |

`DAT_COC` / `DA_BAN` giữ trong enum để migrate / P3, **không** hiện trên cột này.

Tìm kiếm: `@` = gồm cả lô tạm dừng; `@@` = chỉ tạm dừng.

## 4. Use cases

1. Vào `/lo-dat` → bảng list, tìm theo tiêu đề / địa chỉ / tên khách
2. Lọc cột phân loại (Nhà / Đất) và trạng thái (Mở bán / Tạm dừng); công tắc đổi rao bán trên mọi dòng
3. Menu thao tác: Xem chi tiết (placeholder), Giao dịch / Sửa (toast mock)
4. (Sau) Chi tiết: ảnh, ghi chú, danh sách chủ — `/lo-dat/[id]` placeholder

## 5. Quan hệ dữ liệu

- Lodat n—n Customer qua map (P2 sâu hơn)
- Ownership: theo nhân viên gắn / khách sở hữu map

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| List | `/lo-dat` | Desktop: ô tìm + bảng §4.5 / §4.3.5. Mobile: ô tìm + Bộ lọc + Tìm; thẻ cơ bản (tiêu đề, ảnh, địa chỉ, giá, DT·MT·Hướng) |
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
| PATCH | `/lodats/:id/sale-status` | JWT — chỉ `DANG_BAN` ↔ `TAM_DUNG` |

## 8. Mock data cần có

- Mở bán (công tắc bật) + Tạm dừng (công tắc tắt, ẩn mặc định)
- Phân loại Nhà và Đất
- Thiếu ảnh / thiếu giá
- Đủ dòng để cuộn bảng (~12+)

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Map gần: Title, address/project, AreaM2, FrontageM, Direction, PriceVnd, PriceNote, BrokerFee, SaleStatus, photos, UpdatedAt.

## 11. Open questions

- Nút thêm lô trên thanh tìm — chưa có trên ảnh mẫu; chưa làm
