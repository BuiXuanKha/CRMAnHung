# Domain: Transactions (Giao dịch)

- **Slug:** `transactions`
- **Status:** Ready for API — Prisma + contract + Nest CRUD + UI **nối API** (staging login thật, không mock). List: `limit`/`offset` + COUNT (cuộn tải 50). Copy CRM cũ xong (2 GD **buinam**). STAFF **kha**: list trống đến khi tạo GD từ lô.
- **Nguồn:** màn [`/giao-dich`](https://anhungland.com/giao-dich) (web mới) + CRM cũ `/giao-dich` (SQLite `tblTransaction*`, 2026-08-25)
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.6 + §4.5
- **Contract:** `packages/shared/src/transactions.ts`
- **Prisma:** `Transaction`, `TransactionParty`, `TransactionSnapshot` (+ ảnh), `TransactionAttachment`

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần.

---

## 1. Mục đích

Theo dõi deal mua bán lô: loại, các bên, giá, hoa hồng, cọc → công chứng → hoàn thành, hẹn CC.

## 2. Actors

| Actor | List | Không |
|-------|------|--------|
| STAFF | GD mình tạo (`createdByEmployeeId`); tạo từ lô / khách | Sửa / xoá GD NV khác |
| ADMIN | Tất cả; lọc theo NV | Tạo GD (NV tạo từ lô mình) |

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

## 4. Use cases

1. **Tạo GD từ lô** — nếu lô đã có GD mở (`DA_COC` / `DA_CONG_CHUNG`) → mở sửa GD đó (`OPEN_TRANSACTION_EXISTS`). Không thì tạo mới, status luôn **Đã cọc**. Snapshot lô + map đóng băng lúc tạo.
2. **List `/giao-dich`** — tìm / lọc; STAFF chỉ GD mình; ADMIN tất cả.
3. **Sửa** — đổi status, giá, thuế, hoa hồng, hẹn CC, bên, ghi chú. Hủy bắt buộc `cancelReason`.
4. **Xóa cứng** — xóa hàng + nếu GD đang mở (`DA_COC` / `DA_CONG_CHUNG`) thì đưa map về **Mở bán**.
5. **Lịch sử trên chi tiết lô** — list GD của lô (lodats.md §12.3.5, đã làm).

Tạo GD: **OWN** bắt buộc ngày hẹn CC; **RECORD** hẹn CC tuỳ chọn, hoa hồng = 0, **không** vào thẻ doanh thu. Tạo từ lô: điền sẵn người bán = chủ map active (tên + `customerId`); lô chưa có chủ → không lưu.

## 5. Quan hệ dữ liệu

```
Lodat 1 ── n Transaction
LodatCustomerMap 1 ── n Transaction     (map lúc tạo deal; đổi chủ sau không đổi FK này)
Transaction 1 ── n TransactionParty     (SELLER | BUYER)
Transaction 1 ── 1 TransactionSnapshot  (đóng băng tiêu đề / ĐC / DT·MT / giá map)
  └── n TransactionSnapshotImage        (objectKey **copy riêng** lúc tạo GD — BUG-060; không share gallery lô)
Transaction 1 ── n TransactionAttachment (R2 objectKey, kind HOP_DONG|SO_DO|KHAC)
```

| Field chính | Kiểu | Ghi chú |
|-------------|------|---------|
| `code` | unique | `GD-YYYY-NNNN` — API cấp, không nhập tay |
| `lodatId` + `lodatCustomerMapId` | cả hai bắt buộc | Giống cũ. `lodatId` = `Lodat` **luồng NV** (PROJECT: không dùng ID kho) |
| `type` / `status` | string enum | mục 3 |
| `salePriceVnd` `taxPriceVnd` `commissionVnd` | **BigInt** | Không dùng `Int` (stub cũ `amountVnd`) |
| `notaryAppointmentAt` | DateTime? | OWN bắt buộc lúc tạo |
| `cancelReason` | text? | bắt buộc khi `HUY` |
| `createdByEmployeeId` | FK User | ownership list STAFF |
| `completedAt` | DateTime? | khi chuyển `HOAN_TAT` |

**Bên:** `customerId` tuỳ chọn (khách CRM) + `freeTextName` **luôn ghi** (tên lúc tạo). Xoá khách → `customerId` SET NULL, tên còn.

**1 GD mở / lô:** unique index SQL `Transaction_lodatId_open_uidx` (`DA_COC` \| `DA_CONG_CHUNG`). Cũ chỉ chặn ở app.

**Xoá lô / map:** `Restrict` — còn GD thì không xoá thửa/map. Party/snapshot/ảnh/đính kèm cascade theo GD.

**Đổi chủ sau GD:** map mới không thay `lodatCustomerMapId` của GD cũ.

Ownership: theo `createdByEmployeeId` (người **tạo GD**), không theo `Lodat.createdByEmployeeId`.

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| List | `/giao-dich` | Mock §12 — đã có |
| Chi tiết | `/giao-dich/[id]` | Đọc: mã, loại, TT, lô, bên, giá, hẹn CC, ghi chú, snapshot |
| Tạo | `/giao-dich/tao` | `?lodatId=` khoá lô; trùng GD mở → sửa GD đó |
| Sửa | `/giao-dich/[id]/sua` | Cùng form; thêm trạng thái + lý do hủy |

Không nút thêm trên list. Nút **Giao dịch** trên `/lo-dat` (menu PC) và chi tiết (desktop + footer mobile) = open-or-create (`?lodatId=`). **Admin không tạo** — xem/sửa GD có sẵn trên `/giao-dich`.

## 7. Contract / API dự kiến

Prefix `/api/v1`. Zod: `packages/shared/src/transactions.ts`. Nest: `apps/api/src/modules/transactions/`.

| Method | Path | Ai | Ghi chú |
|--------|------|----|---------|
| GET | `/transactions` | STAFF (mình) / ADMIN (tất cả) | `keyword` `type` `status` `createdByEmployeeId` |
| GET | `/transactions/:id` | owner / ADMIN | `TransactionDetail` |
| POST | `/transactions` | owner lô (**STAFF**). ADMIN → 403 | `lodatId` hoặc `lodatCustomerMapId`; trùng mở → `OPEN_TRANSACTION_EXISTS` |
| PATCH | `/transactions/:id` | owner / ADMIN | `UpdateTransactionInput`; `HUY` cần `cancelReason` |
| DELETE | `/transactions/:id` | owner / ADMIN | xóa cứng; GD mở → map `DANG_BAN` |
| GET | `/transactions/lodat/:lodatId/open` | owner lô / ADMIN | `{ id }` hoặc `id: null` |

Tạo: status = `DA_COC`; sinh `code`; copy snapshot từ lô + map active. RECORD: `commissionVnd = 0`.

## 8. Dữ liệu

List `/giao-dich` gọi API. Không RAM mock / user nháp.

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Chi tiết cột: [`MIGRATION.md`](../MIGRATION.md) bước 11. Tóm tắt:

| Cũ | Mới |
|----|-----|
| `tblTransaction` | `Transaction` (`code`, hai FK lô+map, BigInt tiền, `createdByEmployeeId`) |
| `tblTransactionParty` | `TransactionParty` (`role`, `customerId`, `freeTextName`, `sortOrder`) |
| `tblTransactionSnapshot` | `TransactionSnapshot` |
| `tblTransactionSnapshotImage` | `TransactionSnapshotImage.objectKey` (R2; không path disk) |
| `tblTransactionAttachment` | `TransactionAttachment.objectKey` + `kind` |

**PROJECT:** `lodatId` mới = `Lodat` của **map** (`lodat_customer_map`), không map `tblLodats.ID` kho.

Script copy: `pnpm transactions:migrate-legacy`. **Xong staging (2026-08-25)** — 2/2 GD `OWN`+`HOAN_TAT` (`GD-2026-0002` / `GD-2026-0003`, **buinam**), 2 snapshot, 9 ảnh, 0 đính kèm. Snapshot cũ PK = `TransactionId`, tiêu đề `LodatTitle`.

## 11. CRM cũ vs web mới

- Cũ: tìm Code + tiêu đề lô snapshot + ghi chú (API **không** tìm tên bên). Mới: mock tìm thêm người bán / mua, nhãn loại / trạng thái.
- Cũ ADMIN: lọc nhân viên. Mới: chưa mock cột NV — query `createdByEmployeeId` đã có trên contract.
- Cũ: bấm hàng → sửa. Mới list: hàng PC = chọn; chi tiết = menu / mobile bấm thẻ.
- Không `@` / `@@`.
- Schema mới: BigInt; snapshot + 1 GD mở / lô chặn ở DB; đính kèm R2.

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
| Xem chi tiết | `/giao-dich/[id]` — menu portal `document.body` (cùng lô đất), không để overflow bảng cắt |
| Sửa | `/giao-dich/[id]/sua` |
| Xóa | Đỏ → confirm → xóa cứng. GD đang mở → map về Mở bán |

#### 12.1.5 Footer + cuộn tải thêm + nhớ vị trí

`Hiển thị n / Tổng M giao dịch` (`n` = số dòng đang có, `M` = `total` API). Đang nối: thêm `— Đang tải thêm…`.

**Tải thêm 50 dòng** — helper `useCrmInfiniteList` (cùng `/khach-hang` / `/lo-dat`):

1. `GET /transactions` nhận `limit` (mặc định 50, tối đa 200) + `offset`. `total` = COUNT cùng filter tìm/loại/trạng thái.
2. Cuộn thân bảng/thẻ gần đáy (~160px) → nối trang; list ngắn hơn khung → tự nạp thêm.
3. Đổi ô tìm / loại / trạng thái / lọc cột → reset `offset=0`, cuộn đầu.
4. Thẻ doanh thu / hoa hồng = aggregate OWN + HOAN_TAT trên **cùng filter API** (không chỉ trang đang xem).

**Nhớ vị trí + lọc khi rời list** — cùng helper `list-state` (key `crmanhung:transaction-list-state`): ô tìm, loại, trạng thái, lọc cột, `selectedId`, `scrollTop` + `anchorId`. Dòng/thẻ có `data-list-row-id`. Đổi lọc/tìm → cuộn về 0. Vào lại (Back / menu / F5 cùng tab) khôi phục; nếu scroll cao hơn list hiện có → tải thêm đến khi đủ hoặc hết `total`; che list lúc restore. Đăng xuất xóa.

#### 12.1.6 Trống

Không lọc / ô tìm: «Chưa có giao dịch.» + gợi ý tạo từ nút **Giao dịch** trên lô → link `/lo-dat`. Đang lọc: «Không có giao dịch phù hợp.»

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

Cùng câu `Hiển thị N / Tổng M giao dịch`. Trống: cùng 12.1.6.

---

### 12.3 Chi tiết `/giao-dich/[id]`

#### 12.3.1 Giao diện máy tính

```
┌ ← Quản lý giao dịch · Sửa ───────────────────────────────────┐
├ Mã GD + hangtag Loại + hangtag Trạng thái                    │
├ Thẻ: lô (snapshot) · giá · thuế · HH · hẹn CC · ghi chú      │
├ Thẻ: người bán / người mua                                   │
└ Không rail ──────────────────────────────────────────────────┘
```

##### 1. Quay lại

Link `/giao-dich`. Giữ ô tìm / lọc list (list-state).

##### 2. Sửa

Nút primary → `/giao-dich/[id]/sua`.

##### 3. Đầu trang

Mã GD đậm. Hangtag loại + trạng thái. Tiêu đề lô (snapshot, thiếu thì `lodatTitle` live).

##### 4. Số liệu

Giá bán, thuế, hoa hồng (`RECORD` = `—`), hẹn CC (kèm đếm ngược 12.1.4 mục 9), ghi chú, ngày tạo. Thiếu = `—`.

##### 5. Các bên

Người bán / người mua: mỗi tên một dòng. Rỗng = `—`.

##### 6. Snapshot lô

Địa chỉ, DT · MT · hướng, giá map lúc tạo. Thiếu = ẩn dòng. Ảnh snapshot: thumbnail; bấm → tab mới (`url` CDN). Không ảnh = ẩn lưới.

#### 12.3.2 Giao diện mobile

Cùng 12.3.1. Một cột. Nút **Sửa** full-width đáy nội dung. Input không — chỉ đọc. Ô 16px không áp (không form).

---

### 12.4 Form `/giao-dich/tao` và `/giao-dich/[id]/sua`

Tạo: status luôn **Đã cọc**; không chọn trạng thái. OWN bắt buộc hẹn CC. RECORD: hoa hồng khoá = 0. Trùng GD mở cùng lô → vào sửa GD đó.

#### 12.4.1 Giao diện máy tính

```
┌ ← Quay lại · tiêu đề Tạo / Sửa mã GD ────────────────────────┐
├ Thẻ loại · lô (picker khi tạo) · trạng thái (chỉ sửa)        │
├ Giá · thuế · HH · hẹn CC                                     │
├ Người bán · Người mua (ô tìm → hangtag)                      │
├ Ghi chú · lý do hủy (khi HUY)                                │
└ Huỷ · Lưu ───────────────────────────────────────────────────┘
```

##### 1. Quay lại

Tạo: `/giao-dich` hoặc lô nếu `?lodatId=`. Sửa: chi tiết GD.

##### 2. Loại

Của tôi / Ghi nhận. **Tạo** đổi được. **Sửa** khoá.

##### 3. Lô đất

Tạo: chọn lô (khoá nếu có `?lodatId=`). Sửa: chỉ đọc tiêu đề.

##### 4. Trạng thái

Chỉ trang sửa. Hủy → hiện ô lý do (bắt buộc).

##### 5. Hẹn CC

`input type=date`. OWN tạo: bắt buộc.

##### 6. Giá / thuế / hoa hồng

Số VND, format nghìn. RECORD: ô HH disabled.

##### 7. Người bán / mua

Mỗi bên ≥ 1 hangtag lúc Lưu. **Không** nút «+ Thêm người…». Ô tìm: gõ tên/SĐT → danh sách avatar + tên + SĐT. Chỉ chọn khách trong list → hangtag `CrmBadge` `blue`; × xoá. Gõ tiếp để thêm người. **Không** tạo hangtag từ tên vừa gõ khi không khớp CRM. **Tạo:** điền sẵn hangtag người bán = chủ lô (`owner`); đổi lô thì thay bên bán. Lô chưa có chủ → báo, khoá Lưu.

##### 8. Ghi chú

Textarea.

##### 9. Lưu / Huỷ

Huỷ về chi tiết (sửa) hoặc list (tạo). Lưu mock → chi tiết. Lỗi Zod → `CrmAlertDialog`.

#### 12.4.2 Giao diện mobile

Cùng field 12.4.1. Một cột. `input`/`select`/`textarea` **16px**. Nút Lưu/Huỷ full-width cuối form (không đè nội dung).

---

*Hành vi list bám §12. Visual §4.3.6. Form token giống trang sửa lô. Không copy god-file.*
