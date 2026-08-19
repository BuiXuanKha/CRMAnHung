# Domain: Transactions (Giao dịch)

- **Slug:** `transactions`
- **Status:** Ready for mock
- **Nguồn:** màn [`/giao-dich`](https://anhungland.com/giao-dich) (web mới) + CRM cũ `/giao-dich`
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.6 + §4.5
- **Contract:** `packages/shared/src/transactions.ts`

§12 = đặc tả list (đánh số, ngắn).

---

## 1. Mục đích

Theo dõi deal mua bán lô: loại, các bên, giá, hoa hồng, cọc → công chứng → hoàn thành, hẹn CC.

## 2. Actors

| Actor | List | Không |
|-------|------|--------|
| STAFF | GD mình tạo (CRM cũ). Mock mới: list demo + xóa mock | Sửa GD NV khác |
| ADMIN | Tất cả; CRM cũ lọc theo NV | — |

Không nút «Thêm GD» trên list — tạo từ lô / khách.

## 3. Khái niệm

| Loại | Enum | List |
|------|------|------|
| Của tôi | `OWN` | Có hoa hồng; đếm ngược hẹn CC khi Đã cọc |
| Ghi nhận | `RECORD` | Hoa hồng = `—`; **không** vào thẻ doanh thu / hoa hồng |

| Trạng thái | Enum | Hangtag |
|------------|------|---------|
| Đã cọc | `DA_COC` | amber |
| Đã công chứng | `DA_CONG_CHUNG` | blue |
| Hoàn thành | `HOAN_TAT` | green |
| Đã hủy | `HUY` | red |

**3 thẻ thống kê** (trên ô tìm):

1. Số lô giao dịch = số dòng đang hiện
2. Tổng doanh thu = `salePriceVnd` của **OWN + HOAN_TAT** trong cùng lọc
3. Tổng hoa hồng = `commissionVnd` cùng điều kiện

Gợi ý dưới số 2–3: «Chỉ giao dịch của tôi · Hoàn thành». Mobile: ẩn gợi ý; số rút gọn (tỷ / triệu). **Luôn 3 cột.**

## 4–10.

GET list: `keyword`, `type`, `status`. DELETE mock. Chi tiết / form sau. Không extension. Migrate `tblTransaction*`.

## 11. CRM cũ vs web mới

- Cũ: tìm Code + tiêu đề lô snapshot + ghi chú (API **không** tìm tên bên). Mới: mock tìm thêm người bán / mua, nhãn loại / trạng thái.
- Cũ ADMIN: lọc nhân viên. Mới: chưa mock cột NV.
- Không `@` / `@@`.

---

## 12. List `/giao-dich`

### 12.1 Section tìm + thống kê

#### 1. Ba thẻ (trên cùng)

- Số lô giao dịch
- Tổng doanh thu (`crm-money`)
- Tổng hoa hồng (`crm-money`)

Đổi lọc / ô tìm → 3 thẻ đổi theo tập đang hiện.

#### 2. Ô tìm kiếm

Placeholder: `Tìm mã GD, lô đất, người bán, người mua, ghi chú...`

Gõ là lọc. Mobile **Tìm** = đóng bàn phím.

##### 2.1 Tìm theo (web mới)

- Mã GD
- Tiêu đề lô
- Người bán, người mua
- Ghi chú
- Nhãn loại / trạng thái

Substring, không phân biệt hoa thường, giữ dấu. Không `@`.

##### 2.2 Không nút thêm GD

##### 2.3 Bộ lọc

**PC:** icon cột — Loại, Lô, Người bán, Người mua, Giá, Hoa hồng (có / chưa / ghi nhận), Trạng thái, Hẹn CC, Ghi chú. Không lọc cột Mã GD / Ngày tạo.

**Mobile:** **Bộ lọc** + **Tìm** — Loại, Trạng thái. Xoá lọc.

Không rail.

---

### 12.2 Section bảng (PC)

Tiêu đề: Mã GD · Loại · Lô đất · Người bán · Người mua · Giá bán · Hoa hồng · Trạng thái · Hẹn CC · Ghi chú · Ngày tạo · Thao tác.

Bấm nền hàng → chọn. Chi tiết = menu (hoặc bấm thẻ mobile).

Sort: `createdAt` mới → cũ.

#### 1.2 Item

##### 1.2.1 Mã GD

`GD-…`

##### 1.2.2 Loại

Hangtag **Của tôi** xanh / **Ghi nhận** xám.

##### 1.2.3 Lô đất

Tiêu đề lô. Thiếu = `—`.

##### 1.2.4 Người bán

Mỗi tên một dòng. Rỗng = `—`.

##### 1.2.5 Người mua

Như người bán.

##### 1.2.6 Giá bán

`crm-money`. 0 / thiếu = `—`.

##### 1.2.7 Hoa hồng

`OWN`: `crm-money` hoặc `—`.  
`RECORD`: luôn `—`.

##### 1.2.8 Trạng thái

Hangtag 1.3.

##### 1.2.9 Hẹn CC

Ngày `D/M/YYYY`.  
Đếm ngược **chỉ** Của tôi + Đã cọc:

- `Còn N ngày` xanh
- `Hôm nay` vàng
- `Quá N ngày` đỏ

Ghi nhận / không ngày / không còn Đã cọc: chỉ ngày hoặc `—`.

##### 1.2.10 Ghi chú

Một dòng, cắt `…`. Thiếu = `—`.

##### 1.2.11 Ngày tạo

`HH:mm:ss D/M/YYYY`.

##### 1.2.12 Thao tác (chevron)

| Mục | Việc |
|-----|------|
| Xem chi tiết | `/giao-dich/[id]` (placeholder) |
| Sửa | Toast — form sau |
| Xóa | Đỏ → confirm → gỡ khỏi list (mock). API: xóa cứng? mở lại rao bán lô? — sau |

#### 1.3 Footer

`Hiển thị N / Tổng M giao dịch`.

---

### 12.3 Thẻ mobile

3 thẻ thống kê **vẫn 3 cột**. Không bảng.

##### 1. Đầu thẻ

Mã GD + hangtag Loại + hangtag Trạng thái + chevron (cùng menu 1.2.12).

##### 2. Thân

- Tiêu đề lô đậm
- Người bán / Người mua
- Giá · Hoa hồng
- Hẹn CC (kèm đếm ngược) · Ghi chú · Ngày tạo

##### 3. Bấm thẻ (không phải menu)

→ `/giao-dich/[id]`.

##### 4. Footer

Cùng câu Hiển thị N / Tổng M.

---

### 12.4 Chi tiết `/giao-dich/[id]`

Placeholder: mã GD + quay lại.

---

*Hành vi list bám §12. Visual §4.3.6. Không copy god-file.*
