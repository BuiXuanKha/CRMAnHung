# Domain: Lodats (Lô đất)

- **Slug:** `lodats`
- **Status:** Ready for mock
- **Nguồn:** màn [`/lo-dat`](https://anhungland.com/lo-dat) (web mới) + CRM cũ `/lo-dat` (đọc hiểu, không copy god-file)
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.5 + §4.5
- **Contract:** `packages/shared/src/lodats.ts`

§12 = đặc tả list (đánh số, ngắn).

---

## 1. Mục đích

Nhân viên xem / tìm lô đang rao: ảnh, địa chỉ, DT·MT·hướng, giá, mở bán hay tạm dừng.

## 2. Actors

| Actor | List | Không |
|-------|------|--------|
| STAFF | Lô gắn khách mình tạo (CRM cũ); mock mới: list demo | Hard-delete |
| ADMIN | Tất cả; CRM cũ: cột NV, xoá lô admin tạo | Tạo lô từ menu khách (CRM cũ) |

Tạo lô: từ khách → «Tạo lô đất», không có nút thêm trên `/lo-dat`.

## 3. Khái niệm

| Thứ | Enum / field | List |
|-----|----------------|------|
| Rao bán | `DANG_BAN` / `TAM_DUNG` | Công tắc **Mở bán** ↔ **Tạm dừng** |
| Phân loại | `NHA` / `DAT` | Hangtag Nhà / Đất — **web mới**; CRM cũ không có cột này |
| Đã cọc / Đã bán | — | **Không** trên list; thuộc giao dịch |

Mặc định **ẩn** lô tạm dừng.

## 4–10.

Contract + mock đã có. Nest list sau khi §12 ổn. Không extension. Migrate: Title, địa chỉ, AreaM2, FrontageM, Direction, Price, hoa hồng, SaleStatus, ảnh.

## 11. CRM cũ vs web mới

- Cũ: chỉ `@` (gồm tạm dừng). Mới: thêm `@@` = chỉ tạm dừng.
- Cũ: tìm Title + địa chỉ (placeholder ghi «khách» nhưng API **không** tìm tên khách). Mới: mock tìm thêm `customerHint`.
- Cũ: bấm hàng → chi tiết; nút **GD** / **Sửa** trên dòng. Mới: menu chevron; bấm hàng PC = chọn.
- Cũ: lọc trạng thái gồm Đang bán / Đã cọc / Đã bán / Tạm dừng. Mới: **chỉ** Mở bán / Tạm dừng.

---

## 12. List `/lo-dat`

### 12.1 Section tìm kiếm

#### 1. Ô tìm kiếm

Placeholder: `Tìm lô, địa chỉ, khách... (@ cả tạm dừng)`

Gõ là lọc. Mobile **Tìm** = đóng bàn phím. `@` → viền vàng + badge.

##### 1.1 Tìm theo

- Tiêu đề lô
- Địa chỉ
- Tên khách (`customerHint` — mock mới)
- Hướng, nhãn Nhà/Đất

Substring, không phân biệt hoa thường, **giữ dấu**.

| Ô tìm | Tập lô |
|-------|--------|
| Không `@` | Chỉ **Mở bán** |
| `@` | Mở bán **+** Tạm dừng |
| `@@` | **Chỉ** Tạm dừng |

Lọc cột Trạng thái = Tạm dừng vẫn hiện lô tạm dừng (không cần `@`).

##### 1.2 Không có nút thêm lô

Thêm lô từ màn khách.

##### 1.3 Bộ lọc

**PC:** icon cột (ảnh / địa chỉ / phân loại / thông số / giá có-chưa / trạng thái).

**Mobile:** **Bộ lọc** + **Tìm** — Trạng thái, khoảng giá (bước 500tr + Chưa có giá). Xoá lọc.

Không rail phải.

---

### 12.2 Section bảng (PC)

Tiêu đề: Ảnh · Tiêu đề / Địa chỉ · Phân loại · DT · MT · Hướng · Giá bán · Trạng thái · Cập nhật · Thao tác.

Bấm nền hàng → chọn. Không vào chi tiết (chi tiết = menu hoặc mobile).

#### 1.2 Item

##### 1.2.1 Ảnh

Thumbnail. Thiếu = ô trống. `+N` nếu còn ảnh.

##### 1.2.2 Tiêu đề / Địa chỉ

Tiêu đề đậm. Dòng phụ = địa chỉ hoặc `—`.

##### 1.2.3 Phân loại

Hangtag **Nhà** xanh / **Đất** vàng.

##### 1.2.4 DT · MT · Hướng

Dòng 1: diện tích. Dòng 2: `MT … · hướng`. Thiếu = `—`.

##### 1.2.5 Giá bán

`crm-money`. Phụ: ghi chú giá, hoa hồng `%`. Thiếu giá = `—`.

##### 1.2.6 Trạng thái (công tắc)

Bật = Mở bán. Tắt = Tạm dừng → lô biến khỏi list mặc định (gõ `@` để thấy).  
Không phải đã bán / đặt cọc.

##### 1.2.7 Cập nhật

`HH:mm:ss D/M/YYYY`. Không lọc cột.

##### 1.2.8 Thao tác (chevron)

| Mục | Việc hiện tại |
|-----|----------------|
| Xem chi tiết | `/lo-dat/[id]` (placeholder) |
| Giao dịch | Toast — form sau |
| Sửa | Toast — form sau |

CRM cũ: nút GD / Sửa / Xóa (admin, lô admin tạo) trên dòng.

##### 1.2.9 Sort

`updatedAt` mới → cũ.

#### 1.3 Footer

`Hiển thị N / Tổng M lô đất`.

---

### 12.3 Thẻ mobile

Không bảng, không menu, không công tắc, không hangtag Nhà/Đất.

##### 1. Tiêu đề đậm (trên)

##### 2. Ảnh trái

Thumbnail. Hangtag **Mở bán** / **Tạm dừng** trên ảnh. `+N` ảnh thêm.

Bấm ảnh trên CRM cũ → gallery. Web mới: bấm cả thẻ → chi tiết.

##### 3. Phải ảnh

Địa chỉ · giá · một dòng DT · MT · hướng.

##### 4. Bấm thẻ

→ `/lo-dat/[id]`.

##### 5. Footer

Cùng câu Hiển thị N / Tổng M.

---

### 12.4 Chi tiết `/lo-dat/[id]`

Placeholder: tên lô + quay lại. Ảnh / chủ / ghi chú — sau.

---

*Hành vi list bám §12. Visual §4.3.5. Không copy god-file CRM cũ.*
