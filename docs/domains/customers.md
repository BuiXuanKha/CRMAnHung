# Domain: Customers (Khách hàng)

- **Slug:** `customers`
- **Status:** Ready for API — list `/khach-hang` + chi tiết `[id]` trên anhungland.com; **lô đất list/cột phụ/chi tiết = API**; **tạo lô từ khách** STAFF = form `/khach-hang/[id]/them-lo-dat`.
- **Nguồn nghiệp vụ:** CRM đang chạy [`/khach-hang`](https://crm.anhungland.com/khach-hang) (repo `facebookcustomercrm` — đọc hiểu, không copy god-file)
- **UI visual mới:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.1–4.3.4
- **Contract:** `packages/shared/src/customers.ts`

§12 = đặc tả list. Mỗi trang: **máy tính** → **mobile** → rồi chi tiết từng phần. Hình thức (font, hangtag) không lặp ở đây.

---

## 1. Mục đích

Nhân viên tìm / chăm sóc khách (Messenger hoặc nhập SĐT), gắn lô, xem **tin đã lưu**.  
**Không** nhúng Inbox Facebook sống trong CRM — xem §11 mục 27.

## 2. Actors

| Actor | List | Không |
|-------|------|--------|
| STAFF | Khách của mình; **sửa/xoá SĐT** của khách mình | Khách NV khác; tạo lô khi là admin; hard-delete; **không** sửa tên Facebook tay |
| ADMIN | Tất cả khách (cùng thao tác SĐT trên khách đang xem) | Hard-delete / registry — **chưa làm**; **không** sửa tên Facebook tay |

## 3. Khái niệm

| Thứ | CRM cũ | List hiện |
|-----|--------|-----------|
| Nhu cầu | `NeedSummary` (care) | Cột Nhu cầu = bản mới nhất không rỗng |
| Ghi chú chăm sóc | `Note` (care) | Form chăm sóc; cột phụ lịch sử; trang chi tiết |
| `Customer.note` | `tblPerson.Note` (cột dư) | Copy 5 khách. **Không hiện** list/chi tiết. Ô tìm API vẫn khớp |
| Đã xoá | `isHidden` | Soft-hide |
| Hangtag | KN / KM / CCS / Khác | Mục 3 UI-GUIDELINES |
| Tin đã lưu | Scan extension + copy | Cột phụ **Nội dung chat** (`messageCount`) |
| Inbox Facebook sống | Inbox Meta realtime | **Chưa làm** (§11 mục 27) |

## 4–10. (API / mock / migrate)

Giữ contract list. **GET `/api/v1/customers`** — STAFF khách mình, ADMIN tất cả. `limit` mặc định 50, `offset` từ 0, `total` = COUNT. Mỗi dòng: `lodatCount`, `messageCount` (tin đã lưu), `careNoteCount` (lần chăm sóc) — cột phụ ẩn thanh khi = 0. Staging đã có: tên, trạng thái, tài chính, ghim/ẩn, kênh, avatar CDN, SĐT, nhu cầu, form chăm sóc. **GET `/api/v1/customers/:id/messages`** — tin đã lưu + URL ảnh R2 (cột phụ). **POST `/api/v1/customers/:id/care-notes`** — cập nhật trạng thái + ngân sách; append care nếu khác lần gần nhất. **POST `/api/v1/customers/:id/phones`** — thêm SĐT khi khách chưa có số (SĐT cam). **POST `/api/v1/customers`** — thêm khách bằng SĐT (hotline + tên + số + ghi chú). **GET `/api/v1/customers/contact-channels`** — lọc kênh. **POST `/api/v1/customers/from-extension`** — ingest scan + tin; ảnh chat + avatar raster → WebP (`storage.upload`). Scanner Chrome vẫn stub. **Không** API inbox Meta sống.

## 11. Còn thiếu / chưa đúng so với CRM cũ

Đối chiếu CRM mới [`anhungland.com/khach-hang`](https://anhungland.com/khach-hang) với CRM cũ [`crm.anhungland.com/khach-hang`](https://crm.anhungland.com/khach-hang).  
Hành vi đích = **§12**. Làm dần theo số.

Khung list đã có: ô tìm `@`/`@@`, lọc (icon cột / Bộ lọc mobile), ghim, ẩn mềm + khôi phục tay, thêm khách (tên + SĐT), cột phụ (ẩn thanh trống), menu thao tác.

**Lô đất trên list / cột phụ / chi tiết — API** (đếm map active, cột phụ + thẻ chi tiết). **Tạo lô từ khách** (mục 6) — STAFF form `/khach-hang/[id]/them-lo-dat`.

**Ba chỗ Facebook — đừng lẫn:**

| Chỗ | Là gì | Trạng thái |
|-----|--------|------------|
| Cột phụ **Nội dung chat** | Tin **đã lưu** (copy CRM cũ + ingest). Ẩn nếu `messageCount = 0` | **Có** (mục 21) |
| Menu **Mở chat** / **Mở Messenger** | Tab **ngoài** (Page → Business Suite `pageUrl`; E2EE → `/messages/e2ee/t/…`; còn lại `facebook.com/messages` · `messenger.com`) | **Có** (mục 21) |
| **Inbox Facebook sống** | Hội thoại Meta **đang chạy** nhúng trong CRM (như Business Suite Inbox) | **Chưa làm** (mục 27) |

**Hàng đợi còn lại (chốt 2026-08-24, cập nhật 2026-08-30)** — không làm cho đến khi chủ bảo:

| TT | Việc | Quyết định |
|----|------|------------|
| 1 | Menu khôi phục khách ẩn (§11 mục 16) | **Xong.** «Khôi phục khách» → `PATCH isHidden: false`. |
| 2 | Tạo hồ sơ sổ đỏ từ khách (§11 mục 7) | **Xong.** Form `/khach-hang/[id]/dich-vu-so-do`. |
| 3 | Xoá / sửa SĐT (§11 mục 11) | **Xong.** Menu → modal quản lý nhiều số (thêm/sửa/xoá); FAB gọi: 1 số thẳng, ≥2 chọn số. |
| 4 | Sửa tên Facebook (§11 mục 13) | **Không làm.** Tên FB nhận từ extension khi scan; không modal sửa tay. |
| 5 | Hangtag «Tự khôi phục» (§11 mục 25) | **Xong.** Extension scan khách ẩn → `isHidden: false` + `autoRestoredAt`; hangtag list/chi tiết. |
| 6 | Inbox Facebook sống (§11 mục 27) | **Chưa làm; cần bàn.** Không phải cột phụ chat, không phải menu Mở chat. |
| 7 | Quản trị khách / hard-delete (§11 mục 26) | **Chưa làm** (phần admin). |

1. **Dữ liệu thật** — list `/khach-hang` đọc Postgres (tên, trạng thái, tài chính, ghim, kênh, avatar, SĐT, nhu cầu). Staging đã copy.
2. **Form cập nhật chăm sóc** — trạng thái, nhu cầu, tài chính (chip), ghi chú. Có trên staging (modal PC / trang mobile).
3. **Double-click dòng (máy tính)** — mở modal chăm sóc. Có trên staging.
4. **Trang chi tiết `/khach-hang/[id]`** — SĐT, tài chính, lịch sử chăm sóc, **danh sách lô** (API). Có trên staging.
5. **Trang `/khach-hang/[id]/cham-soc`** (điện thoại). Có trên staging.
6. **Tạo lô đất từ khách** — STAFF → `/khach-hang/[id]/them-lo-dat` (**form đã có** — lodats.md §12.5). ADMIN: CrmAlert không tạo từ khách.
7. **Tạo hồ sơ sổ đỏ từ khách** — `/khach-hang/[id]/dich-vu-so-do` (title-services.md §12.4). STAFF + ADMIN. Khách ẩn → không tạo. Lưu → list `/dich-vu-so-do?id=`.
8. **SĐT xanh (máy tính)** — bấm = copy số (tick tạm). Có trên staging khi khách có số.
9. **SĐT xanh (điện thoại)** — bấm = `tel:`. Có trên staging khi khách có số.
10. **SĐT cam khi chưa có số** — bấm = modal thêm SĐT. Có trên staging. Trùng số → modal mục 15.
11. **Xoá / sửa SĐT** — menu Thao tác (không icon thùng rác trên dòng). **Xong.** NV phụ trách khách. Icon cam vẫn thêm nhanh khi chưa có số.
12. **Sửa tên khách** — bút trên tên (máy tính). Có trên staging.
13. **Sửa tên Facebook** — **không làm.** Không bút / modal sửa tay. Tên FB (`facebookName`) do **extension** ghi khi scan.
14. **Thêm khách bằng SĐT đủ field** — hotline *, tên *, SĐT *, ghi chú. Chưa có hotline → Cài đặt SĐT. Có trên staging.
15. **Trùng số điện thoại** — modal xác nhận / gộp hồ sơ. Có trên staging.
16. **Khôi phục khách đã ẩn** — menu chỉ còn «Khôi phục khách» → `PATCH isHidden: false` (xoá `autoRestoredAt`). **Xong.** Tìm lại bằng `@` / `@@`. Extension tự khôi phục = mục 25.
17. **Nhu cầu trên list = `NeedSummary` mới nhất** (care, không rỗng). Có trên staging (237 khách có lịch sử).
18. **Tìm trong mọi lần chăm sóc** — nhu cầu + ghi chú. Có trên staging.
19. **Lọc tài chính** — chưa có / đã có / dưới 1 tỷ / 1–2 tỷ / trên 2 tỷ. Có trên staging.
20. **Lọc kênh liên hệ** — page FB + hotline thật của NV. Có trên staging.
21. **Cột phụ Nội dung chat** — tin **đã lưu** + ảnh R2. Có trên staging. Ẩn thanh khi `messageCount = 0`. Menu **Mở chat** / **Mở Messenger** = tab ngoài (Page dùng URL Business Suite; E2EE / Messenger thường dùng `facebook.com/messages…`), **không** mở cột phụ, **không** phải inbox sống.
22. **Cột phụ danh sách lô** — thẻ: ảnh trái (+N) · tiêu đề · địa chỉ · DT·MT·hướng · giá. Bấm ảnh → gallery; bấm chữ → `/lo-dat/[id]`. **API** (`GET /customers/:id/lodats`). Ẩn thanh khi `lodatCount = 0`.
23. **Icon Map + số lô cạnh tên** — không cột «Số lô đất»; lọc lô = icon trên cột Tên; **không** icon mess trên item. **API `lodatCount`.**
24. **Tải thêm 50 dòng khi cuộn** + nhớ vị trí/lọc khi rời list — đặc tả **§12.1.5**. Có trên staging.
25. **Hangtag «Tự khôi phục»** khi extension kéo lại khách đã ẩn. **Xong.** `from-extension` set `isHidden: false` + `autoRestoredAt`. Ẩn/khôi phục tay xoá hangtag.
26. **Quản trị khách (admin)** — xóa cứng / registry. Trang `/quan-tri/khach-hang` còn placeholder. **Chưa làm** (chốt 2026-08-24).
27. **Inbox Facebook sống** — hội thoại Meta realtime **trong** CRM (CRM cũ: extension quét `business.facebook.com/latest/inbox`). **Chưa làm.** Không nhầm với mục 21. Cần bàn: iframe / cửa sổ phụ / chỉ dựa extension + tin đã lưu. Scanner `apps/extension` vẫn stub.

---

## 12. List `/khach-hang` — theo CRM đang chạy

Thứ tự mỗi trang: **12.1 máy tính** → **12.2 mobile** → trong từng khối mới chi tiết thành phần. Không ghi «PC: … Mobile: …» trong cùng một mục.

---

### 12.1 Giao diện máy tính

```
┌ Ô tìm + nút Thêm SĐT ────────────────────────────────────────┐
├ Bảng: # · Tên khách · Nhu cầu · Tài chính · Kênh · Thao tác ─┤
├ Footer đếm ──────────────────────────────────────────────────┤
└ Cột phụ: chat | chăm sóc | lô đất (ẩn thanh trống) ─┘
```

**Không** cột Số lô — lô = icon trên tên.

**Bấm nền dòng** → chọn (cột phụ).  
**Double-click dòng** → modal chăm sóc (trừ khách đã xoá / trừ khi bấm icon).

#### 12.1.1 Ô tìm kiếm

Placeholder: `Tìm tên, SĐT, Facebook, UID, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)`

Gõ → debounce ~250ms rồi lọc.

Hangtag **Clear** (`CrmBadge` gray) hiện **ngay sau con trỏ** khi ô không trống. Bấm → xoá hết từ khoá, giữ focus. Chữ tràn → hangtag dính mép phải phần đang thấy.

`@` / `@@` trên ô: badge + viền vàng (vẫn hiện Clear).

##### 1. Tìm theo

- Tên CRM (`fullName`)
- Mọi SĐT
- `Customer.note` (cột dư — **không hiện** trên list/chi tiết)
- Nhu cầu (`NeedSummary`) **và** ghi chú (`Note`) trong **mọi** lần chăm sóc

**Không** khớp tên Facebook (`facebookName`) trên API. Tên FB vẫn hiện dòng phụ máy tính.

Substring, không phân biệt hoa thường (kể cả Á/á). **Giữ dấu** (`hung` ≠ `hùng`).

Không `@` → chỉ khách đang hiện.  
`@` → hiện + đã xoá.  
`@@` → chỉ đã xoá.

STAFF không thấy khách người khác.

#### 12.1.2 Nút Thêm khách hàng bằng SĐT

Cùng hàng ô tìm, bên phải.

Bấm → modal **Thêm khách hàng bằng số điện**: hotline * (bắt buộc), tên *, SĐT * (`0` + 9 số), ghi chú. Trùng SĐT → modal xác nhận. Chưa có hotline → bảo vào Cài đặt SĐT.

#### 12.1.3 Bộ lọc

CRM cũ: select trên thanh lọc. CRM mới: icon cột trên desktop (cùng nghĩa); mobile = sheet Bộ lọc.

- Trạng thái
- Tài chính: tất cả / chưa có / đã có / dưới 1 tỷ / 1–2 tỷ / trên 2 tỷ
- Kênh liên hệ: danh sách page FB + hotline của NV (API)
- Lô đất: tất cả / đã gắn / chưa gắn (`lodatFilter=has|empty`)
- Nhu cầu: tất cả / có nhu cầu / chưa có (`needFilter=has|empty`)

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
Bấm → modal **Thêm số điện thoại**. Trùng số → modal mục 15.  
Ô SĐT: dán `0977 656 280` / `+84…` lấy đủ 10 số (không để `maxLength` cắt khoảng trắng trước khi bỏ dấu cách).

##### 5. SĐT trên menu Thao tác

Khách chưa ẩn. **NV phụ trách khách.** Icon cam (mục 4) vẫn thêm nhanh khi chưa có số.

- Chưa có số: mục **Thêm số điện thoại** → modal thêm nhanh (hoặc mở quản lý trống + form thêm).
- Đã có số: mục **Quản lý số điện thoại** → modal danh sách (thêm / sửa / xoá từng số, tối đa 10). Trùng số → modal mục 15.

##### 6. Icon Map + số lô

Chỉ khi `lodatCount > 0`. Chỉ thể hiện, không điều hướng.

##### 7. Hangtag trạng thái

Khách nét / mới / cần chăm sóc / Khác.

Đã xoá: thêm hangtag **Đã xoá**.

##### 8. Tên Facebook (dòng phụ)

Hiện nếu khác tên CRM, hoặc có hồ sơ FB.  
**Không** bút sửa. Tên do extension ghi khi scan.

##### 9. Nhu cầu

`latestNeedSummary`. Trống → `—`.

##### 10. Tài chính

Khoảng ngân sách. Trống → `—`.

##### 11. Kênh liên hệ

Page/nick FB của NV **hoặc** hotline (SĐT + nhãn).

##### 12. Menu thao tác (chevron)

Một menu (portal `position: fixed`). Khách đã xoá: **chỉ** «Khôi phục khách».

**Vị trí / cuộn**

- Ưu tiên mở **dưới** nút chevron. Không đủ chỗ dưới (bị footer / mép viewport che) → mở **trên** nút.
- **Không** khóa cuộn list khi menu mở. Cuộn vùng bảng/thẻ (touchmove / wheel / resize, kể cả iOS) → **đóng** menu ngay — cuộn tới khách khác không cần đóng tay.

| Mục | Việc |
|-----|------|
| Mở chat | Tab ngoài. Khách **Page** (Business Suite): URL inbox lúc quét (`pageUrl`). Messenger E2EE: `facebook.com/messages/e2ee/t/{threadId}`. Messenger thường: `facebook.com/messages/t/{threadId}`. Hiện khi khách có Facebook; thiếu URL → CrmAlert; **ẩn mobile**. Tin đã lưu xem cột phụ «Nội dung chat». **Không** phải inbox sống |
| Mở Messenger | Tab `messenger.com/t/{threadId\|uid}` (CRM cũ). Hiện khi khách có Facebook; thiếu mã số → CrmAlert |
| Cập nhật chăm sóc | Modal. Form: trạng thái, nhu cầu, tài chính (chip), ghi chú |
| Thêm / Sửa số điện thoại | Chưa có số: modal thêm. Đã có: sửa (Lưu / Xóa). Icon cam = thêm nhanh |
| Tạo lô đất | STAFF → `/khach-hang/[id]/them-lo-dat` (lodats.md §12.5). ADMIN: báo không được tạo |
| Dịch vụ sổ đỏ | `/khach-hang/[id]/dich-vu-so-do` (form tạo hồ sơ) |
| Ghim / Bỏ ghim | `isPinned` |
| Xóa khách | Confirm ẩn mềm; tìm lại bằng `@` / `@@` |

##### 13. Ghim / chọn / ẩn

Ghim: nền vàng. Đang chọn: highlight. Đã xoá: hàng kiểu ẩn.

#### 12.1.5 Footer + cuộn tải thêm + nhớ vị trí (mục 24)

**Footer**

- Chỉ một trang (chưa hết): `Tổng N`.
- Đã phân trang: `Hiển thị n / Tổng N` (`n` = số dòng đang có trên DOM, `N` = `total` API).

**Tải thêm 50 dòng**

1. API list nhận `limit` + `offset`. Mỗi lần **đúng 50** khách (`limit=50`). Lần đầu `offset=0`.
2. Thứ tự luôn: ghim → `pinnedAt` → `updatedAt` (cùng `ORDER BY` hiện tại). Không xáo khi append.
3. Cuộn vùng **thân bảng** (không phải window). Còn cách đáy **< 160px** và `n < N` và không đang tải → gọi tiếp `offset = n`, **nối** vào list (không thay trang).
4. Đổi ô tìm / lọc / `@` `@@` → **reset**: `offset=0`, bỏ list cũ, cuộn lên đầu. Không giữ scroll lần trước.
5. Ghim / ẩn / sửa một dòng: giữ `scrollTop` hiện tại; không tải lại từ đầu nếu không cần.

**Nhớ vị trí + lọc khi rời list**

Lưu **sessionStorage** (theo tab; đóng tab thì mất) qua helper chung `apps/web/src/shared/list-state` (`createListStateStore`, key `crmanhung:customer-list-state`):

| Lưu | Gồm |
|-----|-----|
| Lọc | Ô tìm (kể cả `@`/`@@`), trạng thái, tài chính, kênh, lô đất, nhu cầu |
| Chọn | `selectedId` đang chọn |
| Cuộn | `scrollTop` của thân list + `anchorId` = id dòng đầu tiên còn thấy |

**Khi nào lưu:** đổi lọc; cuộn; rời `/khach-hang` mọi lối (thẻ chi tiết, chăm sóc, sổ đỏ, menu header, Back, F5).

Khi **vào lại list** (Back, «Danh sách khách», menu Quản lý khách hàng, F5 cùng tab):

1. Khôi phục đúng bộ lọc đã lưu, rồi gọi API với bộ lọc đó (`offset=0`, `limit=50`).
2. Nếu `scrollTop` đã lưu **cao hơn** chiều cao list hiện có → **tải thêm 50** (lặp) cho đến khi đủ chiều cao hoặc hết `total`.
3. Đặt lại **đúng pixel** `scrollTop`; `anchorId` + `anchorOffset` chỉ dùng khi list đã đổi. Effect đổi lọc **không** kéo về đầu trong cùng lúc restore (Back từ chi tiết, cache React Query).
4. Trong lúc khôi phục: **không** nháy về đầu trang (che list ngắn; timeout an toàn ~4s).
5. Giữ snapshot trong tab cho lần vào sau. Đăng xuất thì xóa.

Máy tính và điện thoại **cùng quy tắc**. Ô cuộn: bảng (PC) hoặc danh sách thẻ (mobile).

#### 12.1.6 Panel phải

Cột phụ bên phải trang danh sách (máy tính). Tối đa ba thanh tab dọc: **Nội dung chat** · **Lịch sử chăm sóc** · **Danh sách lô đất**.  
**Hiện thanh khi khách đang chọn có dữ liệu** — chat: `messageCount > 0`; chăm sóc: `careNoteCount > 0`; lô: `lodatCount > 0`. Không có dữ liệu → **ẩn** thanh đó. Chưa chọn dòng, hoặc khách không có mục nào → **ẩn cả cột phụ**. Đang mở panel rồi chọn khách khác không còn mục đó → thu hẹp.  
**Không** nhớ panel vừa mở (không `localStorage`) — cùng [`ARCHITECTURE.md`](../ARCHITECTURE.md) và skill `crm-list-state`. Mobile: ẩn cột phụ.

##### Nội dung chat

Tin **đã lưu** (`GET /customers/:id/messages`) — không phải Inbox Facebook sống. Ownership cùng GET khách.

Thứ tự `SortOrder ASC, id ASC` (CRM cũ). Bong bóng: Khách / Tôi / Page / Không rõ.

1. Meta `#n · người gửi`
2. Chữ `MessageText`. Trống + có ảnh → `[Ảnh]`. Trống không ảnh → `—`
3. Ảnh: thumbnail; bấm → gallery (CrmDialog, prev/next). `RotationDeg` chỉ xoay CSS — chưa lưu xoay mới.
4. Không tin → ẩn thanh (không hiện «Không có tin nhắn…» trên cột phụ).

##### Lịch sử chăm sóc

`GET /customers/:id` → `careNotes`. Không có lần chăm sóc → **ẩn thanh**.

##### Danh sách lô đất

`GET /customers/:id/lodats` — map active của khách (cùng quyền xem khách). Không có lô → **ẩn thanh** (không hiện «Chưa gắn lô đất.» trên cột phụ).

Thẻ (ảnh trái, chữ phải) — **cùng trang chi tiết** §12.3.3 mục 6:

1. **Ảnh** — thumbnail vuông. Overlay `+N` nếu còn ảnh ngoài ảnh bìa (`extraPhotoCount`). Thiếu ảnh = ô xám, không bấm. **Bấm ảnh** (khi có) → gallery lô (cùng modal `/lo-dat`: prev/next, xoay lưu nếu ảnh của lô).
2. **Chữ** — tiêu đề đậm; địa chỉ (ẩn nếu trống); DT · MT · hướng (chỉ field có); giá `crm-money`. **Bấm chữ** → `/lo-dat/[id]`.

---

### 12.2 Giao diện mobile

```
┌ Ô tìm ───────────────────────────────────────────────────────┐
├ [Bộ lọc] [Tìm] ──────────────────────────────────────────────┤
├ Thẻ xếp dọc ─────────────────────────────────────────────────┤
├ Footer All · KN · KM · CCS · KH · ĐG ────────────────────────┤
└ Nút Thêm SĐT dính đáy ───────────────────────────────────────┘
```

Không bảng, không cột phụ.

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

Hiện khi **đã có** SĐT. Bấm → gọi: **1 số** `tel:` thẳng; **≥2 số** → modal chọn số.

##### 3. Icon SĐT **cam** (`#ea580c`)

Cùng 12.1.4 mục 4 (modal thêm số).

##### 4. SĐT trên menu Thao tác

Cùng 12.1.4 mục 5. Icon cam trên thẻ vẫn thêm nhanh.

##### 5. Icon Map + số lô

Cùng 12.1.3 mục 6.

##### 6. Hangtag trạng thái

Cùng 12.1.4 mục 7 (kể hangtag **Đã xoá**).

##### 7. Tên Facebook (dòng phụ)

**Không** hiện trên thẻ.

##### 8. Nhu cầu

`latestNeedSummary`. Trống → **ẩn**.

##### 9. Tài chính

Khoảng ngân sách. Trống → **ẩn**.

##### 10. Kênh liên hệ

Page/nick FB hoặc hotline. Chữ thuần, không link.

##### 11. Nút sửa

`SquarePen` → `/khach-hang/[id]/cham-soc`. Ẩn nếu đã xoá.

##### 12. Menu thao tác (chevron)

Cùng menu máy tính (portal). Khách đã xoá: **chỉ** «Khôi phục khách».

**Vị trí / cuộn** — giống §12.1.4 mục 12: ưu tiên dưới nút, thiếu chỗ thì trên; **không** khóa cuộn; cuộn thẻ / resize → đóng menu (tránh che thanh «Thêm khách bằng SĐT»).

| Mục | Việc |
|-----|------|
| Mở chat | **Ẩn mobile.** Máy tính: Page → URL Business Suite; E2EE `/messages/e2ee/t/…`; còn lại `facebook.com/messages/t/…` |
| Mở Messenger | Tab `messenger.com/t/…` (có FB; thiếu mã → CrmAlert) |
| Cập nhật chăm sóc | Trang `/khach-hang/[id]/cham-soc`. Form: trạng thái, nhu cầu, tài chính (chip), ghi chú |
| Thêm / Sửa số điện thoại | Cùng 12.1.4 mục 5 |
| Tạo lô đất | STAFF → `/khach-hang/[id]/them-lo-dat`. ADMIN: báo không được tạo |
| Dịch vụ sổ đỏ | `/khach-hang/[id]/dich-vu-so-do` |
| Ghim / Bỏ ghim | `isPinned` |
| Xóa khách | Confirm ẩn mềm; tìm lại bằng `@` / `@@` |

##### 13. Ghim / ẩn

Ghim: nền vàng. Đã xoá: thẻ kiểu ẩn.

#### 12.2.5 Footer + cuộn

All · KN · KM · CCS · KH · ĐG — đếm trên **trang đang nạp**. `All n / N` khi còn trang.

Cuộn tải 50 + nhớ vị trí/lọc: **cùng 12.1.5**. Vùng cuộn = danh sách thẻ.

---

### 12.3 Chi tiết `/khach-hang/[id]`

Mở: **điện thoại bấm thẻ**. Máy tính: chọn dòng + cột phụ (không bắt buộc vào trang này).

Dữ liệu khách + lịch sử: `GET /customers/:id`. **Lô đất trên trang này và cột phụ = API** (`GET /customers/:id/lodats`).

Quay lại = `/khach-hang` (mục 24 sẽ khôi phục cuộn/lọc).

#### 12.3.1 Máy tính

Cùng khối 12.3.3. Cột nội dung hẹp (~720px). Nút quay lại trên cùng. **Không** FAB.

#### 12.3.2 Mobile

Cùng khối 12.3.3. SĐT trong hero bấm = `tel:`. Padding gọn. **Không** hiện «← Danh sách khách» (Back / vuốt hệ thống).

**FAB** góc phải dưới (mobile; «⋯» luôn hiện nếu khách chưa ẩn):

| Nút | Điều kiện | Hành vi |
|-----|-----------|---------|
| «⋯» | Khách **chưa** ẩn | Popover + icon Lucide: **Cập nhật chăm sóc** · **Tạo lô đất** · **Dịch vụ sổ đỏ** (cùng route menu list; ADMIN tạo lô → CrmAlert) |
| Gọi điện | Có ≥1 SĐT | **1 số** → `tel:` thẳng; **≥2 số** → modal chọn số |
| Zalo | Có ≥1 SĐT | Tab `zalo.me/84…` (cùng quy tắc trang public) |
| Mở Messenger | Có Facebook và khách **chưa** ẩn | Cùng logic menu list mobile «Mở Messenger» (`messenger.com` / CrmAlert nếu không mở được). **Không** dùng «Mở chat» (desktop-only) |

#### 12.3.3 Thành phần

1. **Quay lại** — «← Danh sách khách» (**chỉ máy tính**). Mobile: ẩn
2. **Hero** — avatar (ảnh FB hoặc chữ tắt); tên; hangtag trạng thái; hangtag **Đã xoá** nếu ẩn
3. **Kênh liên hệ** — ngay dưới tên; chỉ chữ tên kênh (cùng `channelLabel` list: hotline / page·nick FB). **Không** nhãn «Kênh liên hệ». Trống → `—`
4. **SĐT** — mọi số trên hồ sơ; trống `—`. Điện thoại: từng số là `tel:`
5. **Tài chính** — khoảng ngân sách; trống `—`
6. **Thông tin hiện tại** — chỉ hiện nếu có `latestNeedSummary` hoặc `latestCareNote`. Hai nhãn: Nhu cầu / Ghi chú
7. **Danh sách lô đất** — API. Cùng thẻ §12.1.6: ảnh trái (+N) · tiêu đề · địa chỉ · DT·MT·hướng · giá. Bấm ảnh → gallery; bấm chữ → `/lo-dat/[id]`. Không có → «Chưa gắn lô đất.»
8. **Lịch sử chăm sóc** — mới → cũ. Mỗi dòng: ngày giờ + «n phút/giờ trước» + tên NV; Nhu cầu; Ghi chú. Không có → «Chưa có lịch sử chăm sóc.»
9. **FAB mobile** — §12.3.2 («⋯» / gọi / Zalo / mở Messenger)

Không form chăm sóc trên trang này (form = **§12.4**).

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

Script **chỉ đọc** disk cũ → `customers/avatars/<tên file>` → `CustomerFacebook.avatarObjectKey`. List trả `avatarUrl` = URL CDN. Không xóa file cũ. Slice này **chỉ avatar**. Ảnh chat = **§13.9**. Ảnh lô = [`MIGRATION.md`](../MIGRATION.md) bước 10d.

### 13.6 Slice này — số điện thoại

`tblPersonPhone` → `CustomerPhone` + map `customer_phone`. Cần map `customer`.

Lúc freeze: **152** số (152 khách; 1249 khách không SĐT). Mỗi khách tối đa 1 số. Label trống. Format `0` + 9 chữ số. Trùng 2 NV: 0.

Copy nguyên số + `sortOrder`. Số chính trên list = `ORDER BY sortOrder ASC, createdAt ASC` (CRM cũ: `SortOrder, ID`). Ô tìm list cũng khớp `phones.phone`.

Máy tính: icon Phone **xanh** `#047857` → copy + tick ~1,5s. Điện thoại: `tel:` (đã có). Icon cam / thêm khách bằng SĐT / xoá số = mục 10–11, 14–15.

Script: `pnpm phones:migrate-legacy`. **Xong staging (152/152).**

### 13.7 Slice này — nhu cầu (lịch sử chăm sóc)

`tblPersonCareHistory` → `CustomerCareNote` + map `customer_care`. Cần map `customer` + `user`.

Lúc freeze: **266** dòng / **237** khách có lịch sử (215 một lần, 18 hai lần, 4 nhiều hơn). Mọi dòng đều có `NeedSummary` (max 94 ký tự). 86 dòng có `Note`. 0 NV trống. Bảng cũ **không** có cột ngân sách / Source trên history — ngân sách list vẫn lấy snapshot trên `Customer`.

Cột Nhu cầu list = `NeedSummary` mới nhất **không rỗng** (`CreatedAtMs DESC, ID DESC`) — cùng CRM cũ. Ghi chú mới nhất (`Note`) → `latestCareNote` (cột phụ). Ô tìm khớp mọi `NeedSummary` + `Note` chăm sóc **và** `Customer.note` (cột dư). **Không** khớp `facebookName`.

Cột phụ **Lịch sử chăm sóc** đọc `GET /customers/:id` (nhu cầu + ghi chú). Slice copy **không** bật form cập nhật (mục 2) — form = **§13.8**.

Script: `pnpm care:migrate-legacy`. **Xong staging (266/266 dòng, 237 khách).**

### 13.8 Slice này — form cập nhật chăm sóc

`POST /api/v1/customers/:id/care-notes` `{ status, budgetMinVnd, budgetMaxVnd, needSummary?, note? }`. Ownership cùng GET/PATCH. Khách đã ẩn: không mở form / API từ chối.

- Ghi đè `Customer.status` + `budgetMin`/`MaxVnd`.
- Append `CustomerCareNote` **chỉ khi** nhu cầu hoặc ghi chú khác lần gần nhất **và** ít nhất một trong hai không rỗng. Ô trống không xóa lịch sử cũ.
- Không đổi gì → `{ unchanged: true }`, toast «Không có thay đổi. Bỏ qua cập nhật.»
- Chip tài chính: 4 khoảng + **Chưa xác định**. Khoảng lẻ (không khớp chip) hiện thêm 1 chip đúng số đang có — lưu không bị ghi đè chip chuẩn.

Máy tính: double-click dòng / menu → CrmDialog. Điện thoại (`max-width: 767px`): `/khach-hang/[id]/cham-soc`. **Xong staging (2026-08-20).**

### 13.9 Slice này — tin nhắn + ảnh chat

`tblPersonMessenger` → `CustomerMessengerMessage` (map `customer_messenger`).  
`tblPersonMessengerImages` + file disk `img/imgsmessenger` → R2 public `customers/chat/<personId>/<file>` + `CustomerMessengerImage.objectKey` (map `customer_messenger_image`).

Cần map `customer_facebook` (PersonFacebookId) + `customer` (folder personId trên disk).

Lúc freeze: **20 253** tin / **1 366** thread; **2 448** ảnh DB (1 685 tin có ảnh); disk **~418 MB / 2 454 file**. Sender: khách 7341 · unknown 5496 · page 4708 · tôi 2708. `RotationDeg` ≠ 0: **6**.

Script **chỉ đọc** SQLite + disk cũ. Không xóa file cũ. Ảnh chat = bucket public + CDN (cùng avatar; nhân viên đã login mới thấy cột phụ). Hợp đồng / giấy tờ vẫn private bucket.

Script: `pnpm chat:migrate-legacy`. **Xong staging (20 253/20 253 tin, 2 448/2 448 ảnh, 0 thiếu).**

### 13.10 Slice này — SĐT cam (thêm số)

Khách **chưa có** SĐT và **chưa ẩn**: icon Phone **cam** `#ea580c` trên list (máy tính + thẻ mobile). Bấm → modal **Thêm số điện thoại** (CrmDialog; 1 ô SĐT; Huỷ + Lưu số).

`POST /api/v1/customers/:id/phones` `{ phone }` — thêm số (tối đa 10 / khách; 10 số bắt đầu `0`). Ownership cùng GET/PATCH. Khách đã ẩn: API từ chối. Trùng số trên cùng hồ sơ: 400. Số đã có trên hồ sơ khác: `409 PHONE_DUPLICATE` + modal mục 15 (gộp nếu được). `PATCH|DELETE /api/v1/customers/:id/phones/:phoneId` — sửa / xoá từng số (không wipe số phụ).

Máy tính: xanh vẫn copy + tick. Điện thoại: xanh vẫn `tel:`; cam không gọi.

### 13.11 Slice này — thêm khách SĐT, trùng/gộp, sửa tên, lọc

- **POST `/api/v1/customers`** `{ fullName, phone, sourceHotlineId, note? }`. Hotline phải của NV đang bật. Trùng SĐT cùng NV → `409 PHONE_DUPLICATE`; OK = cập nhật tên + khôi phục nếu đang ẩn (`PATCH .../acknowledge-phone-duplicate`).
- **GET `/api/v1/users/me/hotlines`**. Chưa có hotline → Cài đặt → Quản lý SĐT (thêm / bật-tắt).
- **SĐT chuẩn (BUG-018):** mọi ghi qua `digitsFromPhoneRaw` → `0` + 9 số. DB: `CustomerPhone.employeeId` + unique `(employeeId, phone)` và `(customerId, phone)` — cùng số hai NV vẫn được; race → `409`. Không unique SĐT toàn hệ.
- Thêm SĐT cam trùng: `409` kèm `mergeAllowed` (chỉ **STAFF** phụ trách khách; Admin không gộp). Gộp Facebook → khách chỉ có SĐT: **POST `/customers/merge-facebook-into-phone-holder`** — chỉ NV, hai hồ sơ cùng `employeeId` = user; Admin → 403.
- Sửa tên: bút Lucide trên máy tính → `PATCH /customers/:id` `{ fullName }`. Không bút trên thẻ mobile.
- Lọc tài chính: `budgetFilter=none|has|lt_1b|1b_2b|gt_2b` (khoảng chồng). Lọc kênh: `contactChannel=fb:<uid>|hotline:<id>` từ **GET `/customers/contact-channels`**. Lọc lô: `lodatFilter=has|empty`. Lọc nhu cầu: `needFilter=has|empty`.

**Xong staging (2026-08-20)** — `/khach-hang` trên `anhungland.com`.

### 13.12 Slice này — trang chi tiết khách

`GET /customers/:id` (đã có): hero, SĐT, tài chính, thông tin hiện tại, lịch sử chăm sóc. Mobile bấm thẻ → `/khach-hang/[id]`.

**Lô đất = API** (`GET /customers/:id/lodats`) — map active đã copy. Ảnh trái (+N) / chữ phải; bấm ảnh = gallery; bấm chữ → `/lo-dat/[id]`.

Mục 24 (cuộn 50 + nhớ vị trí) = §12.1.5 — **đã code** (`GET /customers?limit=50&offset=`).

**Xong staging (2026-08-20)** — `/khach-hang/[id]` trên `anhungland.com`.

### 13.13 Slice này — list tải 50 dòng

`GET /customers` nhận `limit` (mặc định 50, tối đa 200) + `offset`. `total` = COUNT cùng filter. UI: lần đầu 50; cuộn thân bảng/thẻ < 160px đáy thì nối thêm. Đổi tìm/lọc → offset 0. Lọc + vị trí cuộn giữ trong sessionStorage khi rời list (chi tiết, menu, Back, F5 cùng tab); đăng xuất thì xóa.

**Xong staging (2026-08-20).**

### 13.14 Slice này — ingest extension (ảnh chat + avatar WebP)

**POST `/api/v1/customers/from-extension`** (JWT). Payload giống CRM cũ: `scan.threadId` hoặc `scan.customerUid` + `scan.avatarUrl` + `chatMessages[].imageUrls` (data URL / Facebook CDN).

- Khớp khách của **NV đang login** theo thread rồi UID. Chưa có → tạo `KHACH_MOI`. Khách đang ẩn → **tự khôi phục** (`isHidden: false`, `autoRestoredAt`) + hangtag «Tự khôi phục» (§11 mục 25). **Không** đổi SĐT.
- Avatar: URL rỗng → giữ ảnh cũ. Cùng pathname FB CDN (`rawMeta.avatarSourceKey`) và đã có R2 → không tải lại. URL mới → `sharp` WebP → R2 `customers/avatars/<customerId>/<hash>.webp` (`avatarObjectKey`). Tải/upload fail: giữ R2 cũ; chưa có ảnh thì lưu URL FB tạm (list vẫn hiện được).
- Ảnh chat raster mới → `sharp` WebP (cạnh dài ≤ 2560) → R2 `customers/chat/<customerId>/{mid}-{n}.webp`. Video / path `/img/imgsmessenger/` cũ: bỏ qua.
- Tin đã có đủ ảnh (kể cả JPEG migrate đã convert WebP) → không encode lại. Gắn ảnh chat vào lô: **copy** SEO WebP, giữ file chat (cùng key WebP sau `[seo-webp-replace]`).
- Body JSON tối đa 32MB (data URL). Tối đa 200 tin / lần.

Scanner `apps/extension` vẫn stub — API sẵn khi port scanner.

---

*Web mới: Lucide + CrmDialog, cùng hành vi trên. Không copy CSS/god-file CRM cũ.*
