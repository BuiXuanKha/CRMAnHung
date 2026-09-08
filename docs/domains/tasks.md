# Domain: Công việc

- **Slug:** `tasks`
- **Status:** Ready for API — tạo từ menu Thao tác 4 list; xem trên `/cong-viec`
- **Owner:** Khả Bùi Xuân
- **Liên quan hệ cũ:** không có màn tương đương (không copy)

Chủ sở hữu (2026-09-08): trang nhắc việc / ghi chú nhỏ. Tạo từ cột **Thao tác** trên `/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do`. Việc gắn đúng dòng vừa mở menu.

---

## 1. Mục đích

Nhân viên ghi việc cần làm, gắn với khách / lô / giao dịch / hồ sơ sổ đỏ vừa thao tác. Xem lại trên `/cong-viec`.

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | Tạo việc trên bản ghi **của mình**; xem việc **mình tạo** | Việc của NV khác |
| ADMIN | Tạo việc trên bản ghi mình đang thấy trên list; xem việc **mình tạo** | (chưa) xem việc cả công ty |

STAFF tạo trên bản ghi không phải của mình → 404 (cùng BUG-008).

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Công việc | Nội dung + hạn ngày + nguồn (một khách / lô / GD / sổ đỏ) |
| Hạn làm việc | Ngày lịch (`dueOn`). Mở modal: **ngày mai**. Có thể đổi lịch hoặc **Hôm nay** |

**Enum nguồn** (`targetType`): `CUSTOMER` · `LODAT` · `TRANSACTION` · `TITLE_SERVICE`.

Không có trạng thái xong/hủy (chưa chốt).

## 4. Use cases

1. **Mở `/cong-viec`** — list việc của mình, hạn gần trước.
2. **Thêm từ list** — menu Thao tác → **Thêm công việc** → modal → Lưu.
3. **Huỷ modal** — không lưu.

## 5. Quan hệ dữ liệu

- `WorkTask` → 1 User (`employeeId` = người tạo)
- Đúng **một** FK: `customerId` / `lodatId` / `transactionId` / `titleServiceId`
- `targetLabel` = tên lúc lưu (khách / tiêu đề lô / mã GD / tên khách sổ đỏ)

## 6. UI (màn hình)

| Màn | Route | Hành vi chính |
|-----|-------|----------------|
| Công việc | `/cong-viec` | List việc của mình |
| Modal thêm | trên 4 list | Nội dung, hạn, Lưu / Huỷ |

## 7. Contract / API

Prefix `/api/v1`. Schema: `packages/shared/src/tasks.ts`.

| Method | Path | Body / query | Response | Auth |
|--------|------|--------------|----------|------|
| GET | `/tasks` | — | `{ items, total }` việc của user | JWT |
| POST | `/tasks` | `content`, `dueOn`, `targetType`, `targetId` | `WorkTask` | JWT |

## 8. Mock data

Không. API thật.

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Không map.

## 11. Open questions

- Đánh dấu xong / xóa việc?
- Admin xem việc cả công ty?
- Badge số việc trên menu?

---

## 12. Trang `/cong-viec`

Thứ tự: **12.1 máy tính** → **12.2 mobile**.

### 12.1 Giao diện máy tính

```
┌ Header CRM (Công việc xanh) ─────────────────────────────────┐
├ Tiêu đề: Công việc                                             ┤
└ List: nội dung · hạn · dòng nguồn. Trống: «Chưa có công việc.» ┘
```

#### 12.1.1 Menu header

Cùng mục **Công việc** đã có. Icon `ListTodo`.

#### 12.1.2 Tiêu đề trang

`h1` **Công việc**. Dòng phụ: nhắc việc và ghi chú nhỏ.

#### 12.1.3 List việc

Khối trắng, viền `#e2e8f0`, bo 12px.

Mỗi việc:

1. Nội dung (`content`)
2. Hạn: `D/M/YYYY` (`dueOn`)
3. Dòng nguồn — `taskContextLine` (mục 12.4)

Sắp xếp: `dueOn` tăng, rồi `createdAt` mới hơn.

Trống: icon `ListTodo` + «Chưa có công việc.»

**Không** nút Thêm trên trang này (tạo từ list).

### 12.2 Giao diện mobile

Cùng 12.1. Menu hamburger.

---

## 12.3 Modal Thêm công việc (máy tính + mobile)

Mở từ menu Thao tác 4 list. `CrmDialog` §4.7. Icon `ListTodo`. Tiêu đề: **Thêm công việc**.

#### 12.3.1 Dòng nguồn

Không sửa được. Copy:

| Nguồn | Câu |
|-------|-----|
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
