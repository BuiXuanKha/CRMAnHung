# Domain: Công việc

- **Slug:** `tasks`
- **Status:** Ready for API — bảng `/cong-viec` + ghim + hoàn thành; tạo từ Thao tác 4 list
- **Owner:** Khả Bùi Xuân
- **Liên quan hệ cũ:** không có màn tương đương (không copy)

Chủ sở hữu (2026-09-08): trang nhắc việc / ghi chú nhỏ. Tạo từ cột **Thao tác** trên `/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do`. Việc gắn đúng dòng vừa mở menu.

---

## 1. Mục đích

Nhân viên ghi việc cần làm, gắn với khách / lô / giao dịch / hồ sơ sổ đỏ vừa thao tác. Xem lại trên `/cong-viec`.

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | Tạo việc trên bản ghi **của mình**; xem / ghim / hoàn thành việc **mình tạo** | Việc của NV khác |
| ADMIN | Tạo việc trên bản ghi mình đang thấy trên list; xem / ghim / hoàn thành việc **mình tạo** | Xem việc cả công ty |

STAFF tạo trên bản ghi không phải của mình → 404 (cùng BUG-008). Pin / complete việc người khác (kể cả Admin) → 404.

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Công việc | Nội dung + hạn ngày + nguồn (một khách / lô / GD / sổ đỏ) |
| Hạn làm việc | Ngày lịch (`dueOn`). Mở modal thêm: **ngày mai**. Có thể đổi lịch hoặc **Hôm nay** |
| Đếm ngược | Hôm nay · `N ngày` còn lại · `Quá hạn N ngày` |
| Ghim | `isPinned` — lên đầu list, nền vàng |
| Hoàn thành | `completedAt` — **ẩn** khỏi list |

**Enum nguồn** (`targetType`): `CUSTOMER` · `LODAT` · `TRANSACTION` · `TITLE_SERVICE`.

## 4. Use cases

1. **Mở `/cong-viec`** — bảng việc chưa xong của mình; ghim trước, rồi hạn gần trước.
2. **Thêm từ list** — menu Thao tác → **Thêm công việc** → modal → Lưu.
3. **Huỷ modal** — không lưu.
4. **Ghim / Bỏ ghim** — menu Thao tác trên dòng.
5. **Bấm dòng** — modal chi tiết + **Hoàn thành**.

## 5. Quan hệ dữ liệu

- `WorkTask` → 1 User (`employeeId` = người tạo)
- Đúng **một** FK: `customerId` / `lodatId` / `transactionId` / `titleServiceId`
- `targetLabel` = tên lúc lưu (khách / tiêu đề lô / mã GD / tên khách sổ đỏ)

## 6. UI (màn hình)

| Màn | Route | Hành vi chính |
|-----|-------|----------------|
| Công việc | `/cong-viec` | Bảng việc của mình (chưa xong) |
| Modal thêm | trên 4 list | Nội dung, hạn, Lưu / Huỷ |
| Modal chi tiết | trên `/cong-viec` | Nội dung, hạn, đếm ngược, Hoàn thành |

## 7. Contract / API

Prefix `/api/v1`. Schema: `packages/shared/src/tasks.ts`.

| Method | Path | Body / query | Response | Auth |
|--------|------|--------------|----------|------|
| GET | `/tasks` | — | `{ items, total }` việc **chưa xong** của user | JWT |
| POST | `/tasks` | `content`, `dueOn`, `targetType`, `targetId` | `WorkTask` | JWT |
| PATCH | `/tasks/:id/pin` | `{ pinned }` | `WorkTask` | JWT, chủ việc |
| PATCH | `/tasks/:id/complete` | — | `WorkTask` (`completedAt`) | JWT, chủ việc |

Sắp xếp GET: `isPinned` desc → `pinnedAt` desc → `dueOn` asc → `createdAt` desc. Tối đa 200.

## 8. Mock data

Không. API thật.

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Không map.

## 11. Open questions

- Admin xem việc cả công ty?
- Badge số việc trên menu?
- Xem lại việc đã hoàn thành?

---

## 12. Trang `/cong-viec`

Thứ tự: **12.1 máy tính** → **12.2 mobile**. Bảng tuân [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.5. **Không** lọc cột (list cá nhân, không thanh tìm).

### 12.1 Giao diện máy tính

```
┌ Header CRM (Công việc xanh) ─────────────────────────────────┐
├ Tiêu đề: Công việc                                             ┤
├ Bảng §4.5: # · Nội dung · Nguồn · Hạn làm · Đếm ngược · Thao tác ┤
└ Footer: Hiển thị N / Tổng M công việc                          ┘
```

#### 12.1.1 Menu header

Cùng mục **Công việc** đã có. Icon `ListTodo`.

#### 12.1.2 Tiêu đề trang

`h1` **Công việc**. Dòng phụ: nhắc việc và ghi chú nhỏ.

#### 12.1.3 Item (dòng bảng)

##### 1. STT

`#` 1…N. Ghim: icon Lucide `Star` vàng thay số.

##### 2. Nội dung

`content`. Tối đa 3 dòng, còn thì `…`.

##### 3. Nguồn

`taskContextLine` (mục 12.4). Tối đa 2 dòng.

##### 4. Hạn làm

`D/M/YYYY` (`dueOn`).

##### 5. Đếm ngược

Hangtag `CrmBadge`:

| Điều kiện | Chữ | Tone |
|----------|-----|------|
| Hạn = hôm nay (VN) | Hôm nay | amber |
| Còn ngày | `N ngày` | green |
| Quá hạn | `Quá hạn N ngày` | red |

##### 6. Menu thao tác (chevron)

Portal `position: fixed`.

| Mục | Việc |
|-----|------|
| Xem chi tiết | Modal mục 12.5 |
| Ghim / Bỏ ghim | `isPinned` |
| Hoàn thành | `completedAt`; dòng biến khỏi list; toast «Đã hoàn thành công việc.» |

##### 7. Ghim / chọn

Ghim: nền vàng. Đang chọn / menu mở: highlight. Bấm dòng (không phải chevron) → modal 12.5.

Sắp xếp: ghim trước (ghim mới hơn trên), rồi hạn gần trước.

Trống: «Chưa có công việc. Thêm từ menu Thao tác trên khách, lô đất, giao dịch hoặc sổ đỏ.»

**Không** nút Thêm trên trang này (tạo từ 4 list).

#### 12.1.4 Footer

`Hiển thị N / Tổng M công việc`. Cùng màu header cột.

### 12.2 Giao diện mobile

Menu hamburger. **Thẻ xếp dọc**, không bảng cuộn ngang.

#### 12.2.1 Tiêu đề trang

Cùng 12.1.2.

#### 12.2.2 Item (thẻ)

Sao ghim cạnh nội dung (nếu ghim). Chevron thao tác cùng 12.1.3 mục 6.

Hạn + hangtag đếm ngược. Dòng nguồn = `taskContextLine`.

Bấm thẻ → modal 12.5.

#### 12.2.3 Footer

Cùng câu 12.1.4.

---

## 12.3 Modal Thêm công việc (máy tính + mobile)

Mở từ menu Thao tác 4 list. `CrmDialog` §4.7. Icon `ListTodo`. Tiêu đề: **Thêm công việc**.

#### 12.3.1 Dòng nguồn

Không sửa được. Copy:

| Nguồn | Câu |
|-------|------|
| Khách hàng | Công việc này cho Khách hàng [tên] |
| Lô đất | Công việc này cho Lô đất [tiêu đề] |
| Sổ đỏ | Công việc này cho dịch vụ sổ đỏ của khách [tên khách] |
| Giao dịch | Công việc này cho Giao dịch [mã] |

#### 12.3.2 Nội dung công việc

`textarea` bắt buộc. Trống → «Nhập nội dung công việc.»

#### 12.3.3 Hạn làm việc

`input type="date"`. Mở modal: **ngày mai** (VN).

Nút **Hôm nay** → set hôm nay (VN). Có thể chọn ngày khác trên lịch.

#### 12.3.4 Nút

**Huỷ** (đóng, không lưu) · **Lưu** (primary). Busy khi POST.

Lưu xong: đóng modal, toast «Đã thêm công việc.»

---

## 12.4 Menu Thao tác (4 list)

Mục **Thêm công việc** (icon `ListTodo`). Khách đã ẩn: **không** hiện (menu chỉ Khôi phục).

- `/khach-hang` — sau Cập nhật chăm sóc
- `/lo-dat` · `/giao-dich` · `/dich-vu-so-do` — sau Xem chi tiết

## 12.5 Modal chi tiết công việc

Mở khi bấm dòng / thẻ / **Xem chi tiết**. `CrmDialog` §4.7. Icon `ListTodo`. Tiêu đề: **Công việc**.

Nội dung (`content`). Dòng nguồn. Hạn `D/M/YYYY` + hangtag đếm ngược (cùng 12.1.3 mục 5).

**Đóng** · **Hoàn thành** (primary). Busy khi PATCH. Xong: đóng, toast «Đã hoàn thành công việc.»
