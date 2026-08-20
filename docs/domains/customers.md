# Domain: Customers (Khách hàng)

- **Slug:** `customers`
- **Status:** Ready for API — list `/khach-hang` staging có kênh, avatar, SĐT, nhu cầu; form chăm sóc đã deploy
- **Nguồn nghiệp vụ:** CRM đang chạy [`/khach-hang`](https://crm.anhungland.com/khach-hang) (repo `facebookcustomercrm` — đọc hiểu, không copy god-file)
- **UI visual mới:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.1–4.3.4
- **Contract:** `packages/shared/src/customers.ts`

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần. Hình thức (font, hangtag) không lặp ở đây.

---

## 1. Mục đích

Nhân viên tìm / chăm sóc khách (Messenger hoặc nhập SĐT), gắn lô, xem chat đã lưu.

## 2. Actors

| Actor | List | Không |
|-------|------|--------|
| STAFF | Khách của mình | Khách NV khác; tạo lô khi là admin; hard-delete |
| ADMIN | Tất cả; sửa/xoá SĐT; không tạo lô từ menu | Hard-delete P1 |

## 3. Khái niệm

| Thứ | CRM cũ | List hiện |
|-----|--------|-----------|
| Nhu cầu | `NeedSummary` (care) | Cột Nhu cầu = bản mới nhất |
| Ghi chú | `Note` (care) | Ô tìm; rail lịch sử |
| Đã xoá | `isHidden` | Soft-hide |
| Hangtag | KN / KM / CCS / Khác | Mục 3 UI-GUIDELINES |

## 4–10. (API / mock / migrate)

Giữ contract list. **GET `/api/v1/customers`** — STAFF khách mình, ADMIN tất cả. Staging đã có: tên, trạng thái, tài chính, ghim/ẩn, kênh (hotline hoặc profile FB NV), avatar CDN, SĐT, nhu cầu. **POST `/api/v1/customers/:id/care-notes`** — cập nhật trạng thái + ngân sách trên khách; append `NeedSummary`/`Note` nếu khác lần gần nhất. Extension: phase sau.

## 11. Còn thiếu / chưa đúng so với CRM cũ

Đối chiếu mock [`anhungland.com/khach-hang`](https://anhungland.com/khach-hang) với CRM đang chạy [`crm.anhungland.com/khach-hang`](https://crm.anhungland.com/khach-hang).  
Hành vi đích = **§12**. Làm dần theo số.

Khung list đã có: ô tìm `@`/`@@`, lọc trạng thái, ghim, ẩn mềm, thêm khách (tên + SĐT), rail 3 panel (dữ liệu tĩnh), menu 7 mục.

1. **Dữ liệu thật** — list `/khach-hang` đọc Postgres (tên, trạng thái, tài chính, ghim, kênh, avatar, SĐT, nhu cầu). Staging đã copy.
2. **Form cập nhật chăm sóc** — trạng thái, nhu cầu, tài chính (chip), ghi chú. Có trên staging (modal PC / trang mobile).
3. **Double-click dòng (máy tính)** — mở modal chăm sóc. Có trên staging.
4. **Trang chi tiết `/khach-hang/[id]`** — SĐT, tài chính, lô, lịch sử chăm sóc. Hiện placeholder.
5. **Trang `/khach-hang/[id]/cham-soc`** (điện thoại). Có trên staging.
6. **Tạo lô đất từ khách** — STAFF → `/khach-hang/[id]/them-lo-dat`. Hiện toast. ADMIN: không được tạo (ẩn / báo).
7. **Tạo hồ sơ sổ đỏ từ khách** — `/khach-hang/[id]/dich-vu-so-do`. Hiện nhảy list `/dich-vu-so-do` chung.
8. **SĐT xanh (máy tính)** — bấm = copy số (tick tạm). Có trên staging khi khách có số.
9. **SĐT xanh (điện thoại)** — bấm = `tel:`. Có trên staging khi khách có số.
10. **SĐT cam khi chưa có số** — bấm = modal thêm SĐT.
11. **Xoá SĐT (admin)** — thùng rác + modal.
12. **Sửa tên khách** — bút trên tên (máy tính).
13. **Sửa tên Facebook (admin)** — bút trên tên FB (máy tính).
14. **Thêm khách bằng SĐT đủ field** — hotline *, tên *, SĐT *, ghi chú. Chưa có hotline → Cài đặt SĐT.
15. **Trùng số điện thoại** — modal xác nhận / gộp hồ sơ.
16. **Khôi phục khách đã ẩn** — menu chỉ còn «Khôi phục khách».
17. **Nhu cầu trên list = `NeedSummary` mới nhất** (care, không rỗng). Có trên staging (237 khách có lịch sử).
18. **Tìm trong mọi lần chăm sóc** — nhu cầu + ghi chú. Có trên staging.
19. **Lọc tài chính** — chưa có / đã có / dưới 1 tỷ / 1–2 tỷ / trên 2 tỷ. Hiện chỉ có / chưa nhập.
20. **Lọc kênh liên hệ** — page FB + hotline thật của NV. Hiện Facebook / SĐT / Page giả.
21. **Mở chat** — tab Facebook Inbox (máy tính). Hiện chỉ mở rail, chat mock.
22. **Rail danh sách lô** — thẻ lô, bấm → `/lo-dat/[id]`. Hiện list tĩnh.
23. **Icon Map + số lô cạnh tên** — không cột «Số lô đất»; **không** icon mess trên item (chat = rail + menu).
24. **Tải thêm ~50 dòng khi cuộn** + nhớ vị trí/lọc khi quay lại list.
25. **Hangtag «Tự khôi phục»** khi extension kéo lại khách đã ẩn.
26. **Quản trị khách (admin)** — xóa cứng / registry. Trang `/quan-tri/khach-hang` còn placeholder P4.

---

## 12. List `/khach-hang` — theo CRM đang chạy

Thứ tự mỗi trang: **12.1 máy tính** → **12.2 mobile** → trong từng khối mới chi tiết thành phần. Không ghi «PC: … Mobile: …» trong cùng một mục.

---

### 12.1 Giao diện máy tính

```
┌ Ô tìm + nút Thêm SĐT ────────────────────────────────────────┐
├ Bảng: # · Tên khách · Nhu cầu · Tài chính · Kênh · Thao tác ─┤
├ Footer đếm ──────────────────────────────────────────────────┤
└ Rail phải: chat | chăm sóc | lô đất (một panel) ─────────────┘
```

**Không** cột Số lô — lô = icon trên tên.

**Bấm nền dòng** → chọn (rail).  
**Double-click dòng** → modal chăm sóc (trừ khách đã xoá / trừ khi bấm icon).

#### 12.1.1 Ô tìm kiếm

Placeholder: `Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)`

Gõ → debounce ~250ms rồi lọc.

`@` / `@@` trên ô: badge + viền vàng.

##### 1. Tìm theo

- Tên CRM
- Tên Facebook
- Mọi SĐT
- Nhu cầu (`NeedSummary`) **và** ghi chú (`Note`) trong **mọi** lần chăm sóc

Substring, không phân biệt hoa thường (kể cả Á/á). **Giữ dấu** (`hung` ≠ `hùng`).

Không `@` → chỉ khách đang hiện.  
`@` → hiện + đã xoá.  
`@@` → chỉ đã xoá.

STAFF không thấy khách người khác.

#### 12.1.2 Nút Thêm khách hàng bằng SĐT

Cùng hàng ô tìm, bên phải.

Bấm → modal **Thêm khách hàng bằng số điện**: hotline * (bắt buộc), tên *, SĐT * (`0` + 9 số), ghi chú. Trùng SĐT → modal xác nhận. Chưa có hotline → bảo vào Cài đặt SĐT.

#### 12.1.3 Bộ lọc

CRM cũ: select trên thanh lọc. Mock mới: icon cột (cùng nghĩa).

- Trạng thái
- Tài chính: chưa có / đã có / dưới 1 tỷ / 1–2 tỷ / trên 2 tỷ
- Kênh liên hệ: danh sách page FB + hotline của NV (API)
- Lô đất: tất cả / chưa gắn
- Nhu cầu: tất cả / chưa có nhu cầu

#### 12.1.4 Item (dòng bảng)

##### 1. STT

`#` 1…N. Ghim trước, rồi mới cập nhật.

##### 2. Tên

Avatar (ảnh FB / trống). Tên đậm.  
Icon bút → modal **Sửa tên khách**.

##### 3. Icon SĐT **xanh** (`#047857`)

Hiện khi **đã có** SĐT. Bấm → copy số (tick tạm).

##### 4. Icon SĐT **cam** (`#ea580c`)

Hiện khi **chưa có** SĐT (và chưa xoá).  
Bấm → modal **Thêm số điện thoại**. Trùng → modal trùng.

##### 5. Icon thùng rác SĐT

Chỉ **admin**, khách chưa xoá, đã có số.  
Bấm → modal **Xoá số điện thoại**.

##### 6. Icon Map + số lô

Chỉ khi `lodatCount > 0`. Chỉ thể hiện, không điều hướng.

##### 7. Hangtag trạng thái

Khách nét / mới / cần chăm sóc / Khác.

Đã xoá: thêm hangtag **Đã xoá**.

##### 8. Tên Facebook (dòng phụ)

Hiện nếu khác tên CRM, hoặc admin + có FB.  
Admin: bút → modal **Sửa tên Facebook**.

##### 9. Nhu cầu

`latestNeedSummary`. Trống → `—`.

##### 10. Tài chính

Khoảng ngân sách. Trống → `—`.

##### 11. Kênh liên hệ

Page/nick FB của NV **hoặc** hotline (SĐT + nhãn).

##### 12. Menu thao tác (chevron)

Một menu. Khách đã xoá: **chỉ** «Khôi phục khách».

| Mục | Việc |
|-----|------|
| Mở chat | Có URL Inbox: tab Facebook messages |
| Mở Messenger | Tab `messenger.com/t/…` (thread hoặc uid) |
| Cập nhật chăm sóc | Modal. Form: trạng thái, nhu cầu, tài chính (chip), ghi chú |
| Tạo lô đất | STAFF → `/khach-hang/[id]/them-lo-dat`. ADMIN: báo không được tạo |
| Dịch vụ sổ đỏ | `/khach-hang/[id]/dich-vu-so-do` |
| Ghim / Bỏ ghim | `isPinned` |
| Xóa khách | Confirm ẩn mềm; tìm lại bằng `@` / `@@` |

##### 13. Ghim / chọn / ẩn

Ghim: nền vàng. Đang chọn: highlight. Đã xoá: hàng kiểu ẩn.

#### 12.1.5 Footer

Tổng N — hoặc Hiển thị n / Tổng N khi còn trang. Tải thêm ~50 dòng khi cuộn.

#### 12.1.6 Rail phải

Một panel: **Nội dung chat** (tin đã lưu) · **Lịch sử chăm sóc** · **Danh sách lô đất**.  
Nhớ panel vừa mở (localStorage).

---

### 12.2 Giao diện mobile

```
┌ Ô tìm ───────────────────────────────────────────────────────┐
├ [Bộ lọc] [Tìm] ──────────────────────────────────────────────┤
├ Thẻ xếp dọc ─────────────────────────────────────────────────┤
├ Footer All · KN · KM · CCS · KH · ĐG ────────────────────────┤
└ Nút Thêm SĐT dính đáy ───────────────────────────────────────┘
```

Không bảng, không rail.

**Bấm thẻ** → `/khach-hang/[id]`.

#### 12.2.1 Ô tìm + nút Tìm

Placeholder và quy tắc field / `@` / `@@` / STAFF: **cùng 12.1.1**.

Nút **Tìm** = lọc ngay + đóng bàn phím.

#### 12.2.2 Bộ lọc

Nút **Bộ lọc** (sheet) + **Tìm**. Cùng nghĩa 12.1.3. Xoá lọc.

#### 12.2.3 Nút Thêm SĐT (đáy)

Cùng modal 12.1.2.

#### 12.2.4 Item (thẻ)

##### 1. Avatar + tên

Tên đậm. **Không** bút sửa tên trên thẻ.

##### 2. Icon SĐT **xanh** (`#047857`)

Hiện khi **đã có** SĐT. Bấm → `tel:`.

##### 3. Icon SĐT **cam** (`#ea580c`)

Cùng 12.1.4 mục 4 (modal thêm số).

##### 4. Icon thùng rác SĐT

Cùng 12.1.4 mục 5 (admin).

##### 5. Icon Map + số lô

Cùng 12.1.4 mục 6.

##### 6. Hangtag trạng thái

Cùng 12.1.4 mục 7.

##### 7. Tên Facebook (dòng phụ)

Cùng điều kiện 12.1.4 mục 8. **Không** bút sửa FB trên thẻ.

##### 8. Nhu cầu

`latestNeedSummary`. Trống → **ẩn**.

##### 9. Tài chính

Khoảng ngân sách. Trống → **ẩn**.

##### 10. Kênh liên hệ

Page/nick FB hoặc hotline. Chữ thuần, không link.

##### 11. Nút sửa

`SquarePen` → `/khach-hang/[id]/cham-soc`. Ẩn nếu đã xoá.

##### 12. Menu thao tác (chevron)

Một menu. Khách đã xoá: **chỉ** «Khôi phục khách».

| Mục | Việc |
|-----|------|
| Mở chat | **Không** (không Inbox tab trên điện thoại) |
| Mở Messenger | Tab `messenger.com/t/…` |
| Cập nhật chăm sóc | Trang `/khach-hang/[id]/cham-soc`. Form: trạng thái, nhu cầu, tài chính (chip), ghi chú |
| Tạo lô đất | STAFF → `/khach-hang/[id]/them-lo-dat`. ADMIN: báo không được tạo |
| Dịch vụ sổ đỏ | `/khach-hang/[id]/dich-vu-so-do` |
| Ghim / Bỏ ghim | `isPinned` |
| Xóa khách | Confirm ẩn mềm; tìm lại bằng `@` / `@@` |

##### 13. Ghim / ẩn

Ghim: nền vàng. Đã xoá: thẻ kiểu ẩn.

#### 12.2.5 Footer

All · KN · KM · CCS · KH · ĐG (trên trang đang nạp).

---

### 12.3 Chi tiết `/khach-hang/[id]`

Placeholder. Chăm sóc = **§12.4**.

### 12.4 Cập nhật chăm sóc

Cùng form. Máy tính = modal; điện thoại = trang `/khach-hang/[id]/cham-soc`. Không mở với khách đã ẩn.

#### 12.4.1 Máy tính

Double-click dòng (trừ icon/nút) hoặc menu **Cập nhật chăm sóc** → CrmDialog. Tiêu đề `Cập nhật chăm sóc — {tên}`.

#### 12.4.2 Mobile

Nút bút trên thẻ / menu → `/khach-hang/[id]/cham-soc`. Huỷ = về list.

#### 12.4.3 Field

1. Trạng thái — KN / KM / CCS / Khác
2. Nhu cầu — textarea, prefill `latestNeedSummary`, tối đa 500
3. Tài chính — chip `500tr–1 tỷ` / `1–1,5` / `1,5–2` / `2–2,5 tỷ` + **Chưa xác định**. Khoảng lẻ (không khớp chip) hiện thêm 1 chip đúng số đang có.
4. Ghi chú — textarea, prefill `latestCareNote`, tối đa 1000

Lưu: ghi đè status + budget trên khách. Need/Note chỉ **thêm dòng** lịch sử nếu khác lần gần nhất. Không đổi gì → không ghi, toast «Không có thay đổi».

---

## 13. Copy dữ liệu

Chi tiết thứ tự: [`MIGRATION.md`](../MIGRATION.md) — **một bảng / một PR**.

### 13.1 Khách cơ bản — đã copy staging

`tblPerson` → `Customer` + map entity `customer`.

Copy: `employeeId` (qua map `user`), tên, trạng thái, tài chính (`BIGINT` — có khách 2,5 tỷ, vượt INT4), `note` (cột dư trên khách), ẩn, ghim + `pinnedAt`, `autoRestoredAt`, ngày tạo/sửa.

Lúc copy: `sourceHotlineId` = null (FK cho phép trống). Gắn nguồn ở **§13.3** sau khi có bảng hotline.

**Không** copy cùng lúc: SĐT, Facebook, lịch sử chăm sóc, tin nhắn, ảnh, lô.

### 13.2 Đã chốt (2026-08-20)

Freeze: NV ngừng sửa CRM cũ; Extension tắt. Chỉ đọc SQLite.

| # | Quyết định |
|---|----------------|
| Chủ hồ sơ | `EmployeeId` → map `user`. Lúc freeze: 0 khách mồ côi. Nếu có → bỏ + log. |
| Khách ẩn | Copy cả. |
| Ghim | `IsPinned` + `PinnedAtMs` → `isPinned` + `pinnedAt`. |
| Tự khôi phục | `AutoRestoredAtMs` → `autoRestoredAt`. |
| `tblPerson.Note` | Cột dư. Copy vào `Customer.note` (5 khách lúc freeze). Cột Nhu cầu = lịch sử — **sau**. |
| Trạng thái + tài chính | Snapshot trên khách. |
| Hotline nguồn | Copy **hết** hotline (kể cả tắt) rồi gắn `sourceHotlineId`. 22 khách lúc freeze có nguồn. |
| Trùng SĐT 2 NV | Giữ nguyên khi copy SĐT (cùng số trên 2 hồ sơ = 2 dòng). Lúc freeze: 0. |
| Đã gộp trên CRM cũ | Copy trạng thái hiện tại. |
| Chạy lại script | Idempotent. |

Lúc freeze: 1401 khách (292 ẩn, 16 ghim, 8 tự khôi phục), 3 hotline.

### 13.3 Slice này — hotline nguồn

`tblEmployeeHotline` → `EmployeeHotline` + map `employee_hotline`.  
Rồi `tblPerson.SourceHotlineId` → `Customer.sourceHotlineId` (map hotline + map khách).

`sourceHotlineId` là FK optional → copy hotline sau khách rồi UPDATE vẫn hợp lệ. Copy cả hotline tắt.

### 13.4 Slice này — profile Facebook NV + metadata khách

Kênh liên hệ trên list = **hotline nguồn** hoặc **tên profile/page NV** (`EmployeeFacebookUid` → `NameProfile`).

`tblEmployeeFacebookProfiles` → `EmployeeFacebookProfile` (9 nick, map `employee_facebook_profile`).  
`tblPersonFacebook` → `CustomerFacebook` (UID NV, tên nick khách, thread, scanSource). 1378 khách có FB; 22 chỉ hotline; 1 không kênh.

Cột `/khach-hang` hiện tên như CRM cũ: `Page Bùi Xuân Khả`, `Khả Khánh Hà`, `Em Hà - BĐS Nam Sách 85`, …

### 13.5 Slice này — avatar khách lên R2

CRM cũ mirror avatar Facebook xuống `/var/www/anhungland-crm/api/img/avatars` (1376 file local, 2 khách không ảnh, ~5,3 MB). Bucket public R2 `anhungland-crm` + CDN `cdn.anhungland.com`.

Script **chỉ đọc** disk cũ → `customers/avatars/<tên file>` → `CustomerFacebook.avatarObjectKey`. List trả `avatarUrl` = URL CDN. Không xóa file cũ. Chưa copy ảnh chat (~409 MB) / ảnh lô (~451 MB).

### 13.6 Slice này — số điện thoại

`tblPersonPhone` → `CustomerPhone` + map `customer_phone`. Cần map `customer`.

Lúc freeze: **152** số (152 khách; 1249 khách không SĐT). Mỗi khách tối đa 1 số. Label trống. Format `0` + 9 chữ số. Trùng 2 NV: 0.

Copy nguyên số + `sortOrder`. Số chính trên list = `ORDER BY sortOrder ASC, createdAt ASC` (CRM cũ: `SortOrder, ID`). Ô tìm list cũng khớp `phones.phone`.

Máy tính: icon Phone **xanh** `#047857` → copy + tick ~1,5s. Điện thoại: `tel:` (đã có). **Không** nối icon cam / thêm khách bằng SĐT / xoá số (mục 10–11, 14–15).

Script: `pnpm phones:migrate-legacy`. **Xong staging (152/152).**

### 13.7 Slice này — nhu cầu (lịch sử chăm sóc)

`tblPersonCareHistory` → `CustomerCareNote` + map `customer_care`. Cần map `customer` + `user`.

Lúc freeze: **266** dòng / **237** khách có lịch sử (215 một lần, 18 hai lần, 4 nhiều hơn). Mọi dòng đều có `NeedSummary` (max 94 ký tự). 86 dòng có `Note`. 0 NV trống. Bảng cũ **không** có cột ngân sách / Source trên history — ngân sách list vẫn lấy snapshot trên `Customer`.

Cột Nhu cầu list = `NeedSummary` mới nhất **không rỗng** (`CreatedAtMs DESC, ID DESC`) — cùng CRM cũ. Ghi chú mới nhất (`Note`) → `latestCareNote` (rail). Ô tìm khớp mọi `NeedSummary` + `Note`.

Rail **Lịch sử chăm sóc** đọc `GET /customers/:id` (nhu cầu + ghi chú). Slice copy **không** bật form cập nhật (mục 2) — form = **§13.8**.

Script: `pnpm care:migrate-legacy`. **Xong staging (266/266 dòng, 237 khách).**

### 13.8 Slice này — form cập nhật chăm sóc

`POST /api/v1/customers/:id/care-notes` `{ status, budgetMinVnd, budgetMaxVnd, needSummary?, note? }`. Ownership cùng GET/PATCH. Khách đã ẩn: không mở form / API từ chối.

- Ghi đè `Customer.status` + `budgetMin`/`MaxVnd`.
- Append `CustomerCareNote` **chỉ khi** nhu cầu hoặc ghi chú khác lần gần nhất **và** ít nhất một trong hai không rỗng. Ô trống không xóa lịch sử cũ.
- Không đổi gì → `{ unchanged: true }`, toast «Không có thay đổi. Bỏ qua cập nhật.»
- Chip tài chính: 4 khoảng + **Chưa xác định**. Khoảng lẻ (không khớp chip) hiện thêm 1 chip đúng số đang có — lưu không bị ghi đè chip chuẩn.

Máy tính: double-click dòng / menu → CrmDialog. Điện thoại (`max-width: 767px`): `/khach-hang/[id]/cham-soc`. **Xong staging (2026-08-20).**

---

*Web mới: Lucide + CrmDialog, cùng hành vi trên. Không copy CSS/god-file CRM cũ.*
