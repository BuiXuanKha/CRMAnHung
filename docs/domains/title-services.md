# Domain: Title services (Dịch vụ sổ đỏ)

- **Slug:** `title-services`
- **Status:** Ready for mock
- **Owner:** An Hưng Land
- **Liên quan hệ cũ:** màn Dịch vụ sổ đỏ (`/dich-vu-so-do`) — đối chiếu nghiệp vụ, không copy UI god-file

---

## 1. Mục đích

Nhân viên theo dõi hồ sơ làm sổ đỏ cho khách: nhu cầu, tiến độ các bước, thu/chi, tài liệu đính kèm, số ngày đang làm.

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | Xem / tạo (từ khách) / cập nhật / ghim / xóa hồ sơ mình tạo (P3 mock: list demo + thao tác mock) | Sửa hồ sơ NV khác |
| ADMIN | Toàn bộ list, xem NV phụ trách (sau) | — |

Hồ sơ **mới** tạo từ menu khách hàng «Dịch vụ sổ đỏ» — list này không có nút Thêm (ảnh mẫu không có).

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Hồ sơ sổ đỏ | Một việc làm giấy tờ nhà đất gắn một khách |
| Tiến độ | Bước đã làm (đo đạc, nộp hồ sơ, nhận kết quả…) |
| Thu / Chi | Khoản tiền đã thu khách / đã chi phí |
| Số ngày | Số ngày từ lúc bắt đầu; dừng đếm khi Hoàn thành / Hủy |

**Trạng thái (`TitleServiceStatus`)**

| Enum | Nhãn |
|------|------|
| `DANG_LAM` | Đang làm |
| `TAM_DUNG` | Tạm dừng |
| `HOAN_THANH` | Hoàn thành |
| `HUY` | Hủy |

**Bước tiến độ (`TitleServiceStepType`)**

| Enum | Nhãn |
|------|------|
| `BAN_GIA` | Bàn giá tại nhà |
| `THU_THAP_GIAY_TO` | Thu thập / scan giấy tờ |
| `DO_DAC` | Đo đạc |
| `NOP_HO_SO` | Nộp hồ sơ |
| `BO_SUNG` | Bổ sung giấy tờ |
| `LAM_VIEC_CO_QUAN` | Làm việc cơ quan |
| `NHAN_KET_QUA` | Nhận kết quả |
| `BAN_GIAO` | Bàn giao khách |
| `KHAC` | Khác |

**Loại tài liệu:** Sổ đỏ / Căn cước / Giấy tờ khác.

## 4. Use cases

1. Vào `/dich-vu-so-do` → ô tìm + bảng; bấm dòng mở panel **Chi tiết hồ sơ**
2. Tìm mã hồ sơ / tên khách / SĐT
3. Lọc cột trạng thái (trên Tên khách) và có/không nhu cầu, tiến độ, tài liệu
4. Ghim hồ sơ lên đầu; xóa (xác nhận)
5. Panel: thêm tiến độ / thu / chi / tài liệu (mock dialog)
6. (Sau) Tạo hồ sơ từ `/khach-hang`; trang đầy đủ `[id]`

## 5. Quan hệ dữ liệu

- TitleService 1—1 Customer (khách của hồ sơ)
- TitleService 1—n Progress / MoneyEntry / Attachment
- Ownership: `createdByEmployeeId`. Mock P3: STAFF thấy mọi dòng demo.

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| List + panel | `/dich-vu-so-do` | Ô tìm + bảng §4.5; cột theo §4.3.7; panel phải Chi tiết hồ sơ |
| Detail | `/dich-vu-so-do/[id]` | Placeholder (mã + quay lại list) |

Không H1 trùng menu. Không dropdown trạng thái / nút Tìm trên thanh (lọc cột + gõ là lọc). Cột `#` hiện sao Lucide nếu ghim, không emoji. Không rail nhiều tab kiểu khách hàng — **một** panel chi tiết (thu hẹp = thanh dọc §4.3.2).

## 7. Contract / API dự kiến

Contract: `packages/shared/src/title-services.ts`  
Prefix: `/api/v1/title-services`

| Method | Path | Auth |
|--------|------|------|
| GET | `/title-services` | JWT — query `keyword`, `status` |
| GET | `/title-services/:id` | JWT |
| PATCH | `/title-services/:id` | JWT — status, giá, nhu cầu, ghim |
| POST | `/title-services/:id/progress` | JWT |
| POST | `/title-services/:id/money` | JWT |
| POST | `/title-services/:id/attachments` | JWT (mock: tên file, chưa upload R2) |
| DELETE | `/title-services/:id` | JWT |

## 8. Mock data cần có

- Đủ 4 trạng thái; ít nhất một hồ sơ **ghim** khớp ảnh (Huyền Trần / SD-2026-0001)
- Có và không tiến độ; có và không tài liệu
- Thu / chi > 0 và = 0
- `TAM_DUNG` vẫn hiện mặc định (không ẩn như lô tạm dừng)
- Đủ dòng để cuộn (~8+)

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

`tblTitleService*` → `TitleService*` (`docs/MIGRATION.md`). Giữ 4 status và các step type.

## 11. Open questions

- Form tạo hồ sơ từ khách hàng — làm sau list mock.
- Upload file thật lên R2 — API P3; mock chỉ ghi tên file.
