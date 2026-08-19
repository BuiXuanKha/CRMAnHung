# Domain: Customers (Khách hàng)

- **Slug:** `customers`
- **Status:** Ready for mock
- **Nguồn nghiệp vụ:** CRM đang chạy [`/khach-hang`](https://crm.anhungland.com/khach-hang) (repo `facebookcustomercrm` — đọc hiểu, không copy god-file)
- **UI visual mới:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.3.1–4.3.4
- **Contract:** `packages/shared/src/customers.ts`

§12 = đặc tả list (đánh số, ngắn). Hình thức (font, hangtag) không lặp ở đây.

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

Giữ contract hiện tại. Nest làm sau khi §12 ổn. Migrate `tblPerson*` — `MIGRATION.md`. Extension: có, phase sau.

## 11. Lệch mock mới vs CRM cũ (chỉnh theo CRM cũ)

- Mock: icon Phone trang trí / `tel:`; CRM cũ: **xanh = copy (PC) / gọi (mobile)**; **cam = thêm SĐT**.
- Mock: icon mess trên dòng; CRM cũ: **không** có icon mess trên item — chat nằm rail + menu.
- Mock: cột «Số lô đất»; CRM cũ: **chỉ icon Map + số** cạnh tên.
- Nhu cầu mock = `Customer.note`; CRM cũ = **NeedSummary** care.

---

## 12. List `/khach-hang` — theo CRM đang chạy

### 12.1 Section tìm kiếm

#### 1. Ô tìm kiếm

Placeholder: `Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)`

Gõ → debounce ~250ms rồi lọc. Mobile nút **Tìm** = lọc ngay + đóng bàn phím.

`@` / `@@` trên ô: badge + viền vàng.

##### 1.1 Tìm theo

- Tên CRM
- Tên Facebook
- Mọi SĐT
- Nhu cầu (`NeedSummary`) **và** ghi chú (`Note`) trong **mọi** lần chăm sóc

Substring, không phân biệt hoa thường (kể cả Á/á). **Giữ dấu** (`hung` ≠ `hùng`).

Không `@` → chỉ khách đang hiện.  
`@` → hiện + đã xoá.  
`@@` → chỉ đã xoá.

STAFF không thấy khách người khác.

##### 1.2 Nút Thêm khách hàng bằng SĐT

PC: cùng hàng ô tìm. Mobile: nút đáy.

Bấm → modal **Thêm khách hàng bằng số điện**: hotline * (bắt buộc), tên *, SĐT * (`0` + 9 số), ghi chú. Trùng SĐT → modal xác nhận. Chưa có hotline → bảo vào Cài đặt SĐT.

##### 1.3 Bộ lọc

PC CRM cũ: select trên thanh lọc. Mock mới: icon cột (cùng nghĩa).

- Trạng thái
- Tài chính: chưa có / đã có / dưới 1 tỷ / 1–2 tỷ / trên 2 tỷ
- Kênh liên hệ: danh sách page FB + hotline của NV (API)
- Lô đất: tất cả / chưa gắn
- Nhu cầu: tất cả / chưa có nhu cầu

Mobile: **Bộ lọc** + **Tìm**. Xoá lọc.

---

### 12.2 Section bảng

PC: `#` · Tên khách · Nhu cầu · Tài chính · Kênh liên hệ · Thao tác.  
**Không** cột Số lô — lô = icon trên tên.

Mobile: thẻ. Ẩn rail.

**Bấm nền dòng (PC)** → chọn (rail).  
**Double-click dòng (PC)** → modal chăm sóc (trừ khách đã xoá / trừ khi bấm icon).  
**Bấm thẻ (mobile)** → `/khach-hang/[id]`.

#### 1.2 Item

##### 1.2.1 STT

`#` 1…N. Ghim trước, rồi mới cập nhật.

##### 1.2.2 Tên

Avatar (ảnh FB / trống). Tên đậm.  
PC: icon bút → modal **Sửa tên khách**.

##### 1.2.3 Icon SĐT **xanh** (`#047857`)

Hiện khi **đã có** SĐT.

- PC: copy số (tick tạm).
- Mobile: `tel:`.

##### 1.2.4 Icon SĐT **cam** (`#ea580c`)

Hiện khi **chưa có** SĐT (và chưa xoá).  
Bấm → modal **Thêm số điện thoại**. Trùng → modal trùng.

##### 1.2.5 Icon thùng rác SĐT

Chỉ **admin**, khách chưa xoá, đã có số.  
Bấm → modal **Xoá số điện thoại**.

##### 1.2.6 Icon Map + số lô

Chỉ khi `lodatCount > 0`. Chỉ thể hiện, không điều hướng.

##### 1.2.7 Hangtag trạng thái

Khách nét / mới / cần chăm sóc / Khác.

Đã xoá: thêm hangtag **Đã xoá**.

##### 1.2.8 Tên Facebook (dòng phụ)

Hiện nếu khác tên CRM, hoặc admin + có FB.  
Admin: bút → modal **Sửa tên Facebook**.

##### 1.2.9 Nhu cầu

`latestNeedSummary`. Trống → `—` (PC) / ẩn (mobile).

##### 1.2.10 Tài chính

Khoảng ngân sách. Trống → `—` / ẩn.

##### 1.2.11 Kênh liên hệ

Page/nick FB của NV **hoặc** hotline (SĐT + nhãn). Mobile: chữ thuần, không link.

##### 1.2.12 Nút sửa (mobile)

`SquarePen` → cập nhật chăm sóc (trang `/khach-hang/[id]/cham-soc`). Ẩn nếu đã xoá.

##### 1.2.13 Menu thao tác (chevron)

Một menu. Khách đã xoá: **chỉ** «Khôi phục khách».

| Mục | Việc |
|-----|------|
| Mở chat | PC + có URL Inbox: tab Facebook messages |
| Mở Messenger | Tab `messenger.com/t/…` (thread hoặc uid) |
| Cập nhật chăm sóc | PC: modal. Mobile: trang chăm sóc. Form: trạng thái, nhu cầu, tài chính (chip), ghi chú |
| Tạo lô đất | STAFF → `/khach-hang/[id]/them-lo-dat`. ADMIN: báo không được tạo |
| Dịch vụ sổ đỏ | `/khach-hang/[id]/dich-vu-so-do` |
| Ghim / Bỏ ghim | `isPinned` |
| Xóa khách | Confirm ẩn mềm; tìm lại bằng `@` / `@@` |

##### 1.2.14 Ghim / chọn / ẩn

Ghim: nền vàng. Đang chọn: highlight. Đã xoá: hàng/thẻ kiểu ẩn.

#### 1.3 Footer

PC: Tổng N — hoặc Hiển thị n / Tổng N khi còn trang. Tải thêm ~50 dòng khi cuộn.  
Mobile: All · KN · KM · CCS · KH · ĐG (trên trang đang nạp).

---

### 12.3 Rail phải (PC)

Một panel: **Nội dung chat** (tin đã lưu) · **Lịch sử chăm sóc** · **Danh sách lô đất**.  
Nhớ panel vừa mở (localStorage). Mobile: ẩn.

---

*Web mới: Lucide + CrmDialog, cùng hành vi trên. Không copy CSS/god-file CRM cũ.*
