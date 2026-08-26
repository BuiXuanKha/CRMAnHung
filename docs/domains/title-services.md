# Domain: Title services (Dịch vụ sổ đỏ)

- **Slug:** `title-services`
- **Status:** Ready for API — UI `/dich-vu-so-do` nối API khi login thật; tạo từ khách **xong**; chưa copy legacy.
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
| ADMIN | Tất cả; lọc `employeeId` | — |

Tạo hồ sơ từ menu khách «Dịch vụ sổ đỏ». **Không** nút Thêm trên list. Tạo luôn `DANG_LAM`.

## 3. Khái niệm

| Trạng thái | Enum | Hangtag |
|------------|------|---------|
| Đang làm | `DANG_LAM` | green |
| Tạm dừng | `TAM_DUNG` | gray — **vẫn hiện** mặc định (không ẩn như lô) |
| Hoàn thành | `HOAN_THANH` | blue |
| Hủy | `HUY` | red |

**Số ngày:** từ `startedAt` đến nay; khi **Hoàn thành hoặc Hủy** dừng tại `completedAt` (CRM mới ghi cả hai). `0` → «Hôm nay».

Tiến độ gợi ý: Bàn giá, Thu thập giấy tờ, Đo đạc, Nộp hồ sơ, Bổ sung, Làm việc cơ quan, Nhận kết quả, Bàn giao, Khác — API cũ **không chặn** `StepType` ngoài list. Thu/Chi. Tài liệu: Sổ đỏ / Căn cước / Khác (hoặc chuỗi tự nhập).

## 4. Use cases (CRM cũ)

1. **Tạo từ khách** — `POST` `personId`; khách phải thuộc NV (STAFF) và không ẩn. Mã `SD-YYYY-NNNN`. Status `DANG_LAM`.
2. **List** — STAFF chỉ hồ sơ mình; ADMIN tất cả + `?employeeId=`. Tìm: mã + tên + SĐT (không tìm nhu cầu/ghi chú). Sort: ghim → `pinnedAt` → `updatedAt`. Limit 500.
3. **Sửa** — trạng thái, phí thỏa thuận, nhu cầu, ghi chú, ngày dự kiến xong. Chuyển **Hoàn thành** ghi `completedAt`; rời Hoàn thành thì xóa `completedAt`.
4. **Ghim** — `PATCH /:id/pin` `{ pinned }`.
5. **Tiến độ / thu-chi / file** — thêm/xóa trên hồ sơ mình. File tối đa 12 MB, disk `/img/title-services/`.
6. **Xóa cứng** — hồ sơ + tiến độ + tiền + file.

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

Prefix `/api/v1/title-services` — list / get / tạo / sửa / ghim / xóa + tiến độ / thu-chi + file private (multipart, signed GET, xóa object).

## 8. Mock data

`mock-data.ts` cho local khi `NEXT_PUBLIC_USE_MOCK_AUTH=true`. Staging login thật → API (`isMockTitleServices` = `isMockAuth`). List kha trống cho đến khi copy `SD-2026-0001`.

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Chi tiết: [`MIGRATION.md`](../MIGRATION.md) bước 12. Live (2026-08-26): **1** hồ sơ `SD-2026-0001` (`DANG_LAM`, **kha**, khách `PersonId` 1561), 2 tiến độ, 3 khoản tiền (thu 13tr / chi 2tr), **0** file. Thư mục `img/title-services` trống.

| Cũ | Mới (đã chốt Prisma) |
|----|----------------------|
| `tblTitleService` | `TitleService` (`code`, `customerId`, `createdByEmployeeId`, BigInt phí, ghim, `startedAt`…) |
| `tblTitleServiceProgress` | `TitleServiceProgress` (`stepType`, `happenedAt`, `createdByEmployeeId`) |
| `tblTitleServiceMoney` | `TitleServiceMoney` (`kind` THU/CHI, `title`, `amountVnd` BigInt) |
| `tblTitleServiceAttachment` | `TitleServiceAttachment` (`objectKey` private R2, `kind`, `fileName`) |

## 11. CRM cũ vs web mới

- Tìm: mã + tên + SĐT (không tìm nhu cầu / ghi chú).
- Cũ ADMIN: `?employeeId=`. Mới: chưa.
- Không `@` / `@@`.
- Xóa cũ = cứng (kèm file). Mock chỉ gỡ list.

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

Hangtag **Clear** (`CrmBadge` gray) **ngay sau con trỏ** khi ô không trống. Bấm → xoá hết từ khoá, giữ focus. Chữ tràn → hangtag dính mép phải phần đang thấy.

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

### 12.4 Tạo từ khách `/khach-hang/[id]/dich-vu-so-do`

Không nút Thêm trên list. Menu khách «Dịch vụ sổ đỏ» → trang này. ADMIN **được** tạo (khác lô đất). Lưu xong → `/dich-vu-so-do?id=` (chọn hồ sơ mới). Quay lại / Hủy → `/khach-hang`.

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
| Xóa cứng + xóa file | STAFF xóa = confirm; file mật **không** public kể cả sau xóa (xóa object private). Không soft-delete trừ khi chủ bảo thêm |
| `HUY` không ghi `completedAt` → số ngày vẫn chạy | Hủy **và** Hoàn thành đều ghi `completedAt`, dừng đếm ngày |
| `StepType` / loại giấy tùy ý | Enum chốt + «Khác» (ghi chú). Không nhận chuỗi tự do làm `kind` lưu DB |
| Prisma stub lệch | Sửa schema **trước** copy. Tiền **BigInt** |
| ~~Tạo từ khách trên web mới chưa có~~ | **Xong** — `/khach-hang/[id]/dich-vu-so-do` |

**Không làm** trong P3: nối lô/GD vào hồ sơ sổ đỏ; audit log xem file (có thể thêm sau); extension.

### 13.2 Giấy tờ — chốt mật

CCCD, sổ đỏ, scan hồ sơ = **tài liệu mật**.

- Bucket `anhungland-crm-private`. API trả `objectKey` + `GET …/attachments/:id/url` (signed, sau authz).
- UI **không** nhúng URL CDN / `/img/…`. Xem/tải = bấm → API cấp link có hạn.
- Object key do server đặt (`title-services/{id}/…`). MIME + size chặn ở API.
- Copy từ cũ: `StoredPath` → private R2, không public.

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
| **7** | ~~Nối UI `/dich-vu-so-do`~~ **xong** — `isMockTitleServices` = login giả | List/panel thật |
| **8** | ~~Tạo hồ sơ từ khách~~ **xong** — `/khach-hang/[id]/dich-vu-so-do` | Không nút Thêm trên list |
| **9** | Copy 1 hồ sơ SQLite → Postgres (+ 2 tiến độ, 3 tiền; 0 file) | Data kha `SD-2026-0001` |
| **10** | (Sau) ADMIN lọc NV trên list; tùy chọn audit xem file | Không chặn 1–9 |
