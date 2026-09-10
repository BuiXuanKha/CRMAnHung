# Domain: Title services (Dịch vụ sổ đỏ)

- **Slug:** `title-services`
- **Status:** Ready for API — list + tạo từ khách + script copy; ADMIN lọc NV; audit xem file (ghi DB, chưa UI nhật ký).
- **Nguồn:** màn [`/dich-vu-so-do`](https://anhungland.com/dich-vu-so-do) (web mới) + CRM cũ `/dich-vu-so-do` (API `/api/title-services`, SQLite `tblTitleService*`)
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.7 + §4.5
- **Contract:** `packages/shared/src/title-services.ts`

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần.

---

## 1. Mục đích

Theo dõi hồ sơ làm sổ đỏ: nhu cầu, tiến độ, thu/chi, tài liệu, số ngày đang làm.

## 2. Actors

| Actor | List | Không |
|-------|------|--------|
| STAFF | Hồ sơ **mình tạo** (`createdByEmployeeId`). Tạo từ khách thuộc NV | Sửa / xóa hồ sơ NV khác; tạo cho khách NV khác |
| ADMIN | Tất cả; lọc `employeeId` | Tạo hồ sơ (NV tạo từ khách của mình) |

Tạo hồ sơ từ menu khách «Dịch vụ sổ đỏ». **Không** nút Thêm trên list. Tạo luôn `DANG_LAM`.

## 3. Khái niệm

| Trạng thái | Enum | Hangtag | List |
|------------|------|---------|------|
| Đang làm | `DANG_LAM` | green | Đầu list (ghim trong nhóm) |
| Tạm dừng | `TAM_DUNG` | gray | **Cuối list**, chữ/nền nhạt |
| Hoàn thành | `HOAN_THANH` | blue | **Cuối list**, chữ/nền nhạt |

**Không xoá hồ sơ** (không menu Xóa, không soft-delete). `HUY` legacy = **Tạm dừng** (UI hiện «Tạm dừng»; lọc Tạm dừng gồm cả `HUY`; API `PATCH` gửi `HUY` → lưu `TAM_DUNG`).

**Số ngày:** từ `startedAt` đến nay; khi **Tạm dừng / Hoàn thành** (và `HUY` cũ) dừng tại `completedAt`. **Khôi phục** → `DANG_LAM` + xóa `completedAt`. `0` → «Hôm nay».

Tiến độ gợi ý: Bàn giá, Thu thập giấy tờ, Đo đạc, Nộp hồ sơ, Bổ sung, Làm việc cơ quan, Nhận kết quả, Bàn giao, Khác — API cũ **không chặn** `StepType` ngoài list. Thu/Chi. Tài liệu: Sổ đỏ / CCCD / Khác (hoặc chuỗi tự nhập).

## 4. Use cases (CRM cũ)

1. **Tạo từ khách** — `POST` STAFF; khách phải thuộc NV và không ẩn. ADMIN → 403. Mã `SD-YYYY-NNNN`. Status `DANG_LAM`.
2. **List** — STAFF chỉ hồ sơ mình; ADMIN tất cả + `?employeeId=`. Tìm: mã + tên + SĐT. Sort: **Đang làm trước** → Tạm dừng/Hoàn thành sau; trong nhóm: ghim → `pinnedAt` → `updatedAt`. `limit` mặc định 50, tối đa 200; `offset` từ 0; `total` = COUNT.
3. **Sửa** — trạng thái (`DANG_LAM` / `TAM_DUNG` / `HOAN_THANH`), phí thỏa thuận, nhu cầu, ghi chú, ngày dự kiến xong. Tạm dừng / Hoàn thành ghi `completedAt`; về Đang làm thì xóa `completedAt`.
4. **Ghim** — `PATCH /:id/pin` `{ pinned }`.
5. **Tiến độ / thu-chi / file** — thêm/xóa trên hồ sơ mình. File tối đa 12 MB, disk `/img/title-services/`.
6. **Không xóa hồ sơ** — dùng Tạm dừng / Hoàn thành; menu **Khôi phục** khi đang Tạm dừng hoặc Hoàn thành.

## 5. Quan hệ dữ liệu

```
Customer (Person) 1 ── n TitleService     (PersonId NOT NULL; createdBy = NV tạo)
TitleService 1 ── n Progress / Money / Attachment
```

Ownership list = `CreatedByEmployeeId`, không phải `Customer.employeeId` (trùng lúc tạo vì khách phải của NV).

## 6. UI

| Màn | Route mới | Cũ |
|-----|-----------|-----|
| List + panel | `/dich-vu-so-do` | `/dich-vu-so-do` |
| Tạo từ khách | `/khach-hang/[id]/dich-vu-so-do` | menu khách «Dịch vụ sổ đỏ» |
| Chi tiết | `/dich-vu-so-do/[id]` | panel trên list; `GET /api/title-services/:id` |

§12 = list đã chốt. API cũ: `GET/POST /api/title-services`.

## 7. Contract / API

`packages/shared/src/title-services.ts` + Prisma `TitleService*` khớp CRM cũ: `code`, `customerId`, `createdByEmployeeId`, `agreedFeeVnd` BigInt, ghim, `startedAt` / `expectedDoneAt` / `completedAt`, tiến độ `stepType`, tiền `kind` THU|CHI, file `objectKey` **private** (contract **không** trả URL public).

Prefix `/api/v1/title-services` — list / get / tạo / sửa / ghim + tiến độ / thu-chi + file private (multipart, signed GET, xóa object). **Không** `DELETE` hồ sơ.

## 8. Dữ liệu

List `/dich-vu-so-do` gọi API. Không RAM mock / user nháp. List kha trống cho đến khi copy `SD-2026-0001`.

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Script copy: `pnpm title-services:migrate-legacy` — chi tiết [`MIGRATION.md`](../MIGRATION.md) bước 12. Live (2026-08-26): **1** hồ sơ `SD-2026-0001` (`DANG_LAM`, **kha**, khách `PersonId` 1561), 2 tiến độ, 3 khoản tiền (thu 13tr / chi 2tr), **0** file. Thư mục `img/title-services` trống. **Chưa chạy staging** — chờ merge + workflow/VPS.

| Cũ | Mới (đã chốt Prisma) |
|----|----------------------|
| `tblTitleService` | `TitleService` (`code`, `customerId`, `createdByEmployeeId`, BigInt phí, ghim, `startedAt`…) |
| `tblTitleServiceProgress` | `TitleServiceProgress` (`stepType`, `happenedAt`, `createdByEmployeeId`) |
| `tblTitleServiceMoney` | `TitleServiceMoney` (`kind` THU/CHI, `title`, `amountVnd` BigInt) |
| `tblTitleServiceAttachment` | `TitleServiceAttachment` (`objectKey` private R2, `kind`, `fileName`) |

## 11. CRM cũ vs web mới

- Tìm: mã + tên + SĐT (không tìm nhu cầu / ghi chú).
- Cũ ADMIN: `?employeeId=`. Mới: ADMIN lọc `createdByEmployeeId` trên list (select NV). STAFF không thấy select.
- Không `@` / `@@`.
- Web mới: **không xoá hồ sơ**; Tạm dừng / Hoàn thành + Khôi phục.

---

## 12. List `/dich-vu-so-do`

Thứ tự mỗi trang: **12.1 máy tính** → **12.2 mobile** → trong từng khối mới chi tiết thành phần. Không ghi «PC: … Mobile: …» trong cùng một mục.

---

### 12.1 Giao diện máy tính

```
┌ 3 thẻ: Số hồ sơ · Tổng thu · Tổng chi ───────────────────────┐
├ Ô tìm ───────────────────────────────────────────────────────┤
├ Bảng: # · Tên khách · Nhu cầu · Lịch sử · Giá/Thu/Chi        │
│       · Tài liệu · Số ngày · Thao tác                        │
├ Footer đếm ──────────────────────────────────────────────────┤
└ Panel phải: Chi tiết hồ sơ (một tab) ────────────────────────┘
```

Không nút thêm hồ sơ — thêm từ màn khách.

**Bấm nền hàng** → chọn + **mở panel** Chi tiết hồ sơ.

Sort: **Đang làm** trước (ghim trong nhóm), rồi `updatedAt` mới. **Tạm dừng / Hoàn thành** (và `HUY` cũ) xếp **cuối**, opacity thấp / chữ nhạt.

Ghim: nền vàng `#fef9c3` (chỉ nổi trong nhóm Đang làm). Đang chọn: `#eff6ff`.

#### 12.1.0 Thẻ tổng hợp (giống `/giao-dich`)

Ba thẻ trên ô tìm / cạnh layout chính (máy tính + mobile):

| Thẻ | Nội dung |
|-----|----------|
| Số hồ sơ sổ đỏ | `total` API cùng filter tìm / trạng thái / NV |
| Tổng thu | Sum `TitleServiceMoney` kind `THU` trên cùng filter |
| Tổng chi | Sum kind `CHI` trên cùng filter |

Đổi ô tìm / trạng thái / NV → 3 thẻ đổi theo tập API (không chỉ trang đang xem). Lọc cột client (nhu cầu/tiến độ…) không đổi thẻ. Tiền `crm-money`; mobile rút gọn (triệu / tỷ). Hint desktop: «Theo bộ lọc hiện tại».

#### 12.1.1 Ô tìm kiếm

Placeholder: `Tìm mã hồ sơ, tên khách, SĐT...`

Gõ là lọc. Không `@`. (`TAM_DUNG` vẫn hiện trên list — khác `/lo-dat`.)

Hangtag **Clear** (`CrmBadge` gray) **ngay sau con trỏ** khi ô không trống. Bấm → xoá hết từ khoá, giữ focus. Chữ tràn → hangtag dính mép phải phần đang thấy.

##### 1. Tìm theo (web mới)

- Mã hồ sơ (`SD-…`)
- Tên khách
- SĐT
- Nhu cầu, ghi chú, nhãn trạng thái

#### 12.1.2 Bộ lọc

Icon cột — trạng thái (cột Tên khách), nhu cầu / tiến độ / giá / tài liệu có-chưa.

ADMIN: select **nhân viên tạo** cạnh ô tìm (`?createdByEmployeeId=`). STAFF không thấy.

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
| Xem chi tiết | `/dich-vu-so-do/[id]`. Máy tính: bấm dòng vẫn mở panel. Menu portal `document.body` |
| Thêm công việc | Modal: nội dung, hạn (mặc định ngày mai). Gắn sổ đỏ — «của khách [tên]». **Đồng thời** ghi tiến độ bước **Công việc** (`CONG_VIEC`), ghi chú = nội dung việc. Việc còn mở → hangtag **Đang làm**; khi **Hoàn thành** trên `/cong-viec` → hangtag **Đã hoàn thành** |
| Ghim / Bỏ ghim | `isPinned` |
| Thêm tiến độ | Dialog: chọn bước (gồm **Công việc**) + ghi chú + ngày |
| Nhập thu | Dialog |
| Nhập chi phí | Dialog |
| Thêm tài liệu | Dialog: loại + chọn file (R2 private). Mobile không tràn mép |
| Sửa thông tin | Dialog (trạng thái Đang làm / Tạm dừng / Hoàn thành, giá, nhu cầu) |
| **Khôi phục** | Chỉ khi Tạm dừng hoặc Hoàn thành → `DANG_LAM` (xóa `completedAt`) |
| ~~Xóa hồ sơ~~ | **Bỏ** — không xoá cứng / mềm |

**Tạm dừng / Hoàn thành:** menu Thao tác **chỉ** **Xem chi tiết** + **Khôi phục**. Chuyển sang Tạm dừng/Hoàn thành → **tự bỏ ghim** nếu đang ghim. Không ghim hồ sơ đang muted.

#### 12.1.4 Footer + cuộn tải thêm

`Hiển thị n / Tổng M hồ sơ sổ đỏ` (`n` = số dòng đang có, `M` = `total` API). Đang nối: thêm `— Đang tải thêm…`.

**Tải thêm 50 dòng** — `useCrmInfiniteList` (cùng khách/lô):

1. `GET /title-services` nhận `limit` (mặc định 50, tối đa 200) + `offset`. `total` = COUNT cùng filter tìm/trạng thái/NV.
2. Cuộn thân bảng/thẻ gần đáy (~160px) → nối trang; list ngắn hơn khung → tự nạp thêm.
3. Đổi ô tìm / trạng thái / NV / lọc cột → reset `offset=0`, cuộn đầu.

#### 12.1.5 Panel phải — Chi tiết hồ sơ

**Một** tab (không 3 thanh như khách hàng).

- Thu hẹp: thanh dọc, chữ xoay 90°, nhãn **Chi tiết hồ sơ**.
- Mở: tên + mã · SĐT; lưới Trạng thái / Giá / Đã thu / Đã chi; hộp Nhu cầu; nút `+ Tiến độ` `+ Tài liệu` `+ Thu` `+ Chi`; timeline tiến độ, file, thu/chi.
- Timeline: bước **Công việc** gắn việc còn mở — hangtag **Đang làm** (`CrmBadge` amber); việc đã xong — hangtag **Đã hoàn thành** (`CrmBadge` green) cạnh tên bước (**không** gạch chữ ghi chú).
- File tài liệu: hangtag loại **Sổ đỏ** / **CCCD** / **Giấy tờ khác** trên đầu mỗi file; tên file dòng dưới (bấm → mở); ngày đính kèm cạnh hangtag.
- Chưa chọn: «Chọn một hồ sơ…»

#### 12.1.6 Nhớ tìm / lọc / cuộn

Cùng quy tắc shared list-state (`createListStateStore`, key `crmanhung:title-service-list-state`):

| Lưu | Gồm |
|-----|-----|
| Lọc | Ô tìm, trạng thái, nhân viên tạo (ADMIN), nhu cầu / tiến độ / giá / tài liệu |
| Chọn | `selectedId` |
| Cuộn | `scrollTop` + `anchorId` (dòng/thẻ đầu còn thấy) |

- Storage: **sessionStorage** theo tab; đóng tab / đăng xuất → mất.
- Lưu khi: đổi lọc, cuộn, rời list (chi tiết `[id]`, menu, Back, F5 cùng tab).
- Vào lại: khôi phục lọc rồi fetch; đặt lại scroll; che list ngắn lúc restore (~4s).
- Đổi tìm/lọc → scroll về đầu.
- **Không** nhớ panel Chi tiết hồ sơ (mở/thu).
- Tạo từ khách: ghi list-state ô tìm/lọc trống + `selectedId` hồ sơ mới, rồi `/dich-vu-so-do?id=` — hồ sơ mới **không** bị lọc cũ che.

Máy tính (thân bảng) và mobile (danh sách thẻ) cùng quy tắc.

---

### 12.2 Giao diện mobile

```
┌ 3 thẻ: Số hồ sơ · Tổng thu · Tổng chi ───────────────────────┐
├ Ô tìm ───────────────────────────────────────────────────────┤
├ [Bộ lọc] [Tìm] ──────────────────────────────────────────────┤
├ Thẻ xếp dọc ─────────────────────────────────────────────────┤
├ Footer đếm ──────────────────────────────────────────────────┤
└ Không bảng, không panel, không nút thêm ─────────────────────┘
```

**Bấm thẻ** (không phải menu) → `/dich-vu-so-do/[id]`. Chevron = menu.

#### 12.2.1 Ô tìm + nút Tìm

Placeholder và quy tắc field: **cùng 12.1.1**. Nút **Tìm** = đóng bàn phím.

#### 12.2.2 Bộ lọc

Nút **Bộ lọc** + **Tìm** — Trạng thái. ADMIN thêm select nhân viên. Xoá lọc.

#### 12.2.3 Item (thẻ)

##### 1. Đầu

Sao nếu ghim + tên đậm + hangtag + chevron (cùng menu 12.1.3 mục 8).

##### 2. Meta

Mã · số ngày · SĐT.

##### 3. Thân

Nhu cầu (2 dòng) · Giá / Thu / Chi · bước tiến độ · `N file` / Chưa có.

Ghim: nền vàng + viền trái `#ca8a04`.

#### 12.2.4 Footer + cuộn

Cùng 12.1.4 (`Hiển thị n / Tổng M` + tải thêm 50). Vùng cuộn = danh sách thẻ. Nhớ tìm / lọc / cuộn: **cùng 12.1.6**.

---

### 12.3 Chi tiết `/dich-vu-so-do/[id]`

Cùng nội dung panel: tên + mã · SĐT; Trạng thái / Giá / Thu / Chi; nhu cầu; `+ Tiến độ` `+ Tài liệu` `+ Thu` `+ Chi`; timeline, file, thu/chi. Quay lại `/dich-vu-so-do` (giữ list-state).

Detail API thêm `phones` + `facebook` + `customerIsHidden` (cùng shape liên hệ khách) để FAB gọi / Zalo / Messenger — list vẫn chỉ `primaryPhone`.

#### 12.3.1 Máy tính

Một cột, max ~720px. Cùng field panel. **Không** FAB. Nút quay lại «← Dịch vụ sổ đỏ» trên cùng.

#### 12.3.2 Mobile

Cùng 12.3.1. Ô/nút 16px. Nút nhanh 2×2 (Tiến độ · Tài liệu · Thu · Chi).

**Không** hiện «← Dịch vụ sổ đỏ» (Back / vuốt hệ thống). Máy tính vẫn hiện.

**FAB** góc phải dưới (máy tính **không** FAB) — cùng kiểu chi tiết khách / lô:

| Nút | Điều kiện | Hành vi |
|-----|-----------|---------|
| «⋯» Thêm thao tác | Luôn hiện | Popover + Lucide: **Thêm công việc** · **Ghim / Bỏ ghim** · **Sửa thông tin**. Hồ sơ Tạm dừng / Hoàn thành: chỉ **Khôi phục** |
| Gọi điện | Khách có ≥1 SĐT | **1 số** → `tel:` thẳng; **≥2 số** → modal chọn số |
| Zalo | Có ≥1 SĐT | Tab `zalo.me/84…` (cùng trang public) |
| Mở Messenger | Có Facebook và khách **chưa** ẩn | Cùng menu list khách mobile (`messenger.com` / CrmAlert) |

Không SĐT / không FB → vẫn hiện «⋯»; ẩn Gọi·Zalo·Messenger. Nút nhanh 2×2 giữ nguyên (không đưa vào FAB).

---

### 12.4 Tạo từ khách `/khach-hang/[id]/dich-vu-so-do`

Không nút Thêm trên list. Menu khách «Dịch vụ sổ đỏ» → trang này. **Admin không tạo** — NV tạo từ khách của mình. Lưu xong → ghi list-state (ô tìm/lọc trống, chọn hồ sơ mới) → `/dich-vu-so-do?id=`. Quay lại / Hủy → `/khach-hang`.

#### 12.4.1 Máy tính

Form một cột: khách chỉ đọc + trường hồ sơ + Hủy / Lưu.

#### 12.4.2 Mobile

Cùng form. Nút Hủy / Lưu đáy.

#### 12.4.3 Thành phần

1. Tên khách, SĐT — chỉ đọc.
2. Trạng thái lúc tạo = `DANG_LAM` (không sửa trên form).
3. Phí thỏa thuận (tuỳ chọn).
4. Nhu cầu (tuỳ chọn).
5. Ghi chú (tuỳ chọn).
6. Ngày bắt đầu — mặc định hôm nay.
7. Ngày dự kiến xong — tuỳ chọn.
8. Không đính file lúc tạo — thêm sau trên panel list.

Khách ẩn / không thuộc NV (STAFF) / không tìm thấy → báo, không lưu.

---

*Hành vi list bám §12. Visual §4.3.7. Không copy god-file.*

---

## 13. Đánh giá CRM cũ + lộ trình CRM mới

### 13.1 Đánh giá chức năng cũ

CRM cũ **đủ dùng** cho 1–vài hồ sơ: một hồ sơ / khách, trạng thái, phí thỏa thuận tách khỏi thu-chi thật, nhật ký bước, ghim, mã `SD-YYYY-NNNN`, STAFF chỉ thấy hồ sơ mình tạo.

**Giữ** (không invent lại): ownership `createdBy`; tạo từ khách; không nút Thêm trên list; list + panel (máy tính) / thẻ (mobile) đã chốt §12; thu/chi tách giá; bước gợi ý 9 loại.

**Yếu / nâng cấp bắt buộc trên CRM mới**

| Vấn đề cũ | Làm mới |
|-----------|---------|
| File trên disk `/img/title-services/` — cùng cây `img` có thể **public** | **Private R2** (`uploadPrivate` + signed URL). **Không** CDN, **không** URL tĩnh. Chỉ NV có quyền hồ sơ mới lấy link (TTL ngắn) |
| Xóa cứng + xóa file | **Bỏ** — không xoá hồ sơ; Tạm dừng / Hoàn thành + Khôi phục; file mật vẫn private |
| `HUY` không ghi `completedAt` → số ngày vẫn chạy | **Hủy = Tạm dừng**; Tạm dừng / Hoàn thành ghi `completedAt`, dừng đếm ngày |
| `StepType` / loại giấy tùy ý | Enum chốt + «Khác» (ghi chú). Không nhận chuỗi tự do làm `kind` lưu DB |
| Prisma stub lệch | Sửa schema **trước** copy. Tiền **BigInt** |
| ~~Tạo từ khách trên web mới chưa có~~ | **Xong** — `/khach-hang/[id]/dich-vu-so-do` |

**Không làm** trong P3: nối lô/GD vào hồ sơ sổ đỏ; UI xem nhật ký file (chỉ **ghi** `TitleServiceAttachmentView`); extension.

### 13.2 Giấy tờ — chốt mật

CCCD, sổ đỏ, scan hồ sơ = **tài liệu mật**.

- Bucket `anhungland-crm-private`. API trả `objectKey` + `GET …/attachments/:id/url` (signed, sau authz).
- UI **không** nhúng URL CDN / `/img/…`. Xem/tải = bấm → API cấp link có hạn.
- Object key do server đặt (`title-services/{id}/…`). MIME + size chặn ở API.
- Copy từ cũ: `StoredPath` → private R2, không public.
- Xem/tải: ghi `TitleServiceAttachmentView` (`viewedByEmployeeId`, `viewedAt`). Chưa có màn list nhật ký.

### 13.3 Lộ trình (một số = một PR)

Khách + User **đã có**. List mock §12 **đã có**.

| # | Việc | Vì sao thứ tự này |
|---|------|-------------------|
| **1** | Chốt docs (mục 13.1–13.2) | Trước schema / API |
| **2** | ~~Contract Zod~~ **xong** — `createdBy`, BigInt tiền, file không public URL | UI/API cùng shape |
| **3** | ~~Prisma `TitleService*`~~ **xong** — bỏ stub; FK khách + NV | Schema trước data |
| **4** | ~~Nest CRUD hồ sơ~~ **xong** — list / get / tạo / sửa / ghim / xóa — **chưa** file | Xương ownership |
| **5** | ~~Nest tiến độ + thu/chi~~ **xong** | Nhật ký / tiền trên hồ sơ sống |
| **6** | ~~Nest file~~ **xong** — upload private R2 + signed URL + xóa object | Giấy tờ mật |
| **7** | ~~Nối UI `/dich-vu-so-do`~~ **xong** — API | List/panel thật |
| **8** | ~~Tạo hồ sơ từ khách~~ **xong** — `/khach-hang/[id]/dich-vu-so-do` | Không nút Thêm trên list |
| **9** | ~~Copy 1 hồ sơ SQLite~~ **script xong** — `pnpm title-services:migrate-legacy` (chạy VPS khi gộp `main`) | Data kha `SD-2026-0001` |
| **10** | ~~ADMIN lọc NV + audit xem file~~ **xong** — select NV trên list; ghi `TitleServiceAttachmentView` khi cấp signed URL | Không chặn 1–9 |
