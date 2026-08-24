# Domain: Lodats (Lô đất)

- **Slug:** `lodats`
- **Status:** Draft — 4 cấp địa chỉ đã chốt; đang bàn kho dự án dùng chung vs luồng NV
- **Nguồn:** màn [`/lo-dat`](https://anhungland.com/lo-dat) (web mới) + CRM cũ `/lo-dat` (đọc hiểu, không copy god-file)
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.5 + §4.5
- **Contract:** `packages/shared/src/lodats.ts` (list mock — sẽ chỉnh khi model chốt)
- **Địa chỉ:** [`addresses.md`](./addresses.md)

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần.

---

## 0. Model 3 lớp (chốt 2026-08-24)

```
① Sổ địa chỉ     — Admin tạo trước. STAFF chỉ chọn.
② Thửa đất       — Kho dự án (admin) hoặc đất dân (NV tạo từ khách).
③ Rao bán / chủ  — Map NV–khách–lô: giá, mở bán, chủ hiện tại. Đổi chủ = đóng map cũ, mở map mới.
```

Chi tiết địa chỉ: [`addresses.md`](./addresses.md).

### 0.1 Hai loại thửa

| | **Lô kho (dự án)** | **Lô đất dân** |
|--|-------------------|----------------|
| Địa chỉ | Bắt buộc loại **Dự án** | Bắt buộc loại **Đất dân** |
| Ai tạo thửa | **Admin** — import Excel (hoặc form kho) | **STAFF** — từ hồ sơ khách |
| Chủ lúc tạo | **Chưa có** (nằm kho) | **Gắn ngay** khách đang tạo |
| Số lô / tiêu đề | Có sẵn, ổn định | NV đặt |
| DT · MT · hướng | Khoá với NV | NV tạo được sửa |
| Số lượng trong khu | Không đổi theo thời gian; NV **cấm** thêm lô | Mỗi lần tạo = thêm 1 thửa |
| `/lo-dat` NV | Chỉ hiện **luồng của NV đó** (đã gắn chủ) | Hiện vì luôn có chủ lúc tạo |
| Chủ trên cùng số lô | **Nhiều NV = nhiều chủ độc lập** (chốt) | 1 NV = 1 luồng; đổi chủ trong luồng đó |

Luật:

- Chọn địa chỉ dự án → bắt buộc chọn 1 lô **trong kho**, không tạo số lô mới.
- Chọn địa chỉ đất dân → tạo thửa mới + map chủ (chỉ luồng NV đó).
- Admin **không** tạo lô từ menu khách.
- NV gỡ chủ lô dự án = đóng luồng của NV đó; **kho vẫn còn** (NV khác không bị ảnh hưởng).

### 0.2 Luồng độc lập theo NV trên lô kho (chốt)

Đúng nghiệp vụ: **thông tin thửa dùng chung**; **chủ / giá / mở bán theo từng NV**.

Ví dụ LK12 trong dự án:

| | NV A | NV B |
|--|------|------|
| Số lô, DT, MT, hướng, ảnh dự án | Giống nhau (kho) | Giống nhau (kho) |
| Chủ hiện tại | Khách của A | Khách của B |
| Giá, hoa hồng, Mở bán/Tạm dừng | Của A | Của B |
| Đổi chủ | Chỉ trong luồng A | Chỉ trong luồng B |
| `/lo-dat` | A thấy LK12 của A | B thấy LK12 của B |

Một NV **không** có hai chủ active cùng lúc trên cùng số lô kho (như CRM cũ: 1 map active / NV / thửa kho).

Lô **đất dân** không dùng chung kho: thửa do NV tạo, NV khác không thấy / không gắn thêm.

### 0.3 Đổi chủ

Trong **một luồng NV**, chủ có thể chuyển nhượng (đóng map cũ, mở map mới). Giá/trạng thái map mới: như CRM cũ — `TAM_DUNG`, giá trống (chốt lại nếu muốn copy giá).

### 0.4 Kho vs lô của NV — trỏ, không copy (đề xuất, chờ chủ)

Bạn gợi ý: bảng kho dự án riêng; NV gắn chủ thì **copy** sang bảng lô.

Hai cách:

| | **Copy** (gợi ý ban đầu) | **Trỏ kho** (đề xuất) |
|--|--------------------------|------------------------|
| NV gắn chủ LK12 | Nhân bản DT/MT/tên vào bảng lô | Tạo luồng NV, `projectLotId` → LK12 |
| Admin sửa DT kho 80 → 82 | Bản copy của A và B **cũ** (lệch) | A và B **cùng thấy 82** |
| Đếm số lô trong dự án | Dễ đếm nhầm (2 copy = 2 LK12) | Đếm bảng kho = 1 |
| Đổi chủ | Sửa copy hoặc copy thêm | Chỉ đóng/mở map trong luồng NV |
| Ảnh dự án | Phải nhớ lấy từ kho, không từ copy | Luôn từ địa chỉ/kho |

**Đề xuất:** tách **bảng kho dự án** (đúng ý bạn) nhưng NV gắn chủ thì **trỏ**, không nhân bản thông số.

```
Address (dự án)
  └── ProjectLot     kho — LK12, DT, MT, hướng (admin)
        └── Lodat    lô của NV — chỉ với dự án: projectLotId + người tạo
              └── Map chủ  khách / giá / mở bán / lịch sử đổi chủ
Address (đất dân)
  └── Lodat          NV tạo thẳng, không qua kho
        └── Map chủ
```

`/lo-dat` đọc **Lodat của NV** (đã có map). Kho chưa ai gắn = không hiện.

Admin `/lo-dat`: mỗi NV một dòng LK12 (hai luồng) — **không** gộp 1 dòng như CRM cũ (cũ che hai chủ). **Chưa chốt** — xem §11.

### 0.5 Ảnh

| Nguồn | Ai | Ghi chú |
|-------|----|---------|
| Ảnh **dự án** (trên địa chỉ PROJECT) | Chỉ **Admin** thêm/sửa/xoá | STAFF xem trên lô; không đụng |
| Địa chỉ đất dân | **Không** có ảnh địa chỉ | — |
| Ảnh **riêng của lô** (upload / chat) | **Tạm hoãn** — chủ chưa trả lời |

Hangtag Nhà/Đất trên list = trục khác (nhà vs đất trống), **không** phải dự án vs dân. Copy data: chưa chốt.

---

## 1. Mục đích

Nhân viên xem / tìm lô đang rao: ảnh, địa chỉ, DT·MT·hướng, giá, mở bán hay tạm dừng.

## 2. Actors

| Actor | Được | Không |
|-------|------|--------|
| STAFF | List lô đã gắn chủ của mình; tạo lô dân từ khách; gắn chủ lô kho; đổi chủ (khi đã chốt quyền); sửa DT·MT lô dân mình tạo; công tắc Mở bán/Tạm dừng trên map mình | Tạo địa chỉ; import kho; sửa/xoá ảnh dự án; thêm lô vào dự án; hard-delete thửa |
| ADMIN | Sổ địa chỉ; import/sửa kho dự án; ảnh dự án; xem mọi lô đã gắn chủ; dọn lô kho tạo nhầm | Tạo lô từ menu khách |

Tạo lô NV: từ khách → «Tạo lô đất». Không nút thêm trên `/lo-dat`.

## 3. Khái niệm

| Thứ | Enum / field | List |
|-----|----------------|------|
| Loại thửa | suy từ `Address.kind`: PROJECT = kho, REGULAR = dân | Không phải hangtag Nhà/Đất |
| Rao bán | `DANG_BAN` / `TAM_DUNG` trên **map** | Công tắc **Mở bán** ↔ **Tạm dừng** |
| Phân loại | `NHA` / `DAT` | Hangtag Nhà / Đất — **web mới**; CRM cũ không có |
| Đã cọc / Đã bán | — | **Không** trên list; thuộc giao dịch |
| Chủ hiện tại | map `isActive` | Gợi ý tên khách (`customerHint`) |

Mặc định **ẩn** lô tạm dừng. Giá / hoa hồng / ghi chú giá nằm trên **map**, không trên thửa.

## 4–10.

List mock §12 đã có. Nest + Prisma **sau** khi §11 chốt. Không extension.

Copy: đơn vị hành chính → địa chỉ (+ ảnh dự án) → lô kho/dân → map chủ → ảnh lô → R2. Giá `BIGINT`. Hoa hồng CRM cũ = chữ (`BrokerFeeNote`).

## 11. CRM cũ vs web mới + còn phải chốt

List:

- Cũ: chỉ `@` (gồm tạm dừng). Mới: thêm `@@` = chỉ tạm dừng.
- Cũ: tìm Title + địa chỉ (API **không** tìm tên khách). Mới: mock tìm thêm `customerHint`.
- Cũ: bấm hàng → chi tiết; nút **GD** / **Sửa** trên dòng. Mới: menu chevron; bấm hàng PC = chọn.
- Cũ: lọc gồm Đang bán / Đã cọc / Đã bán / Tạm dừng. Mới: **chỉ** Mở bán / Tạm dừng.

Quyền đã siết so với cũ: **chỉ Admin** tạo địa chỉ và import kho (cũ: mọi user đăng nhập CRUD địa chỉ).

### Còn phải chốt (trước khi sửa Prisma)

Đã chốt: 4 cấp địa chỉ; **nhiều NV / nhiều chủ độc lập** trên cùng lô kho (không gộp 1 chủ toàn công ty).

**Đang bàn:** gắn chủ lô kho = **trỏ** kho (đề xuất, §0.4) hay **copy** thông số sang bảng lô.

Tạm hoãn (chủ chưa trả lời):

1. **Ảnh riêng trên lô** (không phải ảnh dự án): NV thêm/gỡ được không?
2. **Ai được đổi chủ** trong luồng của mình / admin / NV khác?
3. List **admin** `/lo-dat`: 1 dòng / NV / LK12 (hai luồng hiện đủ) hay gộp 1 dòng như CRM cũ?

Nhẹ hơn (mặc định nếu không bác): hangtag Nhà/Đất copy = `DAT`; số lô trùng trong kho = cấm; admin được bổ sung lô vào dự án đã import; `DAT_COC`/`DA_BAN` cũ giữ khi copy, list chỉ hiện Mở bán/Tạm dừng. Giá `BIGINT`; hoa hồng chữ.

---

## 12. List `/lo-dat`

Thứ tự mỗi trang: **12.1 máy tính** → **12.2 mobile** → trong từng khối mới chi tiết thành phần. Không ghi «PC: … Mobile: …» trong cùng một mục.

---

### 12.1 Giao diện máy tính

```
┌ Ô tìm ───────────────────────────────────────────────────────┐
├ Bảng: Ảnh · Tiêu đề/Địa chỉ · Phân loại · DT·MT·Hướng · Giá ─┤
│       · Trạng thái · Cập nhật · Thao tác                     │
├ Footer đếm ──────────────────────────────────────────────────┤
└ Không rail phải ─────────────────────────────────────────────┘
```

**Bấm nền hàng** → chọn. Không vào chi tiết (chi tiết = menu).

Không nút thêm lô — thêm từ màn khách.

#### 12.1.1 Ô tìm kiếm

Placeholder: `Tìm lô, địa chỉ, khách... (@ cả tạm dừng)`

Gõ là lọc. `@` → viền vàng + badge.

##### 1. Tìm theo

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

#### 12.1.2 Bộ lọc

Icon cột: ảnh / địa chỉ / phân loại / thông số / giá có-chưa / trạng thái.

#### 12.1.3 Item (dòng bảng)

##### 1. Ảnh

Thumbnail. Thiếu = ô trống. `+N` nếu còn ảnh.

##### 2. Tiêu đề / Địa chỉ

Tiêu đề đậm. Dòng phụ = địa chỉ hoặc `—`.

##### 3. Phân loại

Hangtag **Nhà** xanh / **Đất** vàng.

##### 4. DT · MT · Hướng

Dòng 1: diện tích. Dòng 2: `MT … · hướng`. Thiếu = `—`.

##### 5. Giá bán

`crm-money`. Phụ: ghi chú giá, hoa hồng `%`. Thiếu giá = `—`.

##### 6. Trạng thái (công tắc)

Bật = Mở bán. Tắt = Tạm dừng → lô biến khỏi list mặc định (gõ `@` để thấy).  
Không phải đã bán / đặt cọc.

##### 7. Cập nhật

`HH:mm:ss D/M/YYYY`. Không lọc cột.

##### 8. Thao tác (chevron)

| Mục | Việc hiện tại |
|-----|----------------|
| Xem chi tiết | `/lo-dat/[id]` (placeholder) |
| Giao dịch | Toast — form sau |
| Sửa | Toast — form sau |

CRM cũ: nút GD / Sửa / Xóa (admin, lô admin tạo) trên dòng.

##### 9. Sort

`updatedAt` mới → cũ.

#### 12.1.4 Footer

`Hiển thị N / Tổng M lô đất`.

---

### 12.2 Giao diện mobile

```
┌ Ô tìm ───────────────────────────────────────────────────────┐
├ [Bộ lọc] [Tìm] ──────────────────────────────────────────────┤
├ Thẻ xếp dọc ─────────────────────────────────────────────────┤
├ Footer đếm ──────────────────────────────────────────────────┤
└ Không rail, không nút thêm ──────────────────────────────────┘
```

Không bảng, không menu, không công tắc, không hangtag Nhà/Đất.

**Bấm thẻ** → `/lo-dat/[id]`.

#### 12.2.1 Ô tìm + nút Tìm

Placeholder và quy tắc field / `@` / `@@`: **cùng 12.1.1**.

Nút **Tìm** = đóng bàn phím.

#### 12.2.2 Bộ lọc

Nút **Bộ lọc** + **Tìm** — Trạng thái, khoảng giá (bước 500tr + Chưa có giá). Xoá lọc.

#### 12.2.3 Item (thẻ)

##### 1. Tiêu đề đậm (trên)

##### 2. Ảnh trái

Thumbnail. Hangtag **Mở bán** / **Tạm dừng** trên ảnh. `+N` ảnh thêm.

CRM cũ: bấm ảnh → gallery. Web mới: bấm cả thẻ → chi tiết.

##### 3. Phải ảnh

Địa chỉ · giá · một dòng DT · MT · hướng.

#### 12.2.4 Footer

Cùng câu `Hiển thị N / Tổng M lô đất`.

---

### 12.3 Chi tiết `/lo-dat/[id]`

Placeholder: tên lô + quay lại. Ảnh / chủ / ghi chú — sau.

---

*Hành vi list bám §12. Visual §4.3.5. Không copy god-file CRM cũ.*
