# Domain: Transactions (Giao dịch)

- **Slug:** `transactions`
- **Status:** Ready for mock
- **Nguồn:** màn [`/giao-dich`](https://anhungland.com/giao-dich) (web mới) + CRM cũ `/giao-dich`
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.6 + §4.5
- **Contract:** `packages/shared/src/transactions.ts`

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần.

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

Thứ tự mỗi trang: **12.1 máy tính** → **12.2 mobile** → trong từng khối mới chi tiết thành phần. Không ghi «PC: … Mobile: …» trong cùng một mục.

---

### 12.1 Giao diện máy tính

```
┌ 3 thẻ thống kê ──────────────────────────────────────────────┐
├ Ô tìm ───────────────────────────────────────────────────────┤
├ Bảng: Mã · Loại · Lô · Bán · Mua · Giá · HH · TT · Hẹn CC    │
│       · Ghi chú · Ngày tạo · Thao tác                        │
├ Footer đếm ──────────────────────────────────────────────────┤
└ Không rail, không nút thêm GD ───────────────────────────────┘
```

**Bấm nền hàng** → chọn. Chi tiết = menu.

Sort: `createdAt` mới → cũ.

#### 12.1.1 Ba thẻ thống kê

- Số lô giao dịch
- Tổng doanh thu (`crm-money`)
- Tổng hoa hồng (`crm-money`)

Doanh thu / hoa hồng: **OWN + HOAN_TAT** (mục 3). Đổi lọc / ô tìm → 3 thẻ đổi theo tập đang hiện.

#### 12.1.2 Ô tìm kiếm

Placeholder: `Tìm mã GD, lô đất, người bán, người mua, ghi chú...`

Gõ là lọc. Không `@`.

Hangtag **Clear** (`CrmBadge` gray) **ngay sau con trỏ** khi ô không trống. Bấm → xoá hết từ khoá, giữ focus. Chữ tràn → hangtag dính mép phải phần đang thấy.

##### 1. Tìm theo (web mới)

- Mã GD
- Tiêu đề lô
- Người bán, người mua
- Ghi chú
- Nhãn loại / trạng thái

Substring, không phân biệt hoa thường, giữ dấu.

#### 12.1.3 Bộ lọc

Icon cột — Loại, Lô, Người bán, Người mua, Giá, Hoa hồng (có / chưa / ghi nhận), Trạng thái, Hẹn CC, Ghi chú. Không lọc cột Mã GD / Ngày tạo.

#### 12.1.4 Item (dòng bảng)

##### 1. Mã GD

`GD-…`

##### 2. Loại

Hangtag **Của tôi** xanh / **Ghi nhận** xám.

##### 3. Lô đất

Tiêu đề lô. Thiếu = `—`.

##### 4. Người bán

Mỗi tên một dòng. Rỗng = `—`.

##### 5. Người mua

Như người bán.

##### 6. Giá bán

`crm-money`. 0 / thiếu = `—`.

##### 7. Hoa hồng

`OWN`: `crm-money` hoặc `—`.  
`RECORD`: luôn `—`.

##### 8. Trạng thái

Hangtag mục 3.

##### 9. Hẹn CC

Ngày `D/M/YYYY`.  
Đếm ngược **chỉ** Của tôi + Đã cọc:

- `Còn N ngày` xanh
- `Hôm nay` vàng
- `Quá N ngày` đỏ

Ghi nhận / không ngày / không còn Đã cọc: chỉ ngày hoặc `—`.

##### 10. Ghi chú

Một dòng, cắt `…`. Thiếu = `—`.

##### 11. Ngày tạo

`HH:mm:ss D/M/YYYY`.

##### 12. Thao tác (chevron)

| Mục | Việc |
|-----|------|
| Xem chi tiết | `/giao-dich/[id]` (placeholder) |
| Sửa | Toast — form sau |
| Xóa | Đỏ → confirm → gỡ khỏi list (mock). API: xóa cứng? mở lại rao bán lô? — sau |

#### 12.1.5 Footer

`Hiển thị N / Tổng M giao dịch`.

---

### 12.2 Giao diện mobile

```
┌ 3 thẻ thống kê (vẫn 3 cột) ──────────────────────────────────┐
├ Ô tìm ───────────────────────────────────────────────────────┤
├ [Bộ lọc] [Tìm] ──────────────────────────────────────────────┤
├ Thẻ xếp dọc ─────────────────────────────────────────────────┤
├ Footer đếm ──────────────────────────────────────────────────┤
└ Không rail, không nút thêm GD ───────────────────────────────┘
```

Không bảng.

**Bấm thẻ** (không phải menu) → `/giao-dich/[id]`.

#### 12.2.1 Ba thẻ thống kê

Cùng 12.1.1. Vẫn **3 cột**.

#### 12.2.2 Ô tìm + nút Tìm

Placeholder và quy tắc field: **cùng 12.1.2**. Nút **Tìm** = đóng bàn phím.

#### 12.2.3 Bộ lọc

Nút **Bộ lọc** + **Tìm** — Loại, Trạng thái. Xoá lọc.

#### 12.2.4 Item (thẻ)

##### 1. Đầu thẻ

Mã GD + hangtag Loại + hangtag Trạng thái + chevron (cùng menu 12.1.4 mục 12).

##### 2. Thân

- Tiêu đề lô đậm
- Người bán / Người mua
- Giá · Hoa hồng
- Hẹn CC (kèm đếm ngược) · Ghi chú · Ngày tạo

##### 3. Hẹn CC / hoa hồng

Cùng quy tắc 12.1.4 mục 7 và 9.

#### 12.2.5 Footer

Cùng câu `Hiển thị N / Tổng M giao dịch`.

---

### 12.3 Chi tiết `/giao-dich/[id]`

Placeholder: mã GD + quay lại.

---

*Hành vi list bám §12. Visual §4.3.6. Không copy god-file.*
