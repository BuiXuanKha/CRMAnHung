# Domain: Nguồn Facebook

- **Slug:** `facebook-source`
- **Status:** Draft — glossary để bàn ingest extension / BUG-013; **chưa chốt** khóa định danh Person
- **Owner:** Bùi Xuân Khả
- **Liên quan:** [`customers.md`](./customers.md) §13.14 · Chrome extension `apps/extension` · audit **BUG-013**
- **Code scanSource:** `business_suite` · `messenger_standard` · `messenger_e2ee`

Tài liệu này **đặt tên chung** cho dữ liệu extension gửi vào CRM. Dùng tên tiếng Việt khi bàn với owner. Không thay contract. **Chưa code** theo doc này.

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

Giả định sai nếu URL **không** phải UID khách (nhóm, hoặc Facebook đổi dạng URL). Chưa chốt NV có gặp case đó không.

### 8.3 Nhánh Messenger E2EE

Nhân viên mở chat **mã hóa đầu cuối**: `facebook.com/messages/e2ee/t/{id}`.

- Số trên URL **chỉ là mã cuộc chat**, **không phải** UID Facebook.
- UID khách phải **đoán** từ DOM / JSON / prefix `data-message-id` dạng `số@msgr.…`. Đoán được thì gửi UID; **không đoán được vẫn gửi** (chỉ cần `threadId`).
- API: UID trống thì **không** lấy `threadId` thế UID, nhưng **vẫn tạo Person** theo mã cuộc chat.
- Facebook đổi mã cuộc chat → cùng người, cùng nick, có thể thành **Person thứ hai**.

Bốn cặp trùng của **`buinam`** (đối chiếu Postgres 2026-09-04, copy CRM cũ, tạo 2026-05-29) nằm ở **nhánh này**: cùng NV, cùng UID, cùng page, **khác** mã cuộc chat.

## 9. Extension

- [x] Có — Chrome MV3 `apps/extension`. Load unpacked thư mục đó. API mặc định `https://anhungland.com/api/v1`.
- File nhận diện URL: `ext-source.js`. Context: `ext-context-business-suite.js`, `ext-context-facebook-com.js`. Panel + payload: `content-inbox.js`.
- Kỹ thuật runtime: [`apps/extension/docs/tech/extension-overview.md`](../../apps/extension/docs/tech/extension-overview.md).
- Owner 2026-09-06: **chưa sửa scanner** vì tin thiếu `mid` (BUG-043 / BUG-044). Bàn định danh Person (BUG-013) **tách** đợt tin nhắn.

## 10. Migrate từ hệ cũ

`tblPersonFacebook` → `CustomerFacebook` (`scanSource`, UID, thread, nick NV). Chi tiết [`MIGRATION.md`](../MIGRATION.md) + [`customers.md`](./customers.md) mục copy.

Trùng Person theo thread E2EE đã copy nguyên — không tự gộp lúc migrate. Gộp tay liên quan BUG-016 (để sau).

## 11. Open questions (BUG-013 — chưa sửa code)

1. Trên **cùng nick/page của một NV**, một UID Facebook là **một Person** dù mã cuộc chat đổi — hay **mỗi cuộc chat một Person**?
2. Nhánh Messenger E2EE **chưa đọc được UID**: extension **không gửi**, hay gửi tạm theo `threadId` rồi gắn UID sau?
3. Nhánh Messenger thường: NV có gặp URL **không** phải UID không? Nếu có, không được gán `customerUid = threadId`.
4. Một hồ sơ Facebook hiện **một** `threadId`. Một người hai cuộc E2EE: ghi đè sẽ trộn tin. Giữ URL mới nhất, hay nhiều cuộc trên một Person?

Hướng đang bàn (chưa chốt): Person khóa **NV + nick/page + UID**; `threadId` chỉ mở chat và nối tin; E2EE không POST khi UID trống; bốn cặp `buinam` cũ **không xóa** ở bước khóa — gộp sau BUG-016.
