# Domain: Lodats (Lô đất)

- **Slug:** `lodats`
- **Status:** Done — list `/lo-dat` STAFF + chi tiết + gallery + cùng xã + sửa `/sua` (đổi chủ) + tạo từ khách + tạo GD; **chưa bàn** list ADMIN
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

Quyền đổi chủ thuộc **nhân viên đang giữ luồng đó** (người tạo `Lodat`). **Admin không đổi chủ** (chốt owner 2026-09-05).

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

Upload **mới** từ máy (tạo lô hoặc sửa lô): object key CDN = `{slug tên+địa chỉ}-anh-{n}.webp` (API convert WebP). Đổi tiêu đề / địa chỉ rồi Lưu → đổi lại key cho khớp. Ảnh gắn từ chat: **copy** sang key lô SEO WebP, **giữ** file `customers/chat/` (WebP sau `images:webp-replace`; cùng ảnh chat trên hai lô → hai bản SEO). Ảnh **dự án**: `{tên dự án}-anh-{n}.webp` từ `Address.detail`. **Đăng web không làm SEO ảnh lần nữa.**

**Kho cũ:** ảnh lô + ảnh dự án — `pnpm images:seo-copy` rồi `APPLY=1`. Ảnh lô trỏ chat: copy SEO, giữ chat. Ảnh dự án còn UUID: `pnpm images:seo-copy-addresses`.

Hangtag Nhà/Đất trên list = trục khác (nhà vs đất trống), **không** phải dự án vs dân.

---

## 1. Mục đích

Nhân viên xem / tìm lô đang rao: ảnh, địa chỉ, DT·MT·hướng, giá, mở bán hay tạm dừng.

## 2. Actors

| Actor | Được | Không |
|-------|------|--------|
| STAFF | List lô đã gắn chủ của mình; tạo lô dân từ khách; gắn chủ lô kho; đổi chủ (khi đã chốt quyền); sửa DT·MT lô dân mình tạo; công tắc Mở bán/Tạm dừng trên map mình; soạn/Đăng/Gỡ web lô mình trên `/dashboard/lo-dat` | Tạo địa chỉ; import kho; sửa/xoá ảnh dự án; thêm lô vào dự án; hard-delete thửa; bài CMS |
| ADMIN | Sổ địa chỉ; import/sửa kho dự án; ảnh dự án; xem mọi lô đã gắn chủ; dọn lô kho tạo nhầm | Tạo lô từ menu khách |

Tạo lô NV: từ khách → «Tạo lô đất». Không nút thêm trên `/lo-dat`.

## 3. Khái niệm

| Thứ | Enum / field | List |
|-----|----------------|------|
| Loại thửa | `Lodat.projectLotId` trống = dân; có FK = dự án (đọc thông số từ `ProjectLot`) | Không phải hangtag Nhà/Đất |
| Rao bán | `DANG_BAN` / `TAM_DUNG` trên **map** | Công tắc **Mở bán** ↔ **Tạm dừng** |
| Phân loại | `Lodat.propertyKind` `NHA` / `DAT` (cột Postgres; mặc định `DAT`) | Hangtag Nhà / Đất — **web mới**. CRM cũ không có → copy gán hết `DAT`. Lọc hangtag = **icon cột Phân loại**, không phải ô tìm |
| Đã cọc / Đã bán | — | **Không** trên list; thuộc giao dịch |
| Chủ hiện tại | map `isActive` | Gợi ý tên khách (`customerHint`) |

Mặc định **ẩn** lô tạm dừng. Giá / hoa hồng / ghi chú giá nằm trên **map**, không trên thửa.

## 4–10.

List §12 + **GET `/lodats`** đã nối (login thật). `limit` mặc định 50, tối đa 200, `offset` từ 0, `total` = COUNT cùng filter (kể cả lọc cột). Không extension.

Copy: đơn vị hành chính → địa chỉ (+ ảnh dự án) → **`ProjectLot` kho** → `Lodat` (+ map chủ) → ảnh lô → R2. Giá `BIGINT`. Hoa hồng CRM cũ = chữ (`BrokerFeeNote`).

## 11. CRM cũ vs web mới + còn phải chốt

List:

- Cũ: chỉ `@` (gồm tạm dừng). Mới: thêm `@@` = chỉ tạm dừng.
- Cũ: tìm Title + địa chỉ (API **không** tìm tên khách). Mới: ô tìm còn tên chủ + hướng + ghi chú lô; hangtag Nhà/Đất **không** qua ô tìm.
- Cũ: bấm hàng → chi tiết; nút **GD** / **Sửa** trên dòng. Mới: menu chevron; bấm hàng PC = chọn.
- Cũ: lọc gồm Đang bán / Đã cọc / Đã bán / Tạm dừng. Mới: **chỉ** Mở bán / Tạm dừng.

Quyền đã siết so với cũ: **chỉ Admin** tạo địa chỉ và import kho (cũ: mọi user đăng nhập CRUD địa chỉ).

### Còn phải chốt (trước khi sửa Prisma)

Đã chốt: 4 cấp địa chỉ; nhiều NV / nhiều chủ độc lập trên cùng dòng kho; **`Lodat` trỏ `ProjectLot`**, không copy DT/MT (§0.4). Admin xoá kho khi còn NV đang trỏ = **cấm**.

Tạm hoãn (chưa bàn):

1. List **ADMIN** `/lo-dat`: hiển thị theo cách nào (tách theo NV/luồng hay gộp theo LK12)? — **chờ bàn sau**.

Đăng lô lên web khách — không tự theo Mở bán. STAFF/ADMIN soạn trên `/dashboard/lo-dat` — [`public-content.md`](./public-content.md).

Nhẹ hơn (mặc định nếu không bác): hangtag Nhà/Đất copy = `DAT`; số lô trùng trong kho = cấm; admin được bổ sung lô vào dự án đã import; `DAT_COC`/`DA_BAN` cũ giữ khi copy, list chỉ hiện Mở bán/Tạm dừng. Giá `BIGINT`; hoa hồng chữ.

---

## 12. List `/lo-dat`

Thứ tự mỗi trang: **12.1 máy tính** → **12.2 mobile** → trong từng khối mới chi tiết thành phần. Không ghi «PC: … Mobile: …» trong cùng một mục.

---

### 12.1 Giao diện máy tính

```
┌ Ô tìm ───────────────────────────────────────────────────────┐
├ Bảng: Ảnh · Tiêu đề/Địa chỉ · Phân loại · DT·MT·Hướng · Giá ─┤
│       · Trạng thái · Thao tác                                │
├ Footer đếm ──────────────────────────────────────────────────┤
└ Không rail phải ─────────────────────────────────────────────┘
```

**Bấm nền hàng** → chọn. Không vào chi tiết (chi tiết = menu).

Không nút thêm lô — thêm từ màn khách.

#### 12.1.1 Ô tìm kiếm

Placeholder: `Tìm lô, địa chỉ, khách... (@ cả tạm dừng)`

Gõ là lọc. `@` → viền vàng + badge.

Hangtag **Clear** (`CrmBadge` gray) **ngay sau con trỏ** khi ô không trống. Bấm → xoá hết từ khoá, giữ focus. Chữ tràn → hangtag dính mép phải phần đang thấy.

##### 1. Tìm theo

- Tiêu đề lô (dân: `Lodat.title`; dự án: tiêu đề kho)
- Địa chỉ (chi tiết / xã / huyện / tỉnh)
- Tên chủ hiện tại (`customerHint` ← `fullName` map active)
- Hướng, ghi chú lô (`note`)

**Không** tìm hangtag Nhà/Đất trong ô này — dùng lọc cột **Phân loại**. Copy CRM cũ không có Nhà/Đất nên hầu hết lô là `DAT`.

Substring, không phân biệt hoa thường, **giữ dấu**.

| Ô tìm | Tập lô |
|-------|--------|
| Không `@` + lọc **Mở bán** (mặc định) | Chỉ **Mở bán** |
| Lọc **Tất cả trạng thái** | Mở bán **+** Tạm dừng (`includePaused`) |
| `@` | Mở bán **+** Tạm dừng |
| `@@` | **Chỉ** Tạm dừng |

Lọc cột Trạng thái = Tạm dừng vẫn hiện lô tạm dừng (không cần `@`).

#### 12.1.2 Bộ lọc

Icon cột: ảnh / địa chỉ / phân loại / **DT (khoảng) + hướng** / **giá (khoảng 500tr)** / trạng thái.

Cột **DT · MT · Hướng** — menu lọc 2 nhóm (AND):

| Nhóm | Lựa chọn |
|------|----------|
| Diện tích | Tất cả · 1–100 m² · 100–200 m² · Trên 200 m² |
| Hướng | Tất cả · Đông · Tây · Nam · Bắc · Đông Bắc · Đông Nam · Tây Bắc · Tây Nam · Mặt nước · Khác |

Biên DT: `1–100` = 1≤DT≤100; `100–200` = 100&lt;DT≤200; `Trên 200` = DT&gt;200. Thiếu DT không khớp khoảng.

Cột **Giá bán** — khoảng giá bước **500 triệu** (cùng bộ lọc mobile):

| Lựa chọn | Điều kiện |
|----------|-----------|
| Tất cả giá | — |
| Chưa có giá | thiếu / ≤ 0 |
| Dưới 500 triệu | 0 &lt; giá &lt; 500tr |
| 500 triệu – 1 tỷ | 500tr ≤ giá &lt; 1 tỷ |
| 1 tỷ – 1,5 tỷ | 1 tỷ ≤ giá &lt; 1,5 tỷ |
| 1,5 tỷ – 2 tỷ | 1,5 tỷ ≤ giá &lt; 2 tỷ |
| 2 tỷ – 2,5 tỷ | 2 tỷ ≤ giá &lt; 2,5 tỷ |
| 2,5 tỷ – 3 tỷ | 2,5 tỷ ≤ giá &lt; 3 tỷ |
| Trên 3 tỷ | giá ≥ 3 tỷ |

#### 12.1.3 Item (dòng bảng)

##### 1. Ảnh

Thumbnail. Thiếu = ô xám + icon Lucide `ImageOff` (không chữ `—`). `+N` nếu còn ảnh. **Bấm ảnh** → mở gallery full; không có ảnh → không mở.

##### 2. Tiêu đề / Địa chỉ

Tiêu đề đậm. Dòng phụ = địa chỉ hoặc `—`.

##### 3. Phân loại

Hangtag **Nhà** xanh / **Đất** vàng.

##### 4. DT · MT · Hướng

Dòng 1: diện tích. Dòng 2: `MT … · hướng`. Thiếu = `—`.

##### 5. Giá bán

`crm-money`. Phụ: ghi chú giá; hoa hồng chữ đã lưu (ví dụ `1%` · `Chưa trao đổi`). Thiếu giá = `—`. Thiếu hoa hồng = ẩn dòng.

##### 6. Trạng thái (công tắc)

Bật = Mở bán. Tắt = Tạm dừng → lô biến khỏi list mặc định (gõ `@` để thấy).  
Không phải đã bán / đặt cọc.

##### 7. Thao tác (chevron)

| Mục | Việc hiện tại |
|-----|----------------|
| Xem chi tiết | `/lo-dat/[id]` |
| Giao dịch | `/giao-dich/tao?lodatId=` — không GD mở → form tạo (khoá lô); có GD `DA_COC`/`DA_CONG_CHUNG` → `/giao-dich/[id]/sua` |
| Sửa | `/lo-dat/[id]/sua` |

CRM cũ: nút GD / Sửa / Xóa (admin, lô admin tạo) trên dòng.

**Không** hiện cột Cập nhật trên list (vẫn sort theo `updatedAt` mới → cũ ở API/query).

#### 12.1.4 Footer

Cùng `/khach-hang` §12.1.5:

- Chưa hết trang: `Hiển thị n / Tổng N lô đất` (`n` = số dòng đang có, `N` = `total` API). Đang nối: thêm `— Đang tải thêm…`.
- Đã tải hết: `Tổng N lô đất`.

#### 12.1.5 Cuộn tải thêm + nhớ tìm / lọc / cuộn

**Tải thêm 50 dòng** — helper `useCrmInfiniteList` (`apps/web/src/shared/list-state`), cùng `/khach-hang`:

1. API list nhận `limit` + `offset`. Mỗi lần **đúng 50**. Lần đầu `offset=0`.
2. Sort `updatedAt` mới → cũ (đổi trạng thái / giá map cũng **chạm** `lodat.updatedAt` để lô nổi lên đầu).
3. Cuộn vùng **thân bảng** (không phải window). Còn cách đáy **< 160px** và `n < N` và không đang tải → gọi tiếp `offset = n`, **nối** vào list.
4. Đổi ô tìm / lọc / `@` `@@` / lọc cột → **reset**: `offset=0`, bỏ list cũ, cuộn lên đầu.
5. Lọc cột (ảnh, địa chỉ, DT, hướng, khoảng giá) **chạy trên API** để `total` đúng.

**Nhớ vị trí + lọc khi rời list**

Cùng quy tắc shared list-state (`createListStateStore`, key `crmanhung:lodat-list-state`):

| Lưu | Gồm |
|-----|-----|
| Lọc | Ô tìm (`@`/`@@`), trạng thái, phân loại, ảnh, địa chỉ, DT/hướng, khoảng giá |
| Chọn | `selectedId` |
| Cuộn | `scrollTop` + `anchorId` (dòng/thẻ đầu còn thấy) |

- Storage: **sessionStorage** key `crmanhung:lodat-list-state` (theo tab; đóng tab / đăng xuất → mất).
- Lưu khi: đổi lọc, cuộn, rời list (chi tiết, sửa, Back, F5 cùng tab).
- Vào lại: khôi phục lọc → fetch `offset=0`; nếu `scrollTop` cao hơn list hiện có → **tải thêm 50** đến khi đủ hoặc hết `total`; đặt lại **đúng pixel** `scrollTop` (`anchorId` + `anchorOffset` chỉ dự phòng khi list đã đổi); che list ngắn lúc restore (~4s). Effect «đổi lọc → cuộn đầu» **không** chạy cùng lúc restore (tránh Back từ chi tiết bị kéo về đầu).
- Đổi tìm/lọc → scroll về đầu.
- **Không** nhớ panel (list lô không có rail phải).

Máy tính (thân bảng) và mobile (danh sách thẻ) cùng quy tắc.

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

**Bấm thẻ** → `/lo-dat/[id]`. **Bấm ảnh** trên thẻ → gallery (không điều hướng).

#### 12.2.1 Ô tìm + nút Tìm

Placeholder và quy tắc field / `@` / `@@`: **cùng 12.1.1**.

Nút **Tìm** = đóng bàn phím.

#### 12.2.2 Bộ lọc

Nút **Bộ lọc** + **Tìm** — Trạng thái, khoảng giá (bước 500tr + Chưa có giá). Xoá lọc.

#### 12.2.3 Item (thẻ)

##### 1. Tiêu đề đậm (trên)

##### 2. Ảnh trái

Thumbnail. Hangtag **Mở bán** / **Tạm dừng** trên ảnh. `+N` ảnh thêm.

CRM cũ: bấm ảnh → gallery. Web mới: bấm cả thẻ → chi tiết. Thẻ **không** menu Thao tác; **Giao dịch** / **Sửa** = footer chi tiết.

##### 3. Phải ảnh

Địa chỉ · giá (`crm-money`) · ghi chú giá (nếu có) · hoa hồng chữ đã lưu (nếu có, ví dụ `1%` · `Chưa trao đổi`) · một dòng DT · MT · hướng.

Thiếu ghi chú giá / hoa hồng → **ẩn** dòng (không hiện `—`). Cùng nghĩa cột Giá bán máy tính §12.1.3 mục 5.

#### 12.2.4 Footer

Cùng 12.1.4. Vùng cuộn = danh sách thẻ.

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
│ │ Lịch sử giao dịch (nếu có)   │  │                             │ │
│ │ Nút Giao dịch / Sửa          │  └─────────────────────────────┘ │
│ └──────────────────────────────┘                                  │
└────────────────────────────────────────────────────────────────────┘
```

**Giao dịch** → `/giao-dich/tao?lodatId=` (open-or-create, cùng §12.1.3 mục 7). **Sửa lô đất** → `/lo-dat/[id]/sua`. **Share link** — chỉ khi lô đã publish web; mã cố định theo (NV + lô); URL `https://anhungland.com/mua-ban-nha-dat-huyen-nam-sach/{slug}?share=CODE`. Khách vào bằng mã NV A → liên hệ A trên trang chủ + chi tiết lô **30 ngày** (cùng NV không reset hạn; NV khác ghi đè). Vào thẳng domain hết cookie → hotline công ty. [`public-content.md`](./public-content.md) §18. Lô Tạm dừng / Đã bán — link vẫn mở.

#### 12.3.2 Mobile

Xếp dọc: content → **Lịch sử giao dịch** (nếu có) → **Lô đất cùng xã**; footer dính đáy: **Giao dịch** (cùng open-or-create) · **Sửa lô đất**.

**Không** hiện «← Danh sách lô đất» (Back / vuốt hệ thống). Máy tính vẫn hiện.

**FAB liên hệ chủ đất** góc phải dưới, **nổi trên** footer (chỉ khi có nút cần hiện):

| Nút | Điều kiện | Hành vi |
|-----|-----------|---------|
| Gọi điện | Chủ có ≥1 SĐT | **1 số** → `tel:` thẳng; **≥2 số** → modal chọn số |
| Zalo | Chủ có ≥1 SĐT | Tab `zalo.me/84…` (cùng trang public) |
| Mở Messenger | Chủ có Facebook và **chưa** ẩn | Cùng menu list khách mobile (`messenger.com` / CrmAlert) |

Không chủ / không SĐT và không FB → không hiện cụm FAB. Máy tính **không** FAB.

#### 12.3.3 Gallery ảnh (đã làm)

Full-screen giống CRM cũ: tiêu đề + `N / M` · đóng · prev/next · vuốt · chấm · **Tải về** · **Xoay trái/phải**.

**Máy tính:** nút **Tải về** dưới ảnh; icon mở ảnh gốc (tab mới) góc phải ảnh.

**Điện thoại:** nút **Tải về** nổi giữa-dưới **trên ảnh**; bấm tải trong modal (blob / share sheet). **Không** mở tab/trang mới. Ẩn icon mở ảnh gốc (tránh đụng nhầm). CDN không CORS → web gọi `GET /api/v1/storage/public-image?url=` (JWT, allowlist host).

- Ảnh **lô** (`LodatImage`): xoay **lưu DB** (`rotationDeg`).
- Ảnh **dự án chung** (`AddressImage`): chỉ xem; xoay phiên không lưu (Admin sửa ảnh dự án trên sổ địa chỉ).

#### 12.3.4 Lô cùng xã (đã làm)

CRM cũ `relatedAside`: desktop **cột phải sticky** (`max-height` + scroll thân); mobile dưới content. Danh sách lô **cùng `wardId`**, cùng quyền list (STAFF chỉ luồng mình), trừ lô đang xem. Thẻ bấm → `/lo-dat/[id]`. Không có xã → ẩn khối.

#### 12.3.5 Lịch sử giao dịch (đã làm)

CRM cũ `LodatTransactionHistorySection` — **không** copy god-file. Cột content: desktop dưới ghi chú, trên nút Giao dịch/Sửa; mobile cùng chỗ, **trước** lô cùng xã.

**Ẩn** khi lô không có GD. Có GD → khối «Lịch sử giao dịch»:

Mỗi dòng (mới → cũ):

1. Mã GD đậm (`Transaction.code`) → `/giao-dich/[id]` (chi tiết GD đã có).
2. Hangtag trạng thái: Đã cọc `amber` · Đã công chứng `blue` · Hoàn thành `green` · Đã hủy `red`.
3. Hangtag loại: Của tôi `blue` · Ghi nhận `gray`. Giá `crm-money` nếu > 0.
4. Bán / Mua: tên (`freeTextName`); thiếu = `Chưa có`.
5. Ngày tạo `HH:mm:ss D/M/YYYY`.

GD đang mở (`DA_COC` / `DA_CONG_CHUNG`): viền `#fcd34d`, nền `#fffbeb`. STAFF / ADMIN thấy mọi GD của **lô đang xem** (`lodatId`; quyền đã lọc ở `getById`).

Nút **Giao dịch** giữ open-or-create (`/giao-dich/tao?lodatId=`). **Không làm:** gắn thêm ảnh chat trên form sửa.

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

#### 12.4.4 Đổi chủ

Nút **Đổi chủ** (cùng hàng tiêu đề «Chủ đất & giá bán»). Chỉ hiện khi `canChangeOwner` (NV giữ luồng — **không** Admin).

Bấm → **CrmDialog** form «Đổi chủ đất»:

1. Dòng chủ hiện tại (tên).
2. Ô tìm khách (tên / SĐT) — debounce ~250ms; chỉ khách của NV đang login. **Không** liệt kê chủ đang active.
3. Danh sách: tên đậm + SĐT; bấm một dòng = chọn (viền xanh).
4. Khối **map mới** (điền sẵn từ form/map đang mở, sửa được): trạng thái · giá · ghi chú giá (+ chip) · hoa hồng (+ chip) · ghi chú liên kết chủ.
5. Huỷ · **Đổi chủ** (primary). Chưa chọn khách / trùng chủ hiện tại → không gửi.

**Nghiệp vụ:** đóng map active (`isActive=false`, `endedAt=now`) → tạo map mới (cùng lô, khách mới) với giá / ghi chú giá / hoa hồng / trạng thái / ghi chú liên kết **lấy từ form modal**. Field không gửi → copy từ map cũ. Toast «Đã đổi chủ sang …». Card lịch sử hiện map đã kết thúc + map active.

Không đổi `Lodat.createdByEmployeeId` (luồng NV giữ nguyên).

#### 12.4.5 Lịch sử chủ đất

Mọi map của lô (active trước, cũ sau). Active: badge xanh «Đang active». Đã kết thúc: badge xám + ngày kết thúc. **Không** gắn thêm ảnh chat trên form sửa.

---

### 12.5 Form tạo lô từ khách `/khach-hang/[id]/them-lo-dat`

Học form tạo của CRM cũ (cùng chrome trang sửa §12.4) — **chỉ STAFF**, vào từ menu Thao tác khách «Tạo lô đất». ADMIN → CrmAlert không tạo từ khách. Khách đang mở = **chủ gắn ngay** (map active), không đổi trên form.

#### 12.5.1 Máy tính

Layout 2 cột như §12.4.1: trái form; phải Hình ảnh + Xem nhanh sticky; Huỷ/Tạo dưới form.

```
← Khách hàng · H1 Tạo lô đất · «tên khách»
┌ Loại thửa: (•) Đất dân   ( ) Lô dự án ─────────────────────────┐
│ Đất dân: địa chỉ REGULAR + tiêu đề* + DT/MT/hướng/phân loại/ghi chú
│ Dự án:  địa chỉ PROJECT → chọn lô kho (ẩn/khoá lô NV đã giữ)  │
│ Giá bán: trạng thái (mặc định Mở bán) · giá · chip ghi chú giá │
│          · chip hoa hồng · ghi chú liên kết chủ                │
└ Hình ảnh (chỉ đất dân, tối đa 5) — upload sau khi tạo xong ────┘
```

- Lô **dự án**: chọn địa chỉ dự án → mở **modal «Chọn lô đất trong dự án»** (CRM cũ): ô tìm theo tiêu đề; danh sách lô = thumb ảnh dự án + badge (Chọn được / Bạn đang giữ) + tên đậm + DT·MT·hướng·ghi chú; nút «Huỷ chọn dự án» bỏ luôn địa chỉ. Không nhập specs; không thêm ảnh lô (ảnh dự án chung).
- Lô **dân**: bắt buộc tiêu đề + địa chỉ REGULAR; specs như trang sửa; chip hướng/ghi chú giá/hoa hồng §12.4.3.
- Submit: `POST /lodats` (tạo Lodat + map chủ active) → upload ảnh chờ (nếu có) → toast «Đã tạo lô đất» → `/lo-dat/[id]`.
- 1 luồng active / NV / lô kho — API chặn, picker cũng khoá («Bạn đang giữ»).

#### 12.5.2 Mobile

Xếp dọc như §12.4.2 (một cột; Huỷ/Tạo cuối form; nút «Thêm ảnh» thay paste-zone).

#### 12.5.3 API

| Endpoint | Việc |
|----------|------|
| `GET /lodats/project-lots?addressId=` | Kho lô của địa chỉ PROJECT + cờ `takenByMe` |
| `POST /lodats` | Tạo lô dân (addressId REGULAR + specs) hoặc lô dự án (projectLotId) + map chủ; chặn ADMIN; khách phải thuộc NV |
| `POST /lodats/:id/change-owner` | Đổi chủ: đóng map active, mở map mới. Body `{ customerId, status?, priceVnd?, priceNote?, brokerFeeNote?, mapNote? }`. **Chỉ STAFF** giữ luồng + khách của mình. ADMIN → 403. |

---

## 13. Lịch làm — thứ tự DB (STAFF trước)

**Có: phải có sổ địa chỉ trước lô.** Prisma + copy kho/map/ảnh + API list `/lo-dat` STAFF **đã lên anhungland.com**. Còn: Admin import kho, list ADMIN.

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
| **11** | API + nối UI **list `/lo-dat` STAFF** | Màn hình NV | **Done** — `GET/PATCH /api/v1/lodats`; lọc `createdBy`; `@` / `@@`; công tắc Mở bán/Tạm dừng |
| **12** | Tạo lô từ khách: dân (tạo Lodat) / dự án (chọn kho → tạo Lodat trỏ) | Không nút thêm trên `/lo-dat` | **Done** — §12.5; `POST /lodats` + picker kho |
| **13** | Chi tiết `/lo-dat/[id]` (đọc) + đổi chủ / ảnh upload | Đã chốt quyền | Đọc + gallery + cùng xã + form sửa + **đổi chủ** + **lịch sử GD** (GET kèm detail). Nút Giao dịch = open-or-create |
| **14** | List UI **ADMIN** `/lo-dat` | Bạn bảo làm sau | Không làm trong lịch STAFF |

Copy data: script **chỉ đọc** SQLite, idempotent, map id trong schema `migrate` — như khách. Skill agent: **`migrate-legacy-data`** (preflight FK, giữ luồng kha/buinam, reshape PROJECT → `ProjectLot`).
