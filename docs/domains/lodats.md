# Domain: Lodats (Lô đất)

- **Slug:** `lodats`
- **Status:** Ready for API — list + chi tiết + gallery + lô cùng xã + **trang sửa** `/sua`; **chưa bàn** list ADMIN / đổi chủ / tạo lô từ khách
- **Nguồn:** màn [`/lo-dat`](https://anhungland.com/lo-dat) (web mới) + CRM cũ `/lo-dat` (học, không copy god-file)
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.5 + §4.5
- **Contract:** `packages/shared/src/lodats.ts` (`LodatListItem` + `LodatDetail`)
- **Địa chỉ:** [`addresses.md`](./addresses.md)

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần.

---

## 0. Model 3 lớp (chốt 2026-08-24)

```
① Sổ địa chỉ          — Admin tạo trước. STAFF chỉ chọn.
②a Kho lô dự án       — ProjectLot: số lô, DT, MT, hướng. Chỉ Admin.
②b Bảng lô đất        — Lodat: lô dân (tự có thông số) hoặc lô dự án (trỏ ②a).
③ Rao bán / chủ       — Map NV–khách–lô: giá, mở bán, chủ. Đổi chủ trong luồng NV.
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

Trong **một luồng NV**, chủ có thể chuyển nhượng (đóng map cũ, mở map mới).

Quyền đổi chủ thuộc **nhân viên đang giữ luồng đó** (là người tạo `Lodat` trỏ `ProjectLot` và gắn chủ cho lô thuộc dự án). ADMIN có quyền tương tự.

### 0.4 Hai bảng lô — trỏ kho, không copy (chốt)

Đúng như chủ mô tả:

- **`ProjectLot`** (lô đất dự án / kho): thông số cơ bản do **Admin** nhập (số lô, DT, MT, hướng, ghi chú, `addressId` dự án). Admin thêm / sửa / xoá kho. Sửa DT trên kho → **mọi** `Lodat` đang trỏ sang đều thấy số mới (JOIN, không nhân bản).
- **`Lodat`** (bảng lô đất, `/lo-dat`): gồm **lô dân** và **lô dự án**.
  - Lô dân: tự lưu tiêu đề, DT, MT, hướng, `addressId` đất dân. `projectLotId` trống.
  - Lô dự án: `projectLotId` trỏ `ProjectLot`. **Không** lưu lại DT/MT/số lô. Đọc từ kho.

```
Address PROJECT
  └── ProjectLot          kho — LK12, 82 m² (admin)
        └── Lodat         lô dự án của NV A — chỉ projectLotId
        └── Lodat         lô dự án của NV B — cùng projectLotId
              └── Map chủ
Address REGULAR
  └── Lodat               lô dân — tự có DT/MT
        └── Map chủ
```

Luật:

- NV gắn chủ lô kho = **tạo `Lodat` trỏ** `ProjectLot` (không copy cột). Tối đa 1 `Lodat` active / NV / 1 dòng kho.
- NV **không** sửa thông số `ProjectLot`.
- Admin sửa kho: mọi list đang trỏ đổi theo.
- Admin **xoá** dòng kho: **cấm** nếu còn `Lodat` đang trỏ (tránh list NV mất DT/số lô). Muốn ẩn kho → ẩn mềm, hoặc gỡ hết luồng NV trước.
- `/lo-dat` đọc `Lodat`. Kho chưa ai gắn = không hiện trên list NV.

Admin `/lo-dat`: mỗi NV một dòng LK12 (hai luồng hiện đủ). **Chưa chốt** có gộp 1 dòng không — xem §11.

### 0.5 Ảnh

| Nguồn | Ai | Ghi chú |
|-------|----|---------|
| Ảnh **dự án** (trên địa chỉ PROJECT) | Chỉ **Admin** thêm/sửa/xoá | Mọi lô thuộc dự án A đều hiện **ảnh chung** dự án |
| Ảnh **lô đất thường** (Lodat REGULAR) | NV tạo lô | Upload riêng hoặc gắn path ảnh chat (reuse) |
| Ảnh riêng thửa **dự án** (theo luồng NV) | NV gắn khi tạo/sửa | Ghép với ảnh dự án trên chi tiết (giống CRM cũ) |

Hangtag Nhà/Đất trên list = trục khác (nhà vs đất trống), **không** phải dự án vs dân.

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
| Loại thửa | `Lodat.projectLotId` trống = dân; có FK = dự án (đọc thông số từ `ProjectLot`) | Không phải hangtag Nhà/Đất |
| Rao bán | `DANG_BAN` / `TAM_DUNG` trên **map** | Công tắc **Mở bán** ↔ **Tạm dừng** |
| Phân loại | `NHA` / `DAT` | Hangtag Nhà / Đất — **web mới**; CRM cũ không có |
| Đã cọc / Đã bán | — | **Không** trên list; thuộc giao dịch |
| Chủ hiện tại | map `isActive` | Gợi ý tên khách (`customerHint`) |

Mặc định **ẩn** lô tạm dừng. Giá / hoa hồng / ghi chú giá nằm trên **map**, không trên thửa.

## 4–10.

List mock §12 đã có. Nest + Prisma **sau** khi §11 chốt. Không extension.

Copy: đơn vị hành chính → địa chỉ (+ ảnh dự án) → **`ProjectLot` kho** → `Lodat` (+ map chủ) → ảnh lô → R2. Giá `BIGINT`. Hoa hồng CRM cũ = chữ (`BrokerFeeNote`).

## 11. CRM cũ vs web mới + còn phải chốt

List:

- Cũ: chỉ `@` (gồm tạm dừng). Mới: thêm `@@` = chỉ tạm dừng.
- Cũ: tìm Title + địa chỉ (API **không** tìm tên khách). Mới: mock tìm thêm `customerHint`.
- Cũ: bấm hàng → chi tiết; nút **GD** / **Sửa** trên dòng. Mới: menu chevron; bấm hàng PC = chọn.
- Cũ: lọc gồm Đang bán / Đã cọc / Đã bán / Tạm dừng. Mới: **chỉ** Mở bán / Tạm dừng.

Quyền đã siết so với cũ: **chỉ Admin** tạo địa chỉ và import kho (cũ: mọi user đăng nhập CRUD địa chỉ).

### Còn phải chốt (trước khi sửa Prisma)

Đã chốt: 4 cấp địa chỉ; nhiều NV / nhiều chủ độc lập trên cùng dòng kho; **`Lodat` trỏ `ProjectLot`**, không copy DT/MT (§0.4). Admin xoá kho khi còn NV đang trỏ = **cấm**.

Tạm hoãn (chưa bàn — trước mắt chỉ làm UI cho STAFF):

1. List **ADMIN** `/lo-dat`: hiển thị theo cách nào (tách theo NV/luồng hay gộp theo LK12)? — **chờ bàn sau**.

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

Icon cột: ảnh / địa chỉ / phân loại / **DT (khoảng) + hướng** / giá có-chưa / trạng thái.

Cột **DT · MT · Hướng** — menu lọc 2 nhóm (AND):

| Nhóm | Lựa chọn |
|------|----------|
| Diện tích | Tất cả · 1–100 m² · 100–200 m² · Trên 200 m² |
| Hướng | Tất cả · Đông · Tây · Nam · Bắc · Đông Bắc · Đông Nam · Tây Bắc · Tây Nam · Mặt nước · Khác |

Biên DT: `1–100` = 1≤DT≤100; `100–200` = 100&lt;DT≤200; `Trên 200` = DT&gt;200. Thiếu DT không khớp khoảng.

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

Học CRM cũ `LodatDetailPage` — **không** copy god-file. Slice 1 (đọc + toggle):

#### 12.3.1 Máy tính

```
← Danh sách
┌ detailLayout (grid 2fr | 1fr, ≥1024px) ────────────────────────────┐
│ ┌ content (trái) ──────────────┐  ┌ relatedAside sticky phải ───┐ │
│ │ Header: tiêu đề · địa chỉ ·  │  │ Lô đất cùng xã              │ │
│ │   hangtag · Mở bán · Copy    │  │ {tên xã}                    │ │
│ │ Hero ảnh (prev/next→gallery) │  │ list scroll độc lập         │ │
│ │ Specs · chủ · ghi chú        │  │ (thumb · title · giá · TT)  │ │
│ │ Nút Giao dịch / Sửa          │  └─────────────────────────────┘ │
│ └──────────────────────────────┘                                  │
└────────────────────────────────────────────────────────────────────┘
```

#### 12.3.2 Mobile

Xếp dọc: content → **Lô đất cùng xã** dưới specs; footer dính đáy: **Giao dịch** · **Sửa lô đất**.

#### 12.3.3 Gallery ảnh (đã làm)

Full-screen giống CRM cũ: tiêu đề + `N / M` · đóng · prev/next · vuốt · chấm · **Tải về** · **Xoay trái/phải** · icon mở ảnh gốc.

- Ảnh **lô** (`LodatImage`): xoay **lưu DB** (`rotationDeg`).
- Ảnh **dự án chung** (`AddressImage`): chỉ xem; xoay phiên không lưu (Admin sửa ảnh dự án trên sổ địa chỉ).

#### 12.3.4 Lô cùng xã (đã làm)

CRM cũ `relatedAside`: desktop **cột phải sticky** (`max-height` + scroll thân); mobile dưới content. Danh sách lô **cùng `wardId`**, cùng quyền list (STAFF chỉ luồng mình), trừ lô đang xem. Thẻ bấm → `/lo-dat/[id]`. Không có xã → ẩn khối.

#### 12.3.5 Để sau

Lịch sử chủ / đổi chủ · lịch sử GD · **upload ảnh** (form tạo/sửa — upload LodatImage trên trang sửa slice sau nếu chưa kịp) · form tạo lô từ khách.

---

### 12.4 Trang sửa `/lo-dat/[id]/sua`

Học CRM cũ `LodatEditPage` (route `/lo-dat/:id/sua`) — **không** copy god-file. Full page (không modal).

#### 12.4.1 Máy tính

Layout: **2 cột** desktop — trái form (thông số / chủ & giá / lịch sử); phải **Hình ảnh + Xem nhanh** sticky top; **Huỷ/Lưu dưới form** (không sticky/fixed).

```
← Chi tiết lô · H1 Sửa lô đất · badge
┌ bodyGrid ──────────────────────────────────────────────────────────┐
│ ┌ areaInfo ─────────────────────┐  ┌ areaSide (sticky top) ─────┐ │
│ │ Thông số lô                   │  │ Hình ảnh · dán/kéo thả     │ │
│ │ Chủ đất & giá bán · Đổi chủ   │  │ thumb + × · Xem nhanh N/M  │ │
│ │ Lịch sử chủ đất (nếu có)      │  │ [xoay] preview → gallery   │ │
│ └───────────────────────────────┘  └────────────────────────────┘ │
│ ┌ areaActions (full width) ─────────────────────────────────────┐ │
│ │                         Huỷ · Lưu thay đổi                    │ │
│ └───────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

#### 12.4.2 Mobile

Xếp dọc: thông số → chủ/giá → lịch sử → hình ảnh → xem nhanh → Huỷ/Lưu **ở cuối form** (không nổi fixed). Desktop paste-zone; mobile nút «Thêm ảnh».

#### 12.4.3 Chip / hướng (CRM cũ)

- Hướng: Đông, Tây, Nam, Bắc, Đông Bắc, Đông Nam, Tây Bắc, Tây Nam, Mặt nước, Khác  
- Ghi chú giá: Thương lượng · Cứng giá · Chưa chi tiết  
- Hoa hồng: 1% · 2% · Chưa trao đổi  

Quyền: NV/Admin chỉ sửa lô mình được truy cập. PROJECT khoá thông số thửa; map giá vẫn sửa được.

#### 12.4.4 Để sau trên trang sửa

Đổi chủ (modal) · lịch sử chủ **đầy đủ** (mọi map đã kết thúc) · gắn ảnh chat.

Hiện tại: card «Lịch sử chủ đất» chỉ hiện **chủ active** từ detail (UI khớp CRM cũ).

---

## 13. Lịch làm — thứ tự DB (STAFF trước)

**Có: phải có sổ địa chỉ trước lô.** Prisma + copy kho/map/ảnh **xong staging**. API list `/lo-dat` STAFF trong PR này. Còn: Admin import kho, tạo lô, đổi chủ, list ADMIN.

Khách (`Customer`) **đã có** — map chủ mới gắn được.

Mỗi mục dưới = một slice nhỏ (docs/contract nếu thiếu → schema/API → UI STAFF hoặc Admin cần cho STAFF → copy data nếu có). UI list **ADMIN** `/lo-dat` = sau, không xen vào đây.

```
User, Customer          ← xong
     ↓
Tỉnh → Huyện → Xã
     ↓
Address (+ ảnh dự án)
     ↓
ProjectLot (kho)
     ↓
Lodat  ──dân: DT/MT trên Lodat
       ──dự án: trỏ ProjectLot
     ↓
Map chủ (giá, mở bán, lịch sử)
     ↓
Ảnh lô dân + list /lo-dat STAFF
```

| # | Việc | Vì sao thứ tự này | Ghi chú Prisma / copy |
|---|------|-------------------|------------------------|
| **1** | Sửa schema **Tỉnh / Huyện / Xã** + copy từ `tblAddr*` | Address bắt buộc `wardId` | Schema + copy **xong staging** |
| **2** | Sửa schema **Address** + **AddressImage** chỉ PROJECT | NV chọn địa chỉ khi tạo lô | Schema + API + UI + copy **xong staging** |
| **3** | UI + API **sổ địa chỉ (Admin)** + picker (STAFF đọc) | Không có sổ thì không tạo/gắn lô | **Done** |
| **4** | Schema **`ProjectLot`** (kho: số lô, DT, MT, hướng, `addressId` PROJECT) | Lodat dự án **trỏ** kho, không copy | Migration `20260824120000` |
| **5** | Admin **import/sửa kho** trên địa chỉ dự án | Kho phải có sẵn trước khi NV gắn chủ | Todo |
| **6** | Copy **lô PROJECT** cũ `tblLodats` → `ProjectLot` | Data kho thật | Script `pnpm project-lots:migrate-legacy` — map `project_lot` |
| **7** | Sửa schema **`Lodat` + `LodatCustomerMap`** | List `/lo-dat` đọc Lodat + map | Cùng migration `20260824120000` |
| **8** | Copy **lô dân** `tblLodats` REGULAR → `Lodat` + map | List dân | 1 lodat cũ + maps |
| **9** | Copy **map NV–khách** PROJECT: mỗi map active → 1 `Lodat` trỏ `ProjectLot` + `LodatCustomerMap` | Luồng độc lập theo NV | Cũ: 1 `tblLodats` + nhiều map. Mới: nhiều `Lodat` cùng `projectLotId` |
| **10** | Copy **ảnh lô** → `LodatImage` | Ảnh dự án Address đã ở bước 2 | **Xong staging** (10d + 10e) |
| **11** | API + nối UI **list `/lo-dat` STAFF** (mock §12 → API) | Màn hình NV | `GET/PATCH /api/v1/lodats` — lọc `createdBy`; `@` / `@@`; công tắc Mở bán/Tạm dừng |
| **12** | Tạo lô từ khách: dân (tạo Lodat) / dự án (chọn kho → tạo Lodat trỏ) | Không nút thêm trên `/lo-dat` | Form + picker địa chỉ bước 3 |
| **13** | Chi tiết `/lo-dat/[id]` (đọc) + đổi chủ / ảnh upload | Đã chốt quyền | Đọc + gallery + cùng xã + **form sửa** (PATCH + upload LodatImage) **xong**; đổi chủ Todo |
| **14** | List UI **ADMIN** `/lo-dat` | Bạn bảo làm sau | Không làm trong lịch STAFF |

Copy data: script **chỉ đọc** SQLite, idempotent, map id trong schema `migrate` — như khách. Skill agent: **`migrate-legacy-data`** (preflight FK, giữ luồng kha/buinam, reshape PROJECT → `ProjectLot`).
