# Domain: Nguồn Facebook

- **Slug:** `facebook-source`
- **Status:** Draft — BUG-013 ingest khóa UID người (2026-09-08). Bốn cặp `buinam` cũ chưa gộp.
- **Owner:** Bùi Xuân Khả
- **Liên quan:** [`customers.md`](./customers.md) §13.14 · Chrome extension `apps/extension` · audit **BUG-013**
- **Code scanSource:** `business_suite` · `messenger_standard` · `messenger_e2ee`

Tài liệu này **đặt tên chung** cho dữ liệu extension gửi vào CRM. Dùng tên tiếng Việt khi bàn với owner. Không thay contract. Ingest khóa UID (BUG-013) và panel **Thông tin quét** Cách A (extension v2.15.0) **đã code**.

---

## 1. Mục đích

Gọi chung mọi khách + tin extension lấy từ Meta rồi `POST /customers/from-extension` là **nguồn Facebook**.

Chia **ba nhánh** — đúng ba chỗ nhân viên mở trên trình duyệt — để không lẫn Page Inbox với Messenger thường và Messenger mã hóa.

## 2. Actors

| Actor | Được | Không |
|-------|------|--------|
| STAFF (`kha`, `buinam`, …) | Bật quét trên panel extension; gửi khách + tin **của mình** (JWT) | Gửi hộ NV khác |
| ADMIN | Login panel được; thực tế Admin **không** có khách để quét | — |
| Guest | — | Ingest |

Khách thuộc **NV đang login** trên panel, không thuộc nick Facebook trên trang Meta.

## 3. Khái niệm

**Nguồn Facebook** gồm ba nhánh:

| Nhánh (nói chuyện) | NV mở trang | `scanSource` |
|--------------------|-------------|--------------|
| **Nhánh Page** | Business Suite Inbox | `business_suite` |
| **Nhánh Messenger thường** | Messenger không mã hóa | `messenger_standard` |
| **Nhánh Messenger E2EE** | Messenger mã hóa đầu cuối | `messenger_e2ee` |

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Nguồn Facebook | Tên chung: payload extension → CRM (không gồm khách chỉ SĐT / hotline) |
| UID Facebook khách | `scan.customerUid` — mã người Facebook. **Không luôn** bằng số trên URL |
| Mã cuộc chat | `scan.threadId` — số trên URL Messenger. Nhánh Page **không** gửi field này |
| Nick / Page NV | `scan.employeeUid` / `scan.myPageUid` — Page công ty hoặc nick Messenger của NV |
| Person | Một `Customer` trên CRM. Cùng người Facebook **có thể** thành nhiều Person (BUG-013) |

## 4. Use cases

1. **Quét khách đang mở** — NV login panel, bật quét, đứng trên một hội thoại. Extension đọc tên, UID / mã cuộc chat, tin, ảnh. Đổi hội thoại hoặc bấm gửi → `POST /customers/from-extension`.
2. **Khách đã có** — API tìm trong khách của NV theo mã cuộc chat rồi UID. Có thì cập nhật + nối tin. Ẩn thì tự khôi phục (hangtag «Tự khôi phục»).
3. **Khách chưa có** — tạo Person `KHACH_MOI` + hàng Facebook.

## 5. Quan hệ dữ liệu

- Nguồn Facebook → `Customer` (NV) 1-1 với `CustomerFacebook` (UID, thread, nick, `scanSource`).
- Ownership: `Customer.employeeId` = JWT. Cùng UID hai NV = hai Person (cố ý).
- Cùng UID **khác nick/page** trên một NV = hai Person (đúng nghiệp vụ, ví dụ Page Bùi Xuân Khả vs nick Em Hà).

## 6. UI (màn hình)

Không có màn CRM riêng cho «nguồn Facebook». NV thao tác trên **tab Meta** + **panel extension**. List `/khach-hang` chỉ **đọc** khách đã lưu.

Menu **Mở chat** / **Mở Messenger** trên CRM = tab ngoài, theo nhánh lúc quét — [`customers.md`](./customers.md) mục 21. **Không** phải inbox sống.

### 6.1 Panel extension — khối Thông tin quét (v2.15.0, Cách A)

Panel nổi trên tab Meta (máy tính; điện thoại Meta cùng panel, hẹp hơn). **Không** bắt buộc kênh đã đăng ký trước trên CRM (BUG-065).

```
┌ Copy thông tin quét ─────────────────────────────────────────┐
├ [avatar tròn]  Tên Facebook                                  ┤
├ Nguồn                                                        ┤
├ Kênh NV                                                      ┤
├ UID khách                                                    ┤
└ Link cuộc chat (rút gọn; hover / Copy = URL đủ) ─────────────┘
```

#### 6.1.1 Hàng avatar + tên

1. Avatar tròn bên trái. Có ảnh quét được thì hiện ảnh. Không có (hoặc ảnh lỗi) → chữ cái đầu tên Facebook trên nền tròn. Không viết «Avatar khách: Có».
2. Tên Facebook (`facebookName` lúc ingest) cùng hàng, bên phải avatar. Trống thì gạch ngang.

#### 6.1.2 Các dòng dưới

1. **Nguồn** — giữ nhãn cũ: Business Suite / Messenger (facebook.com) / Messenger E2EE (facebook.com).
2. **Kênh NV** — Cách A: nhánh Page → `Page {uid}`; nhánh Messenger → `Profile {uid}`. Tên đẹp («Page Bùi Xuân Khả») làm sau (DOM hoặc `EmployeeFacebookProfile.nickname`).
3. **UID khách** — một nhãn cho cả ba nhánh (Page không còn ghi `selected_item_id` trên panel). E2EE chưa đọc được UID: câu gợi ý mở Chi tiết liên hệ.
4. **Link cuộc chat** — Page: URL Business Suite đang mở. Messenger thường: `facebook.com/messages/t/{threadId}`. E2EE: `facebook.com/messages/e2ee/t/{threadId}`. Panel rút giữa; Copy giữ URL đủ.

#### 6.1.3 Ẩn trên panel, giữ trong Copy

`asset_id`, `mailbox_id`, `business_id`, `thread_type`, nguồn/điểm Lightspeed E2EE, `avatar_url`. Nút **Copy thông tin quét** dán khối đọc được rồi mục DEBUG.

## 7. Contract / API

Prefix: `/api/v1`

| Method | Path | Body | Auth |
|--------|------|------|------|
| POST | `/customers/from-extension` | `fromExtensionDraftSchema` (`scan` + `chatMessages`) | JWT NV |

Zod: `packages/shared/src/customers.ts`. Chi tiết ingest: [`customers.md`](./customers.md) §13.14.

## 8. Ba nhánh

### 8.1 Nhánh Page

Nhân viên mở **Inbox Page** trên Business Suite: `business.facebook.com/latest/inbox`.

- UID khách = `selected_item_id` trên URL (`scan.customerUid`).
- Nick/page = `page_id` / UID Page (`scan.employeeUid`, `scan.myPageUid`).
- `threadId` **trống**. Khóa theo dõi hội thoại trên panel = `asset_id` + UID khách.
- Đây là nhánh **ổn nhất**: Meta ghi rõ khách đang mở. **`kha`** hay dùng khi chat Page công ty.

### 8.2 Nhánh Messenger thường

Nhân viên mở chat **không mã hóa**: `facebook.com/messages/t/{id}` (hoặc `web.facebook.com`).

- Số trên URL = `scan.threadId`.
- Extension **coi số đó cũng là UID Facebook** (`scan.customerUid` = mã cuộc chat) — giả định chat **một-một**.
- Nick NV = UID người đang login Messenger trên trang (`scan.employeeUid`).

Giả định sai nếu URL **không** phải UID khách (nhóm, hoặc Facebook đổi dạng URL). Xác định 2026-09-08: **§13.1**.

### 8.3 Nhánh Messenger E2EE

Nhân viên mở chat **mã hóa đầu cuối**: `facebook.com/messages/e2ee/t/{id}`.

- Số trên URL **chỉ là mã cuộc chat**, **không phải** UID Facebook.
- UID khách phải **đoán** từ DOM / JSON / prefix `data-message-id` dạng `số@msgr.…`. Đoán được thì gửi UID; **không đoán được vẫn gửi** (chỉ cần `threadId`).
- API: UID trống thì **không** lấy `threadId` thế UID, nhưng **vẫn tạo Person** theo mã cuộc chat.
- Facebook đổi mã cuộc chat → cùng người, cùng nick, có thể thành **Person thứ hai**.

Bốn cặp trùng của **`buinam`** (đối chiếu Postgres 2026-09-04, copy CRM cũ, tạo 2026-05-29) nằm ở **nhánh này**: cùng NV, cùng UID, cùng page, **khác** mã cuộc chat. Vậy lúc copy, hai hồ sơ **đã có** `customerUid` — máy **đã từng lấy được** UID, lỗi là tạo hai Person theo mã cuộc chat. Xác định 2026-09-08: **§13.2**.

## 9. Extension

- [x] Có — Chrome MV3 `apps/extension`. Load unpacked thư mục đó. API mặc định `https://anhungland.com/api/v1`.
- File nhận diện URL: `ext-source.js`. Context: `ext-context-business-suite.js`, `ext-context-facebook-com.js`. Panel + payload: `content-inbox.js`.
- Kỹ thuật runtime: [`apps/extension/docs/tech/extension-overview.md`](../../apps/extension/docs/tech/extension-overview.md).
- Owner 2026-09-06: **chưa sửa scanner** vì tin thiếu `mid` (BUG-043 / BUG-044). Bàn định danh Person (BUG-013) **tách** đợt tin nhắn.

## 10. Migrate từ hệ cũ

`tblPersonFacebook` → `CustomerFacebook` (`scanSource`, UID, thread, nick NV). Chi tiết [`MIGRATION.md`](../MIGRATION.md) + [`customers.md`](./customers.md) mục copy.

Trùng Person theo thread E2EE đã copy nguyên — không tự gộp lúc migrate. Gộp tay liên quan BUG-016 (để sau).

## 11. Open questions (BUG-013 — chưa sửa code)

Owner 2026-09-08: **Nhánh Page không bàn** UID — chắc chắn gửi `customerUid`. Việc còn lại: hai nhánh Messenger **có quét được UID không**, có thì **chuẩn hoá đưa về** (`customerUid` thật, không lấy mã cuộc chat thế). Chi tiết **§13**.

1. Nhánh Messenger E2EE lúc panel hiện «chưa đọc được UID FB»: **không POST**, hay đợi / bảo NV mở Chi tiết liên hệ?
2. Nhánh Messenger thường: NV An Hưng có chat **nhóm** (`/messages/t/` không phải UID người) không?
3. KEY Person = **UID khách** (sau khi hai nhánh Messenger đã chuẩn hoá gửi UID) — coi như nghiêng **A** ở §12.3; mã cuộc chat vẫn gửi để Mở chat.

---

## 12. Chuẩn data extension phải gửi (đề xuất 2026-09-08 — chưa chốt)

Owner: đi theo tầng. **Khóa trước, trường phụ sau.** Không gửi được tầng khóa thì **không** tạo Person.

```
Nhân viên đăng nhập extension
  → Page / nick Facebook đang mở hội thoại (chat bằng gì)
    → KEY xác định khách trên kênh đó
      → trường bổ sung (tên, avatar, tin, …)
```

### 12.1 Tầng 1 — Nhân viên CRM (cố định, bắt buộc)

Ai đang quét. Lấy từ **JWT lúc login panel**, không lấy từ Facebook.

Ví dụ: nhân viên **`kha`** login extension thì khách vào hồ sơ `kha`, dù tab Meta đang mở Page hay nick cá nhân.

Thiếu tầng này → không ingest.

### 12.2 Tầng 2 — Kênh đang nói chuyện (cố định, bắt buộc)

NV đang tương tác với khách **bằng gì**.

| NV đang mở | Nhánh | Field cố định |
|------------|--------|----------------|
| Inbox Page công ty | Nhánh Page | UID Page (`employeeUid` / `myPageUid`) + nhánh = Page |
| Nick Messenger cá nhân, chat thường | Nhánh Messenger thường | UID nick NV + nhánh = Messenger thường |
| Nick Messenger cá nhân, chat mã hóa | Nhánh Messenger E2EE | UID nick NV + nhánh = Messenger E2EE |

Cùng một người khách, **`kha`** chat bằng Page An Hưng và chat bằng nick cá nhân = **hai Person**. Đúng nghiệp vụ (đã đối chiếu: khác `employeeFacebookUid`).

Thiếu tầng này → không biết khách thuộc Page nào / nick nào → không ingest.

### 12.3 Tầng 3 — KEY khách trên kênh đó (cố định, bắt buộc) — cần chốt

Không gọi chung một chữ **UID** cho cả người và cuộc chat. Hai số **trùng nhau** trên Nhánh Page và nhiều chat Messenger thường một-một; **tách nhau** trên Nhánh Messenger E2EE.

| Ứng viên KEY | Nghĩa thường | Field | Ổn khi nào |
|--------------|--------------|-------|------------|
| **Người Facebook** | Mã tài khoản khách trên Facebook | `customerUid` | Nhánh Page = `selected_item_id`. Messenger thường 1-1 thường trùng số URL. E2EE phải đọc riêng, URL không phải số này |
| **Cuộc trò chuyện** | Mã hội thoại đang mở | `threadId` (Messenger). Nhánh Page **không** có `threadId` riêng | Messenger: số trên URL `/messages/t/…` hoặc `/e2ee/t/…` |

**Câu hỏi chốt (một trong hai):**

- **A — KEY = người Facebook trên kênh** (tầng 1 + tầng 2 + `customerUid`). Đổi mã cuộc chat vẫn cùng Person. Bốn cặp **`buinam`** E2EE khác `threadId` cùng UID = **trùng hồ sơ** (BUG-013 còn đúng). Tên, avatar, tin, URL chat = tầng 4. Mã cuộc chat lưu để **Mở chat**, không phải khóa tạo Person.
- **B — KEY = cuộc trò chuyện trên kênh** (tầng 1 + tầng 2 + `threadId` / trên Page dùng `selected_item_id`). Mỗi hội thoại một Person. Bốn cặp `buinam` = **hai cuộc chat, hai hồ sơ** — không phải bug định danh. UID người (nếu có) = tầng 4, dùng để gợi ý gộp sau.

Đường owner mô tả («UID, ID cuộc trò chuyện chẳng hạn») gần **B** trên Messenger, gần **A** trên Nhánh Page. Cần chọn **một** quy tắc cho cả ba nhánh, hoặc nói rõ Page dùng A còn Messenger dùng B.

### 12.4 Tầng 4 — Trường bổ sung (không khóa Person)

Thiếu vẫn được **cập nhật** khách đã có. **Không** đủ để tạo Person mới nếu thiếu tầng 1–3.

| Nhóm | Ví dụ | Ghi chú |
|------|--------|---------|
| Nhận diện hiển thị | Tên nick (`customerName`), avatar | Tên Facebook không sửa tay trên CRM |
| Mở lại hội thoại | `pageUrl`, `threadId` nếu KEY là người | Menu Mở chat |
| Tin đã lưu | `chatMessages` (id bong bóng `mid.$` / `@msgr.`, chữ, ảnh) | API đã bỏ tin không mid (BUG-044) |
| Kỹ thuật | `scanSource`, `capturedAt`, `scanDebug` | Debug; không khóa Person |

### 12.5 Extension phải gửi — bảng tối thiểu (theo nhánh)

Cột «Khóa» = tầng 1–3. Cột «Phụ» = tầng 4. Dấu * = phụ thuộc câu chốt §12.3.

| Field | Nhánh Page | Nhánh Messenger thường | Nhánh Messenger E2EE |
|-------|------------|------------------------|----------------------|
| JWT NV (tầng 1) | Khóa | Khóa | Khóa |
| Nhánh (`scanSource`) | Khóa = Page | Khóa = Messenger thường | Khóa = Messenger E2EE |
| UID Page / nick NV | Khóa | Khóa | Khóa |
| UID người Facebook (`customerUid`) | Khóa (A) / khóa luôn vì không có thread riêng | Khóa nếu A; phụ nếu B | Khóa nếu A — **không POST** khi trống; phụ nếu B |
| ID cuộc chat (`threadId`) | Không có | Khóa nếu B; phụ nếu A (thường trùng UID) | Khóa nếu B; phụ nếu A |
| Tên, avatar, tin, URL trang | Phụ | Phụ | Phụ |

Quy tắc gửi: đủ tầng khóa → mới `POST`. Thiếu khóa → panel báo, **không** tạo khách «Khách {threadId}».

### 12.6 Hiện tại lệch chuẩn (đã sửa ingest 2026-09-08)

- ~~E2EE gửi khi chưa có UID~~ — extension không POST; API 400 nếu thiếu UID người.
- Messenger thường 1-1: `customerUid` = số URL (đúng với Bùi Dung). E2EE: không gán UID = mã cuộc chat.
- API tìm **UID + nick/page** trước; thread chỉ fallback hàng cũ thiếu UID. Cập nhật `threadId` để Mở chat.
- Zod vẫn optional; service **bắt** `customerUid` sau `parseScan`.

---

## 13. Hai nhánh Messenger — có quét được `customerUid` không? (2026-09-08)

Owner: Nhánh Page **không bàn**. Chỉ xác định Nhánh Messenger thường và Nhánh Messenger E2EE. **Có UID thật thì chuẩn hoá gửi `customerUid`**. Ingest **đã sửa** 2026-09-08 (BUG-013).

Đọc code `ext-context-facebook-com.js` + `scanner-messenger-web.js` + `content-inbox.js`. Không mở được inbox Facebook từ môi trường agent — chưa live-test trên máy NV.

### 13.1 Nhánh Messenger thường — có, nguồn là URL, không phải quét DOM

Khi NV mở `facebook.com/messages/t/{số}`:

- Extension lấy `{số}` làm `threadId`.
- Cùng số đó **gán luôn** `customerUid`. Không đọc profile, không đọc `data-message-id`.
- Chat **một-một** (cách NV An Hưng hay chat khách): Facebook để UID người kia trên URL → `customerUid` **đúng** UID khách. `facebook.com/{uid}` ra trang Facebook.
- Chat **nhóm** hoặc URL không phải UID người: JSON vẫn có `customerUid` nhưng số đó **không** mở profile khách.

**Chuẩn hoá (đã làm 2026-09-08):** luôn gửi `customerUid` khi số URL là UID người (một-một). Vẫn gửi `threadId` (cùng số) để Mở chat. Không bịa UID từ tên. Nếu sau này gặp nhóm: **không** gán `customerUid` = mã nhóm.

Kết luận: nhánh này **có** `customerUid` trên JSON với chat một-một. Việc «quét» thực ra là **copy số URL**.

### 13.2 Nhánh Messenger E2EE — có thể quét được, không phải lần nào cũng có

Số trên URL **không** phải UID khách. Extension **cố đọc** UID thật, theo thứ tự gần như:

1. Map JSON Lightspeed trong HTML (OTID ↔ thread).
2. Link / hovercard hàng list trái, header chat, cột Chi tiết liên hệ.
3. JSON gần thread (`participant_fbid`, `other_user_id`, …).
4. Prefix `data-message-id` dạng `{uid}@msgr.…` trên bong bóng tin (bỏ uid của NV và mã cuộc chat).
5. Retry khoảng 6 lần trong vài giây (`scheduleE2eeUidRetry`). Panel khuyên «mở Chi tiết liên hệ / profile» nếu vẫn trống.

Đoán được → gửi `customerUid` **khác** `threadId`. Đoán không được → hiện tại **vẫn POST**, `customerUid` trống.

Bốn cặp **`buinam`** trên DB (2026-09-04) **đều có cùng UID** trên hai Person — chứng tỏ máy **đã lấy được** UID E2EE; lỗi là tạo hai hồ sơ theo hai mã cuộc chat, không phải «không bao giờ quét được UID».

**Chuẩn hoá (đã làm 2026-09-08):**

- Có UID → **bắt buộc** gửi `customerUid` (số người), `threadId` riêng (mã cuộc chat). Không gán `customerUid` = `threadId`.
- Chưa có UID → **không tạo Person**. Panel giữ khách đang mở, đợi quét được hoặc NV mở Chi tiết liên hệ. Không gửi khách chỉ có mã cuộc chat.

Kết luận: nhánh này **quét được UID nhiều lúc**, kể cả trên data cũ của `buinam`. Chỗ phải chuẩn hoá là **đưa UID về khi có**, và **đừng gửi** khi chưa có.

### 13.3 Việc tiếp theo

1. Live `kha` 2026-09-08: E2EE **có** UID (Chị Bình, lightspeed score 100). Messenger thường UID = URL (Bùi Dung).
2. Chốt: chưa có UID thì **không POST** — đã làm (BUG-013, extension v2.14.0 + API). Panel Thông tin quét Cách A: extension **v2.15.0**.
3. ~~Sửa ingest~~ **Xong.** Tìm NV + nick/page + UID; thread chỉ Mở chat / fallback hàng cũ. Bốn cặp `buinam` không gộp ở đây (BUG-016).
