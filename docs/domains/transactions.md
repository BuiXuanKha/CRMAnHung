# Domain: Transactions (Giao dịch)

- **Slug:** `transactions`
- **Status:** Ready for mock
- **Owner:** An Hưng Land
- **Liên quan hệ cũ:** màn Quản lý giao dịch (`/giao-dich`) — đối chiếu nghiệp vụ, không copy UI god-file

---

## 1. Mục đích

Nhân viên theo dõi các giao dịch mua bán lô: loại (của tôi / ghi nhận), các bên, giá, hoa hồng, trạng thái cọc → công chứng → hoàn thành, hẹn công chứng.

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | Xem / tạo / sửa / xóa giao dịch mình tạo (P3 mock: xem list demo + xóa mock) | Sửa GD của NV khác |
| ADMIN | Toàn bộ list, lọc theo NV (sau) | — |

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Giao dịch của tôi (`OWN`) | Deal nhân viên đang phụ trách; có hoa hồng; hẹn công chứng khi còn Đã cọc |
| Ghi nhận (`RECORD`) | Chỉ ghi nhận trên hệ; **không** hoa hồng; **không** đếm doanh thu / hoa hồng |
| Hẹn CC | Ngày hẹn công chứng. Đếm ngược chỉ với `OWN` + `DA_COC` |

**Loại (`TransactionType`)**

| Enum | Nhãn |
|------|------|
| `OWN` | Của tôi |
| `RECORD` | Ghi nhận |

**Trạng thái (`TransactionStatus`)**

| Enum | Nhãn |
|------|------|
| `DA_COC` | Đã cọc |
| `DA_CONG_CHUNG` | Đã công chứng |
| `HOAN_TAT` | Hoàn thành |
| `HUY` | Đã hủy |

**Thống kê 3 thẻ**

- **Số lô giao dịch** = số dòng đang hiện (theo bộ lọc).
- **Tổng doanh thu / Tổng hoa hồng** = chỉ `OWN` + `HOAN_TAT` trong cùng bộ lọc. Hint: «Chỉ giao dịch của tôi · Hoàn thành».

## 4. Use cases

1. Vào `/giao-dich` → 3 thẻ thống kê + ô tìm + bảng list
2. Tìm theo mã GD / lô / người bán / người mua / ghi chú
3. Lọc cột Loại, Trạng thái, và có/không dữ liệu các cột khác
4. Menu thao tác: Xem chi tiết (placeholder), Sửa (toast mock), Xóa (xác nhận)
5. (Sau) Form tạo/sửa và chi tiết đầy đủ

## 5. Quan hệ dữ liệu

- Transaction → Lodat (snapshot tiêu đề lúc chốt)
- Transaction n—n Customer (người bán / người mua)
- Ownership: `createdByEmployeeId` (API thật). Mock P3: STAFF thấy mọi dòng demo.

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| List | `/giao-dich` | 3 thẻ + ô tìm + bảng §4.5; cột theo §4.3.6 |
| Detail | `/giao-dich/[id]` | Placeholder (mã GD + quay lại list) |

Không H1 trùng menu header. Không dropdown loại/trạng thái trên thanh tìm (lọc bằng icon cột). Không rail phải. Không nút «Thêm GD» trên list (chưa có trên ảnh mẫu). Cột NV (admin) để sau.

## 7. Contract / API dự kiến

Contract: `packages/shared/src/transactions.ts`  
Prefix: `/api/v1/transactions`

| Method | Path | Auth |
|--------|------|------|
| GET | `/transactions` | JWT — query `keyword`, `type`, `status` |
| GET | `/transactions/:id` | JWT |
| DELETE | `/transactions/:id` | JWT |

Response list: `{ items, total, stats: { totalRevenueVnd, totalCommissionVnd } }`.  
`stats` luôn tính trên `OWN` + `HOAN_TAT` (API thật: cùng scope quyền + query). Mock UI tính lại trên dòng đang hiện sau lọc cột.

## 8. Mock data cần có

- Cả `OWN` và `RECORD`
- Đủ 4 trạng thái
- RECORD không hoa hồng
- OWN + Đã cọc: hẹn CC còn ngày / hôm nay / quá hạn
- Thiếu người bán / người mua / ghi chú / giá → `—`
- Ít nhất một `OWN` + `HOAN_TAT` để thẻ doanh thu / hoa hồng ≠ 0
- Đủ dòng để cuộn bảng (~10+)

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

`tblTransaction*` → `Transaction*` (chi tiết `docs/MIGRATION.md`). Giữ `OWN` / `RECORD` và 4 status.

## 11. Open questions

- Form tạo/sửa và snapshot lô — làm sau list mock.
- Cột NV / lọc nhân viên — chỉ ADMIN, chưa mock.
- Xóa GD thật: có mở lại trạng thái rao bán của lô hay không — API P3.
