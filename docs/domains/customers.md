# Domain: Customers (Khách hàng)

- **Slug:** `customers`
- **Status:** Ready for mock
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

Giữ contract hiện tại. Nest làm sau khi §12 ổn. Migrate `tblPerson*` — `MIGRATION.md`. Extension: có, phase sau.

## 11. Lệch mock mới vs CRM cũ (chỉnh theo CRM cũ)

- Mock: icon Phone trang trí / `tel:`; CRM cũ: **xanh = copy (PC) / gọi (mobile)**; **cam = thêm SĐT**.
- Mock: icon mess trên dòng; CRM cũ: **không** có icon mess trên item — chat nằm rail + menu.
- Mock: cột «Số lô đất»; CRM cũ: **chỉ icon Map + số** cạnh tên.
- Nhu cầu mock = `Customer.note`; CRM cũ = **NeedSummary** care.

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

Placeholder. Trang chăm sóc `/cham-soc` — form modal chăm sóc làm sau.

---

*Web mới: Lucide + CrmDialog, cùng hành vi trên. Không copy CSS/god-file CRM cũ.*
