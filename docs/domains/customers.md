# Domain: Customers (Khách hàng)

- **Slug:** `customers`
- **Status:** Ready for mock (list đang chốt từng control; **modal chi tiết làm sau**)
- **Owner:** An Hưng Land
- **Liên quan hệ cũ:** `Web` khách hàng + `AnhunglandExtension` ingest + `API` `customer.*`
- **UI visual:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.1–4.3.4 + §4.5–4.7
- **Contract:** `packages/shared/src/customers.ts` — bổ sung field khi §12 ổn
- **Chốt list:** 2026-08-19 — **mục 12** viết đúng cấu trúc chủ sở hữu (ô tìm → bảng → từng item/icon). Chưa code Nest / chưa bịa field modal.

---

## 1. Mục đích

Quản lý lead/khách từ Facebook Messenger / Business Suite Inbox hoặc nhập tay (SĐT), để nhân viên chăm sóc, gắn lô đất, theo dõi lịch sử.

Màn **danh sách** `/khach-hang` là workbench: tìm → đọc dòng → bấm icon/menu. Chi tiết `/khach-hang/[id]` **chưa** thuộc slice này.

## 2. Actors & quyền

| Actor | Được làm trên list | Không được |
|-------|--------------------|------------|
| STAFF | Khách **của mình** (`employeeId`); pin / ẩn / khôi phục; care notes; SĐT | Xem khách NV khác; hard-delete |
| ADMIN | Toàn bộ của STAFF + list toàn hệ | Hard-delete P1 (vẫn soft-hide) |

API lọc ownership ở service, không tin UI.

## 3. Khái niệm & trạng thái

| Thuật ngữ | Field | Nghĩa trên list |
|-----------|--------|-----------------|
| Customer | hồ sơ | Một người đang chăm sóc |
| Tên | `fullName` | 1.2.2 |
| Status | `CustomerStatus` | Hangtag 1.2.5 |
| Nhu cầu | `note` | Cột Nhu cầu — **không** phải lịch sử chăm sóc |
| Ghi chú | `latestCareNote` | Care note **mới nhất** — ô tìm; rail chăm sóc |
| SĐT | `CustomerPhone[]` / `primaryPhone` (tính) | Icon đỏ 1.2.3 |
| Tin nhắn | `messageCount` / `hasMessages` | Icon mess xanh 1.2.4 — **có nội dung chat đã lưu**, không chỉ có Facebook |
| Facebook | `CustomerFacebook?` | Avatar, tên FB, thread |
| Pin | `isPinned` | Nền vàng, lên đầu |
| Đã xoá | `isHidden` | Xóa mềm P1 — không `deletedAt` |
| Số lô | `lodatCount` | Icon đếm 1.2.6 + cột Số lô đất |
| Tài chính | `budgetMinVnd` / `budgetMaxVnd` | Cột Tài chính |
| NV | `employeeId` | Sở hữu |

**Hangtag trạng thái:**

| Enum | Nhãn | Tone | Footer mobile |
|------|------|------|----------------|
| `KHACH_NET` | Khách nét | green | KN |
| `KHACH_MOI` | Khách mới | blue | KM |
| `KHACH_CAN_CHAM_SOC` | Khách cần chăm sóc | amber | CCS |
| `KHAC` | Khác | gray | KH |

## 4. Use cases (P1 list)

1. Vào `/khach-hang` → list theo ownership; mặc định **không** hiện đã xoá.
2. Ô tìm theo §12.1 (kể cả `@` / `@@`).
3. Lọc cột / Bộ lọc mobile.
4. Bấm nền dòng/thẻ → chọn (rail desktop). Không vào `[id]`.
5. Icon SĐT đỏ → modal nhỏ cập nhật SĐT (quy tắc modal sau).
6. Nút thêm khách bằng SĐT → modal tạo (quy tắc modal sau).
7. Menu: chat / Messenger / chăm sóc / lô / sổ đỏ / ghim / ẩn.

## 5. Quan hệ dữ liệu

- Customer 1—1 CustomerFacebook (optional)
- Customer 1—n Phone, CareNote, MessengerMessage
- Customer n—n Lodat qua map — list cần `lodatCount` (+ `messageCount` cho icon mess)

`primaryPhone` / `hasMessages` là field **list** (computed). CSDL: bảng con.

## 6. UI

| Màn | Route | Hành vi |
|-----|-------|---------|
| List | `/khach-hang` | §12 |
| Detail | `/khach-hang/[id]` | Placeholder |
| Modal | trên list | Tạo khách / cập nhật SĐT — **field modal viết sau** |

Không H1 trùng header. Desktop không lặp dropdown trên thanh tìm.

## 7. Contract / API dự kiến

Parse `@`/`@@` **ở client**. API nhận `keyword` (không gồm `@`) + `includeHidden` / `hiddenOnly`.

GET `/customers` cần đủ field để vẽ item §12.2 (kể cả `hasMessages` hoặc `messageCount` — **chưa có trên contract hiện tại**, thêm khi làm API).

Chi tiết endpoint giữ trong contract file; không implement Nest khi modal chưa chốt.

## 8. Mock data cần có

- Có SĐT / chưa có SĐT
- Có tin nhắn / có Facebook nhưng **chưa** có tin
- Đủ 4 status; 1 ẩn; 1 ghim; 1 của NV khác
- Có lô (`lodatCount > 0`) và chưa gắn lô

## 9. Extension

- [x] Có — sau API ingest

## 10. Migrate

`tblPerson*` → `Customer*` (`MIGRATION.md`). `@`/`@@` giữ hệ cũ.

## 11. Open questions / làm sau

**Modal (chủ bảo làm sau — không đoán field):**

- Modal «Thêm khách hàng bằng SĐT»
- Modal nhỏ cập nhật SĐT (thêm / sửa / nhiều số / trùng số)
- Modal chăm sóc, confirm ẩn/khôi phục — có thể chốt cùng đợt modal

**Khác:**

- Tìm có bỏ dấu tiếng Việt? Hiện **giữ dấu**.
- Unique SĐT.
- Phân trang.
- Trang `[id]`.
- «Tạo lô đất» / «Dịch vụ sổ đỏ» từ menu: tạo bản ghi gắn khách vs chỉ nhảy trang.
- Icon mess trên mobile (rail đang ẩn): chỉ báo hay mở đâu.

---

## 12. Đặc tả màn danh sách `/khach-hang`

Cách viết **đã chốt với chủ:** đánh số, ngắn, một control một mục — dễ đọc. Hình thức (font, hangtag, dialog) = UI-GUIDELINES. Modal chi tiết = mục riêng, làm sau.

---

### 12.1 Section tìm kiếm

#### 1. Ô tìm kiếm

Input một dòng, chiếm phần lớn hàng (desktop). Placeholder:

`Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)`

Focus: viền xanh. Bắt đầu bằng `@`: viền vàng (cùng lô đất).

Gõ là lọc ngay. Enter / nút **Tìm** (mobile): chỉ đóng bàn phím, không đổi thuật toán.

##### 1.1 Tìm theo các trường sau

- **Tên** — `fullName`
- **SĐT** — `primaryPhone` và mọi `phones[].phone`
- **Nhu cầu** — `note`
- **Ghi chú** — `latestCareNote` (bản chăm sóc mới nhất)
- **Tên Facebook** — `facebook.facebookName` (nếu có)

Khớp **substring**, không phân biệt hoa thường, **có** phân biệt dấu (`hung` không khớp `hùng`). Không tìm tên NV, địa chỉ lô, toàn bộ lịch sử chat, care note cũ hơn bản mới nhất.

**Quy tắc tập khách** (sau `trim`; `@@` ưu tiên hơn `@`):

| Từ khóa | Tập tìm kiếm |
|---------|----------------|
| **Không** có `@` | Chỉ khách **đang hiển thị** — `isHidden = false` |
| Tiền tố **`@`** | Khách đang hiển thị **+** khách **đã xoá** (`isHidden = true`) |
| Tiền tố **`@@`** | **Chỉ** khách đã xoá |

Phần chữ sau `@` / `@@` (trim) mới là từ khóa field 1.1. Chỉ `@` hoặc chỉ `@@` = không lọc chữ, chỉ đổi tập ẩn/hiện.

Ownership vẫn áp: STAFF không thấy khách NV khác dù gõ `@`.

##### 1.2 Nút «Thêm khách hàng bằng số điện thoại»

- Desktop: **cùng hàng** ô tìm, bên phải.
- Mobile: **ẩn** nút trên hàng tìm; hiện nút full-width đáy trang (xanh lá).

**Bấm → mở 1 modal** tạo khách bằng SĐT.

> **Quy tắc modal (tên field, validate, trùng số, status mặc định…) làm sau.** Ở đây chỉ chốt: nút này gọi modal, không tạo khách inline.

##### 1.3 Bộ lọc (không phải ô tìm)

Desktop: icon lọc trên **tiêu đề cột** (§12.2 mục 1.1).  
Mobile: nút **Bộ lọc** cùng hàng ô tìm + Tìm; panel: trạng thái, tài chính, kênh, lô đất, nhu cầu; **Xoá lọc** không xóa chữ ô tìm.

---

### 12.2 Section bảng danh sách khách hàng

Desktop: bảng §4.5 (header cố định + thân cuộn + footer).  
Mobile: **thẻ** cùng dữ liệu mục 1.2, không cuộn ngang bảng; ẩn rail.

Bấm nền dòng/thẻ (không phải icon / menu / nút sửa) → **chọn** khách. Không điều hướng `/khach-hang/[id]`.

#### 1.1 Tiêu đề cột (desktop)

| Cột | Icon lọc trên header? |
|-----|------------------------|
| `#` | Không |
| Tên khách | Có — lọc **trạng thái** |
| Nhu cầu | Có — có nhu cầu / chưa có |
| Tài chính | Có — có ngân sách / chưa nhập |
| Kênh liên hệ | Có — FB·Messenger / SĐT·Zalo / Page / tất cả |
| Số lô đất | Có — đã gắn / chưa gắn / tất cả |
| Thao tác | Không |

#### 1.2 Item khách hàng

Một hàng (desktop) / một thẻ (mobile). Các mục 1.2.1–1.2.6 nằm **cụm Tên khách** (cạnh nhau). 1.2.7–1.2.10 là cột riêng trên desktop; mobile xếp dưới tên.

##### 1.2.1 STT (`#`)

Số thứ tự **1 … N** sau khi đã sort (ghim trước, rồi `updatedAt` mới → cũ). Không phải id CSDL. Chỉ desktop.

##### 1.2.2 Tên khách hàng

- Avatar tròn: ảnh FB, không có thì initials từ tên.
- **Tên đậm** = `fullName`.
- Dòng phụ nhạt: tên Facebook nếu có và khác tên CRM.

##### 1.2.3 Icon số điện thoại **màu đỏ**

- Lucide `Phone`, màu đỏ (không xanh mint hệ cũ, không chỉ trang trí).
- **Luôn là nút** (có hoặc chưa có số).
- **Bấm → modal nhỏ cập nhật số điện thoại** (thêm nếu chưa có / sửa số đang hiện). Không copy, không `tel:` từ icon này.
- `stopPropagation` — không kích chọn dòng.

> **Quy tắc modal SĐT làm sau** (nhiều số, số chính, trùng, gọi điện trong modal…).

##### 1.2.4 Icon mess **màu xanh**

- Lucide `MessageCircle`, màu xanh.
- **Chỉ hiện khi có nội dung tin nhắn đã lưu** (`hasMessages` / `messageCount > 0`).
- **Không** hiện chỉ vì có hồ sơ Facebook / thread trống.
- Việc: **thể hiện có tin**. Bấm (desktop): chọn khách + mở rail **Nội dung chat**. Mobile: rail đang ẩn — tạm thời chỉ hiển thị icon; chỗ mở tin trên mobile chốt sau.

##### 1.2.5 Hangtag trạng thái khách

Một hangtag: **Khách nét** · **Khách mới** · **Khách cần chăm sóc** · **Khác** (bảng mục 3). Tone UI-GUIDELINES §4.5.4.

Khách đang xem trong tập đã xoá (`@` / `@@`): thêm hangtag xám **Đã xoá**.

##### 1.2.6 Icon đếm số lô đất

- Lucide `Map` + số `lodatCount`.
- **Chỉ hiện khi `lodatCount > 0`**.
- Việc: báo đã gắn bao nhiêu lô. P1 **không** bấm để sang `/lo-dat`.
- Cột **Số lô đất** (desktop) vẫn hiện số, kể cả `0`.

##### 1.2.7 Nhu cầu

Cột / dòng thẻ: `note`. Trống → `—` (desktop) hoặc ẩn dòng (mobile). Không lấy care note.

##### 1.2.8 Tài chính

`budgetMinVnd` / `budgetMaxVnd` → khoảng «tỷ / triệu» class `crm-money`. Cả hai null → `—` (desktop) hoặc ẩn (mobile).

##### 1.2.9 Kênh liên hệ

1. Có SĐT label chứa `zalo` → `{số} ({label})`
2. Không thì `scanSource` `page` / `business_suite` → `Page {tên}`
3. Không thì tên nhân viên phụ trách

##### 1.2.10 Thao tác

Nút vuông chevron → **một** menu. Dòng đang mở menu: nền vàng nhạt.

| Mục | Việc (P1) | Modal? |
|-----|-----------|--------|
| Mở chat | Rail «Nội dung chat» (desktop) | Không |
| Mở Messenger | Tab `facebook.com/messages/t/{threadId}`; thiếu thread → alert | Alert |
| Cập nhật chăm sóc | Mở form ghi chú | **Modal — quy tắc sau** |
| Tạo lô đất | Chưa tạo bản ghi; toast / làm ở `/lo-dat` | Sau |
| Dịch vụ sổ đỏ | Điều hướng `/dich-vu-so-do` | Sau nếu tạo hồ sơ |
| Ghim / Bỏ ghim | Đổi `isPinned` | Không |
| Xóa khách | Ẩn `isHidden = true` | Confirm — quy tắc copy sau |
| Khôi phục khách | Chỉ khi item đã xoá (`@`/`@@`) → `isHidden = false` | Confirm sau |

Khách đã xoá: menu **chỉ** khôi phục (không ghim/xóa lại).

Mobile thêm nút `SquarePen` cạnh chevron = cùng «Cập nhật chăm sóc».

#### 1.3 Footer

- Desktop: `Hiển thị N / Tổng M khách hàng`
- Mobile: `All` · `KN` · `KM` · `CCS` · `KH` · `ĐG` (ghim) — đếm trên **tập đang hiện**

#### 1.4 Trạng thái dòng

| Trạng thái | Hình |
|------------|------|
| Ghim | Nền vàng `#fef9c3` (mobile + viền trái `#ca8a04`) |
| Đang chọn | Theo §4.5.3 |
| Đã xoá | Vẫn hiện đủ 1.2 khi đang `@`/`@@`; hangtag Đã xoá |

Sort: `isPinned` trước, rồi `updatedAt` giảm dần.

---

### 12.3 Rail phải (desktop)

Ba thanh: **Nội dung chat** · **Lịch sử chăm sóc** · **Danh sách lô đất**.

**Một panel** tại một thời điểm. Chưa chọn dòng → «Chọn một khách trên bảng để xem.» Mobile: ẩn rail.

---

*Bước tiếp: chủ đọc §12 — thiếu mục thì bổ sung cùng format 1.2.x. Khi §12 đủ, mới viết quy tắc từng modal, rồi CSDL/API.*
