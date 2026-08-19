# Domain: Title services (Dịch vụ sổ đỏ)

- **Slug:** `title-services`
- **Status:** Ready for mock
- **Nguồn:** màn [`/dich-vu-so-do`](https://anhungland.com/dich-vu-so-do) (web mới) + CRM cũ
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.7 + §4.5
- **Contract:** `packages/shared/src/title-services.ts`

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần.

---

## 1. Mục đích

Theo dõi hồ sơ làm sổ đỏ: nhu cầu, tiến độ, thu/chi, tài liệu, số ngày đang làm.

## 2. Actors

| Actor | List | Không |
|-------|------|--------|
| STAFF | Hồ sơ mình tạo. Mock: list demo + dialog mock | Sửa hồ sơ NV khác |
| ADMIN | Tất cả; CRM cũ lọc NV | — |

Tạo hồ sơ từ menu khách «Dịch vụ sổ đỏ». **Không** nút Thêm trên list.

## 3. Khái niệm

| Trạng thái | Enum | Hangtag |
|------------|------|---------|
| Đang làm | `DANG_LAM` | green |
| Tạm dừng | `TAM_DUNG` | gray — **vẫn hiện** mặc định (không ẩn như lô) |
| Hoàn thành | `HOAN_THANH` | blue |
| Hủy | `HUY` | red |

**Số ngày:** từ `startedAt` đến nay; dừng khi Hoàn thành / Hủy (`completedAt`). `0` → «Hôm nay».

Tiến độ / thu-chi / loại tài liệu: enum trong contract (Bàn giá, Đo đạc, Nộp hồ sơ… · Thu/Chi · Sổ đỏ/Căn cước/Khác).

## 4–10.

GET `keyword`, `status`. PATCH ghim / sửa. POST tiến độ, tiền, file (mock tên file). DELETE mock. Không extension.

## 11. CRM cũ vs web mới

- Tìm: mã + tên + SĐT (cũ). Mới mock thêm nhu cầu / ghi chú / nhãn trạng thái.
- Cũ ADMIN: lọc NV. Mới: chưa.
- Không `@` / `@@`.

---

## 12. List `/dich-vu-so-do`

Thứ tự mỗi trang: **12.1 máy tính** → **12.2 mobile** → trong từng khối mới chi tiết thành phần. Không ghi «PC: … Mobile: …» trong cùng một mục.

---

### 12.1 Giao diện máy tính

```
┌ Ô tìm ───────────────────────────────────────────────────────┐
├ Bảng: # · Tên khách · Nhu cầu · Lịch sử · Giá/Thu/Chi        │
│       · Tài liệu · Số ngày · Thao tác                        │
├ Footer đếm ──────────────────────────────────────────────────┤
└ Panel phải: Chi tiết hồ sơ (một tab) ────────────────────────┘
```

Không nút thêm hồ sơ — thêm từ màn khách.

**Bấm nền hàng** → chọn + **mở panel** Chi tiết hồ sơ.

Sort: ghim trước, rồi `updatedAt` mới.

Ghim: nền vàng `#fef9c3`. Đang chọn: `#eff6ff`.

#### 12.1.1 Ô tìm kiếm

Placeholder: `Tìm mã hồ sơ, tên khách, SĐT...`

Gõ là lọc. Không `@`. (`TAM_DUNG` vẫn hiện trên list — khác `/lo-dat`.)

##### 1. Tìm theo (web mới)

- Mã hồ sơ (`SD-…`)
- Tên khách
- SĐT
- Nhu cầu, ghi chú, nhãn trạng thái

#### 12.1.2 Bộ lọc

Icon cột — trạng thái (cột Tên khách), nhu cầu / tiến độ / giá / tài liệu có-chưa.

#### 12.1.3 Item (dòng bảng)

##### 1. `#`

STT 1…N. **Ghim:** icon Lucide `Star` vàng `#ca8a04` **thay số**. Không emoji. Không lọc cột.

##### 2. Tên khách

Tên đậm + hangtag trạng thái.  
Dòng phụ: mã hồ sơ · SĐT.

##### 3. Nhu cầu

`needSummary`. Thiếu = `—`.

##### 4. Lịch sử đang làm

Bước mới nhất **đậm** + ngày `D/M/YYYY`. Chưa có = `Chưa ghi tiến độ`.

##### 5. Giá / Thu / Chi

Ba dòng: Giá `crm-money` · Thu xanh `#047857` · Chi đỏ `#b91c1c`. Thiếu giá = `—`; thu/chi 0 = `0 đ`.

##### 6. Tài liệu

`N file` hoặc `Chưa có`.

##### 7. Số ngày

Hangtag xanh: `N ngày` / `Hôm nay`. Không lọc cột.

##### 8. Thao tác (chevron)

| Mục | Việc |
|-----|------|
| Xem chi tiết | Chọn + mở panel. Route `[id]` vẫn placeholder |
| Ghim / Bỏ ghim | `isPinned` |
| Thêm tiến độ | Dialog mock |
| Nhập thu | Dialog mock |
| Nhập chi phí | Dialog mock |
| Thêm tài liệu | Dialog mock (tên file, chưa R2) |
| Sửa thông tin | Dialog mock (trạng thái, giá, nhu cầu) |
| Xóa hồ sơ | Đỏ → confirm → gỡ list (mock) |

#### 12.1.4 Footer

`Hiển thị N / Tổng M hồ sơ sổ đỏ`.

#### 12.1.5 Panel phải — Chi tiết hồ sơ

**Một** tab (không 3 thanh như khách hàng).

- Thu hẹp: thanh dọc, chữ xoay 90°, nhãn **Chi tiết hồ sơ**.
- Mở: tên + mã · SĐT; lưới Trạng thái / Giá / Đã thu / Đã chi; hộp Nhu cầu; nút `+ Tiến độ` `+ Tài liệu` `+ Thu` `+ Chi`; timeline tiến độ, file, thu/chi.
- Chưa chọn: «Chọn một hồ sơ…»

---

### 12.2 Giao diện mobile

```
┌ Ô tìm ───────────────────────────────────────────────────────┐
├ [Bộ lọc] [Tìm] ──────────────────────────────────────────────┤
├ Thẻ xếp dọc ─────────────────────────────────────────────────┤
├ Footer đếm ──────────────────────────────────────────────────┤
└ Không bảng, không panel, không nút thêm ─────────────────────┘
```

**Bấm thẻ** (không phải menu) → chọn dòng. **Không** nhảy `[id]`.

#### 12.2.1 Ô tìm + nút Tìm

Placeholder và quy tắc field: **cùng 12.1.1**. Nút **Tìm** = đóng bàn phím.

#### 12.2.2 Bộ lọc

Nút **Bộ lọc** + **Tìm** — Trạng thái. Xoá lọc.

#### 12.2.3 Item (thẻ)

##### 1. Đầu

Sao nếu ghim + tên đậm + hangtag + chevron (cùng menu 12.1.3 mục 8).

##### 2. Meta

Mã · số ngày · SĐT.

##### 3. Thân

Nhu cầu (2 dòng) · Giá / Thu / Chi · bước tiến độ · `N file` / Chưa có.

Ghim: nền vàng + viền trái `#ca8a04`.

#### 12.2.4 Footer

Cùng câu `Hiển thị N / Tổng M hồ sơ sổ đỏ`.

---

### 12.3 Chi tiết `/dich-vu-so-do/[id]`

Placeholder: mã + quay lại. Làm việc hàng ngày = list + panel (máy tính) / menu (cả hai).

---

*Hành vi list bám §12. Visual §4.3.7. Không copy god-file.*
