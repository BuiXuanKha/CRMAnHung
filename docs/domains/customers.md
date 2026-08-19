# Domain: Customers (Khách hàng)

- **Slug:** `customers`
- **Status:** Ready for API (list P1)
- **Owner:** An Hưng Land
- **Liên quan hệ cũ:** `Web` khách hàng + `AnhunglandExtension` ingest + `API` `customer.*`
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.1–4.3.4 + §4.5–4.7
- **Contract:** `packages/shared/src/customers.ts`
- **Chốt list:** 2026-08-19 — mục **12** dưới đây là nguồn sự thật cho ô tìm, bảng/thẻ, icon, menu, rail. **Chưa** làm Nest module / modal chức năng mới cho đến khi bám đúng mục 12.

---

## 1. Mục đích

Quản lý lead/khách từ Facebook Messenger / Business Suite Inbox hoặc nhập tay (SĐT), để nhân viên chăm sóc, gắn lô đất, theo dõi lịch sử.

Màn **danh sách** `/khach-hang` là workbench hàng ngày: tìm đúng người → đọc nhu cầu / tài chính / kênh → gọi hoặc chat → ghi chăm sóc / ghim / ẩn. Chi tiết hồ sơ (`/khach-hang/[id]`) **chưa** thuộc slice này.

## 2. Actors & quyền

| Actor | Được làm trên list | Không được |
|-------|--------------------|------------|
| STAFF | CRUD khách **của mình** (`employeeId` = user đang login); pin/hide/restore; care notes | Xem khách nhân viên khác; hard-delete |
| ADMIN | Toàn bộ của STAFF + list toàn hệ | Hard-delete ở P1 (vẫn chỉ soft-hide) |

API phải lọc ownership **ở service**, không tin UI.

## 3. Khái niệm & trạng thái

| Thuật ngữ | Field / enum | Nghĩa trên list |
|-----------|--------------|-----------------|
| Customer | hồ sơ chính | Một người đang chăm sóc |
| `fullName` | string | Tên hiện trên bảng / thẻ |
| Status | `CustomerStatus` | Hangtag cạnh tên |
| `note` | string? | **Nhu cầu** trên cột/thẻ — không phải lịch sử chăm sóc |
| Care note | `CustomerCareNote` | Ghi chú chăm sóc **append-only**; `latestCareNote` = bản mới nhất (dùng tìm kiếm + rail, **không** thay cột Nhu cầu) |
| CustomerPhone | 1–n SĐT | `primaryPhone` = SĐT chính **tính ra** (P1: số đầu / số lúc tạo). Prisma **không** cột `primaryPhone` |
| CustomerFacebook | 0–1 | Avatar, tên FB, thread Messenger, `scanSource` |
| Pin | `isPinned` | Ưu tiên trên cùng; nền vàng |
| Ẩn | `isHidden` | Xóa mềm P1 — **không** `deletedAt` |
| `lodatCount` | int | Số lô đã gắn (map); 0 = chưa gắn |
| `budgetMinVnd` / `budgetMaxVnd` | int? | Cột Tài chính |
| Ownership | `employeeId` | NV phụ trách |

**Status (hangtag):**

| Enum | Nhãn UI | Tone | Footer mobile |
|------|---------|------|----------------|
| `KHACH_NET` | Khách nét | green | KN |
| `KHACH_MOI` | Khách mới | blue | KM |
| `KHACH_CAN_CHAM_SOC` | Khách cần chăm sóc | amber | CCS |
| `KHAC` | Khác | gray | KH |

**Ẩn / xoá mềm (P1):** `isHidden = true`. Khách biến khỏi list mặc định; lấy lại bằng `@` / `@@` rồi **Hiện lại khách**. Revisit hard-delete / `deletedAt` ở P4.

## 4. Use cases (P1 tối thiểu — list)

1. Đăng nhập → `/khach-hang` → list khách của mình (ADMIN: tất cả), mặc định **không** hiện khách đã ẩn.
2. Gõ ô tìm → lọc ngay theo quy tắc §12.2; `@` / `@@` đổi tập ẩn.
3. Lọc cột (desktop) hoặc panel Bộ lọc (mobile): trạng thái, nhu cầu, tài chính, kênh, lô đất.
4. Bấm dòng/thẻ → **chọn** khách (highlight + rail desktop). **Không** điều hướng sang `[id]`.
5. Tạo khách thủ công (modal tên + SĐT) → status `KHACH_MOI`.
6. Menu: mở chat (rail) / Messenger / thêm care note / ghim / ẩn. «Tạo lô đất» và «Dịch vụ sổ đỏ» chưa tạo bản ghi từ list (xem §12.9).
7. (Sau list) Chi tiết `[id]`; ingest extension `POST .../from-extension`.

## 5. Quan hệ dữ liệu

- Customer 1—1 CustomerFacebook (optional)
- Customer 1—n CustomerPhone, CareNote, MessengerMessage (qua Facebook)
- Customer n—n Lodat qua `LodatCustomerMap` — list chỉ cần `lodatCount`

Ownership: `customer.employeeId` = user tạo / được gán.

`primaryPhone` chỉ có trên contract list item (computed). CSDL: `CustomerPhone[]`.

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| **List** | `/khach-hang` | Desktop: ô tìm + nút thêm SĐT; bảng §4.5; icon lọc cột; menu; **một** rail phải. Mobile: ô tìm + Bộ lọc + Tìm; thẻ; footer All/KN/KM/CCS/KH/ĐG; nút Thêm SĐT đáy; **ẩn rail** |
| Detail | `/khach-hang/[id]` | **Placeholder** — không thuộc slice list |
| Create | modal trên list | Tên + SĐT — §12.11 |

Không H1 trùng menu header. Desktop không lặp dropdown trên thanh tìm (lọc bằng icon cột).

Nội dung ô / icon / tìm kiếm: **mục 12**, không đoán thêm field.

## 7. Contract / API dự kiến

Contract: `packages/shared/src/customers.ts`  
Prefix: `/api/v1`

Parse `@` / `@@` **ở client** (`parseSearchKeyword`). API nhận flag đã tách, **không** nhận ký tự `@` trong `keyword`.

| Method | Path | Query / body | Auth |
|--------|------|--------------|------|
| GET | `/customers` | `keyword`, `status`, `includeHidden`, `hiddenOnly`, **cộng** filter §12.3 (`finance`, `channel`, `lodat`, `demand`) | JWT + ownership |
| GET | `/customers/:id` | — | JWT + ownership |
| POST | `/customers` | `{ fullName, phone, note? }` | JWT |
| PATCH | `/customers/:id` | subset: status, note, budget, `isPinned`, `isHidden`, tên… | JWT + ownership |
| POST | `/customers/:id/care-notes` | `{ note }` append | JWT + ownership |
| POST | `/customers/from-extension` | ingest | JWT (extension) — 1b |
| DELETE | `/customers/:id` | **Không hard-delete P1** — client gọi PATCH `isHidden: true` | JWT |

**GET list — thứ tự bắt buộc:** (1) ownership → (2) ẩn theo `includeHidden` / `hiddenOnly` → (3) `status` → (4) `keyword` substring → (5) extra filters → (6) sort §12.4.

Mock hiện lọc extra **sau** fetch; khi có API (và khi phân trang) extra filter **phải** chạy trên server, nếu không số trang sẽ sai.

Chưa phân trang P1: trả hết bản ghi khớp. `total` = số item **sau** mọi filter (footer «Hiển thị N / Tổng M»: N = số dòng đang hiện sau extra filter; M = `total` từ API cùng query ẩn/status/keyword).

## 8. Mock data cần có

- Khách mới (`KHACH_MOI`) có FB + thread
- Khách nét nhiều SĐT / Zalo
- Khách cần chăm sóc + `note` nhu cầu
- Khách `KHAC`, khách chưa có SĐT / chưa có FB
- 1 khách `isHidden` (test `@` / `@@`)
- 1 khách `isPinned`
- 1 khách của nhân viên khác (API 403 / không hiện với STAFF)
- Đủ dòng để cuộn bảng

## 9. Extension

- [x] Có — port scanner sau khi API ingest ổn (không thuộc slice list)

## 10. Migrate

`tblPerson*` → `Customer*` (xem `MIGRATION.md`). Ô tìm `@`/`@@` giữ hành vi hệ cũ (`parseCustomerSearchInput`).

## 11. Open questions (còn lại — **không** chặn list API)

- ~~Soft-delete = `isHidden` hay `deletedAt`?~~ → P1: `isHidden`.
- ~~Một hay nhiều panel rail?~~ → **một panel** (§12.10).
- Tìm có **bỏ dấu tiếng Việt** không? Hiện **giữ dấu** (case-insensitive, accent-sensitive). Đổi thì sửa docs + mock + API cùng lúc.
- Cùng một NV, **trùng SĐT** hai hồ sơ: P1 **không** chặn unique. Có thể siết sau.
- Phân trang / kích thước trang.
- Hard-delete (P4).
- Trang chi tiết `[id]` (tab thông tin / care / lodat).
- «Tạo lô đất» từ menu: tạo mới gắn khách này vs chỉ nhảy `/lo-dat`.
- «Dịch vụ sổ đỏ»: tạo hồ sơ gắn khách vs chỉ nhảy `/dich-vu-so-do`.
- Chat rail: mock tin vs đọc `CustomerMessengerMessage`.
- SĐT «chính» nếu có nhiều số (label) — P1 = số đầu / số lúc tạo.

---

## 12. Đặc tả danh sách `/khach-hang` (đã chốt)

Mục này khóa **nghiệp vụ** để viết CSDL + API + modal cho đúng. Hình thức (màu, font, hangtag, dialog) vẫn theo UI-GUIDELINES — không invent UI mới.

### 12.1 Ô tìm kiếm — tìm cái gì?

Placeholder: `Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)`

**Khớp khi** chuỗi đã `trim` + `toLowerCase()` là **substring** (`includes`) của **một trong** các field (ghép thành một haystack):

| Field | Ý nghĩa | Ví dụ khớp |
|-------|---------|------------|
| `fullName` | Tên khách | `hùng` → «Nguyễn Văn Hùng» |
| `primaryPhone` | SĐT chính | `0912` |
| `phones[].phone` | Mọi số đã lưu | số phụ, Zalo |
| `facebook.facebookName` | Tên hiển thị FB | nick Inbox |
| `note` | Nhu cầu | `nhà phố`, `2 tỷ` |
| `latestCareNote` | Ghi chú chăm sóc mới nhất | nội dung vừa ghi |

**Không** tìm: tên nhân viên phụ trách, mã khách nội bộ, địa chỉ lô, nội dung chat đầy đủ, care note cũ hơn bản mới nhất, ngân sách số (trừ khi người dùng gõ đúng chuỗi có trong `note`).

**Không** tách từ / không fuzzy / không regex. Dấu tiếng Việt **có tính** (`hung` **không** khớp `hùng`).

Gõ từng ký tự đã lọc (không đợi submit). Nút **Tìm** (mobile) và Enter: **chỉ đóng bàn phím** (`blur`), không đổi thuật toán.

Ô bắt đầu bằng `@` → viền vàng (`is-at-mode`), cùng pattern lô đất.

### 12.2 Quy tắc `@` / `@@` (ẩn)

Giống hệ cũ. Xử lý **sau** `trim`, **trước** khi gửi API:

| Input (sau trim) | Ẩn | `keyword` gửi API |
|------------------|----|-------------------|
| (rỗng) | Chỉ khách `isHidden = false` | không gửi |
| `hùng` | Chỉ chưa ẩn | `hùng` |
| `@` | Hiện **cả** ẩn lẫn chưa ẩn | không gửi |
| `@ hùng` / `@hùng` | Cả ẩn lẫn chưa ẩn, rồi lọc chữ | `hùng` |
| `@@` | **Chỉ** khách đã ẩn | không gửi |
| `@@ hùng` | Chỉ đã ẩn + lọc chữ | `hùng` |

`@@` ưu tiên hơn `@` (chuỗi bắt đầu `@@`).

STAFF/ADMIN vẫn bị ownership: `@` không làm lộ khách của người khác.

### 12.3 Lọc (không phải ô tìm)

Áp **sau** (hoặc cùng) keyword. Desktop = icon `ListFilter` trên **tên cột**. Mobile = panel **Bộ lọc**. Cùng bộ giá trị.

| Lọc | Field | Giá trị | Rule |
|-----|-------|---------|------|
| Trạng thái (cột Tên khách) | `status` | tất cả / từng enum | bằng đúng enum |
| Nhu cầu | `note` | tất cả / Có nhu cầu / Chưa có | «Có» = `note` trim khác rỗng và khác `—` |
| Tài chính | budget min/max | tất cả / Có ngân sách / Chưa nhập | «Có» = ít nhất một bound ≠ null |
| Kênh liên hệ | FB / phones / scanSource | tất cả / Facebook·Messenger / SĐT·Zalo / Page | `facebook` truthy; `phones.length > 0`; `scanSource` ∈ `page` \| `business_suite` |
| Số lô đất | `lodatCount` | tất cả / Đã gắn lô / Chưa gắn lô | `> 0` / `= 0` |

Nút **Xoá lọc** (mobile, khi đang lọc): reset status + bốn extra về `all`. **Không** xóa chữ ô tìm.

Footer desktop: `Hiển thị N / Tổng M khách hàng` — N = số dòng sau extra filter; M = total API (cùng keyword/ẩn/status).

Footer mobile: `All` N[/M] · `KN` · `KM` · `CCS` · `KH` · `ĐG` (số **ghim trong tập đang hiện**, không phải tổng hệ).

### 12.4 Sắp xếp

1. `isPinned = true` trước  
2. `updatedAt` giảm dần (mới sửa / mới care note lên trên)

Không sort theo tên. Không cho user đổi cột sort ở P1. `#` = số thứ tự **sau** sort (1…N), không phải id.

### 12.5 Bảng desktop — mỗi cột hiện gì?

Bấm dòng = chọn khách (nền selected). Không mở trang chi tiết.

| Cột | Hiện | Trống |
|-----|------|--------|
| `#` | Index 1-based | — |
| **Tên khách** | Avatar  (ảnh `facebook.avatarUrl` hoặc initials từ `fullName`) + **tên đậm** + icon Phone nếu có `primaryPhone` (chỉ báo «có SĐT», **không** `tel:` trên desktop) + icon MessageCircle nếu có `facebook` (chỉ báo «có FB», **không** mở Messenger) + hangtag status + dòng phụ italic = `facebookName` nếu có | Không ẩn dòng vì thiếu avatar |
| **Nhu cầu** | `note` (demand) | `—` |
| **Tài chính** | `formatBudget(min, max)` class `crm-money` (`#b45309`): `A - B` / `Từ A` / `Đến B`; đơn vị tỷ/triệu | `—` |
| **Kênh liên hệ** | xem §12.6 | không `—` nếu luôn có `employeeName` |
| **Số lô đất** | `lodatCount` (kể cả `0`) | `0` |
| **Thao tác** | Nút chevron → menu §12.9 | — |

**Kênh liên hệ** (cùng hàm `channelLabel`):

1. Có SĐT label chứa `zalo` (không phân biệt hoa thường) → `{phone} ({label})`
2. Else `scanSource` là `page` hoặc `business_suite` → `Page {facebookName hoặc employeeName}`
3. Else → `employeeName`

Ghim: class dòng `is-hot` — nền vàng `#fef9c3`. Menu đang mở: nền vàng nhạt. Selected: theo §4.5.3.

### 12.6 Thẻ mobile — mỗi item hiện gì?

Ẩn bảng. Ẩn rail. Cùng data với desktop.

| Vùng | Hiện | Việc khi bấm |
|------|------|----------------|
| Trái | Avatar 48px (ảnh FB / initials) | Chọn thẻ |
| Giữa — tên | `fullName` đậm | Chọn thẻ |
| Giữa — Phone | Chỉ khi có `primaryPhone` | `tel:{primaryPhone}` (stopPropagation) |
| Giữa — MessageCircle | Chỉ khi có `facebook` | **Không** bấm được — chỉ báo có FB |
| Giữa — Map + số | Chỉ khi `lodatCount > 0` | Không điều hướng — chỉ báo số lô |
| Giữa — kênh | `channelLabel` | Chọn thẻ |
| Giữa — hangtag | status | Chọn thẻ |
| Giữa — ngân sách | `formatBudget` nếu ≠ `—`; màu **`crm-money`** (`#b45309`) — mock thẻ đang xanh, API/UI sau chỉnh cho khớp §4.5 | Chọn thẻ |
| Giữa — nhu cầu | `note` tối đa ~2 dòng, ẩn nếu `—` | Chọn thẻ |
| Phải — SquarePen | luôn | Mở dialog chăm sóc (cùng menu «Cập nhật chăm sóc») |
| Phải — chevron | luôn | Menu §12.9 |

Ghim: nền `#fef9c3` + viền trái `#ca8a04`. Markup: `article`/`div`, **cấm** `<button>` bọc `<div>`. `flex-shrink: 0` trên khối không được co.

Không icon Star — ghim = màu thẻ, không sao.

### 12.7 Bản đồ icon (Lucide) — icon này để làm gì?

Không emoji. Size theo §4.6.

| Icon | Chỗ | Việc |
|------|-----|------|
| `Phone` | Cột tên desktop | Trang trí: có SĐT |
| `Phone` | Thẻ mobile cạnh tên | Gọi `tel:` |
| `Phone` | Dialog thêm khách | Icon tiêu đề form |
| `MessageCircle` | Cột tên / thẻ | Trang trí: có hồ sơ Facebook |
| `MessageCircle` | Menu | **Mở Messenger** tab mới |
| `MessageSquare` | Menu | **Mở chat** = rail «Nội dung chat» (desktop). Mobile: vẫn set rail nhưng rail đang ẩn — P1 chấp nhận; không invent panel chat full-screen |
| `Map` | Thẻ (kèm số) | Có lô đã gắn |
| `Map` | Menu | «Tạo lô đất» |
| `SquarePen` | Thẻ | Cập nhật chăm sóc |
| `NotebookPen` | Menu + dialog care | Cập nhật chăm sóc |
| `FileText` | Menu | «Dịch vụ sổ đỏ» |
| `Pin` | Menu | Ghim / Bỏ ghim |
| `Trash2` | Menu (đỏ) + confirm | Ẩn khách (`isHidden`) |
| `ChevronDown` / `ChevronUp` | Nút thao tác | Mở / đóng menu |
| `ChevronLeft` | Thanh rail | Gợi ý mở panel |
| `ListFilter` | Header cột | Mở lọc cột |
| `Plus` | Nút thêm SĐT | Mở modal tạo |
| `AlertTriangle` | Alert (vd. thiếu thread) | Thông báo |

### 12.8 Hangtag & ghim

Hangtag = `CrmBadge` 5 tone §4.5.4 — không invent màu status.

| `isPinned` | List |
|-----------|------|
| true | Trên cùng nhóm; nền vàng |
| false | Sau nhóm ghim; nền trắng |

Ghim **không** thay status. Khách ẩn vẫn giữ pin (khi hiện qua `@`).

### 12.9 Menu hành động — từng mục (chốt hành vi, chưa bắt buộc UI mới)

Một menu mở tại một thời điểm. Bấm ra ngoài / chọn mục / bấm lại nút → đóng. Dòng đang mở menu nền vàng nhạt.

| Mục | Icon | Hành vi đã chốt | API / ghi chú |
|-----|------|-----------------|---------------|
| Mở chat | MessageSquare | Chọn khách + mở rail `chat` (một panel). Chưa chọn khách thì rail báo «Chọn một khách…» | Sau: đọc tin nhắn đã lưu. Mock: `mockChats` |
| Mở Messenger | MessageCircle | `window.open` `https://www.facebook.com/messages/t/{threadId}`. Không có `threadId` → **CrmAlert**: «Khách này chưa có thread Messenger.» | Không gọi API CRM |
| Cập nhật chăm sóc | NotebookPen | **CrmDialog** form. Textarea **trống** (không prefill `latestCareNote` — đó là append, không sửa bản cũ). Submit → `POST /customers/:id/care-notes`. Mở rail `care` trên desktop | Append-only; cập nhật `latestCareNote` + `updatedAt` |
| Tạo lô đất | Map | **Chưa** tạo lodat từ đây. Mock: toast «sẽ làm ở màn lô đất». Không mở modal giả | Chờ chốt use case lodat |
| Dịch vụ sổ đỏ | FileText | `router.push('/dich-vu-so-do')` — **không** tạo hồ sơ | Chờ chốt gắn customerId |
| Ghim khách | Pin | Hiện khi `!isPinned` | `PATCH isPinned: true` |
| Bỏ ghim khách | Pin | Hiện khi `isPinned` — **cùng một chỗ**, đổi nhãn | `PATCH isPinned: false` |
| Xóa khách | Trash2 đỏ | Hiện khi `!isHidden`. **CrmConfirm** «Ẩn khách…». Confirm → `PATCH isHidden: true`. Toast đã ẩn | Soft-hide. **Không** `DELETE` cứng |
| Hiện lại khách | (cùng Trash2 hoặc icon hiện — không đỏ) | Hiện khi `isHidden` (user đang xem `@`/`@@`). Confirm ngắn → `PATCH isHidden: false` | **Chưa có trên mock** — làm cùng lúc API/modal list |

«Xóa» trên UI = ẩn. Copy confirm phải nói **ẩn**, không nói xóa vĩnh viễn.

### 12.10 Rail phải (chỉ desktop)

Ba thanh dọc, trái → phải:

1. Nội dung chat  
2. Lịch sử chăm sóc  
3. Danh sách lô đất  

**Đã chốt: chỉ một panel mở.** Bấm thanh khác → **đổi** panel (không chồng 2 panel). Bấm lại thanh đang mở → thu hẹp. Chưa chọn dòng → panel: «Chọn một khách trên bảng để xem.»

| Panel | Dữ liệu | Trống |
|-------|---------|--------|
| Chat | Tin theo `customer.id` | «Chưa có nội dung chat» |
| Chăm sóc | `careNotes` mới → cũ | «Chưa có lịch sử chăm sóc» |
| Lô đất | lô gắn khách (sau: map). Mock: `mockLodatsByCustomer` | «Chưa gắn lô đất» |

Mobile: rail **không render / ẩn CSS**. Chọn thẻ vẫn lưu `selectedId` cho lần xoay máy / desktop.

### 12.11 Tạo khách bằng số điện thoại

Desktop: nút cùng hàng ô tìm. Mobile: nút đáy xanh `#16a34a`, ẩn nút trên thanh.

**CrmDialog** — field:

| Field | Bắt buộc | Validate |
|-------|----------|----------|
| Tên khách | có | trim, min 1 |
| Số điện thoại | có | `/^0\d{9}$/` — 10 số, bắt đầu `0` |

Tạo xong:

- `status` = `KHACH_MOI`
- `employeeId` = user hiện tại
- `isPinned` = false, `isHidden` = false
- một `CustomerPhone`, `primaryPhone` = số đó
- `facebook` = null, `lodatCount` = 0, budget null

Không field nhu cầu / ngân sách trên modal P1 (sửa sau ở chi tiết).

### 12.12 Chọn dòng vs trang chi tiết

| Hành động | Kết quả P1 |
|-----------|------------|
| Bấm dòng / thẻ (không phải icon gọi / menu / sửa) | `selectedId` = khách đó |
| Bấm `#` / tên | như bấm dòng |
| Vào `/khach-hang/[id]` | **Không** từ list |

### 12.13 Việc **không** làm trên slice list

- Sửa tên / SĐT / status / nhu cầu / ngân sách trên list (trừ ghim/ẩn/care note)
- Unique SĐT, merge trùng, hard-delete
- Tạo lodat hoặc hồ sơ sổ đỏ từ menu
- Trang chi tiết, upload, ingest extension
- Invent cột mới (email, CCCD, nguồn ads…)

---

*Khi implement API: bám §7 + §12. Khi làm modal tiếp: chỉ các dialog đã kể (thêm SĐT, care note, confirm ẩn/hiện, alert Messenger). Visual: UI-GUIDELINES, không clone god-file CRM cũ.*
