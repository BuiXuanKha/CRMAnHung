# Domain: Công việc

- **Slug:** `tasks`
- **Status:** Ready for API — bảng `/cong-viec` + FAB tạo việc + ghim + hoàn thành; tạo từ Thao tác 4 list
- **Owner:** Khả Bùi Xuân
- **Liên quan hệ cũ:** không có màn tương đương (không copy)

Chủ sở hữu (2026-09-08): trang nhắc việc / ghi chú nhỏ. Tạo từ **FAB** trên `/cong-viec` (không bắt buộc gắn nguồn) hoặc cột **Thao tác** trên `/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do` (gắn đúng dòng vừa mở menu).

---

## 1. Mục đích

Nhân viên ghi việc cần làm — ghi chú cá nhân (không gắn nguồn) hoặc gắn khách / lô / giao dịch / hồ sơ sổ đỏ. Xem lại trên `/cong-viec`.

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | Tạo việc trên bản ghi **của mình**; xem / ghim / hoàn thành việc **mình tạo** | Việc của NV khác |
| ADMIN | Tạo việc trên bản ghi mình đang thấy trên list; xem / ghim / hoàn thành việc **mình tạo** | Xem việc cả công ty |

STAFF tạo trên bản ghi không phải của mình → 404 (cùng BUG-008). Pin / complete việc người khác (kể cả Admin) → 404.

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Công việc | Nội dung + hạn ngày + nguồn tùy chọn (không gắn / một khách / lô / GD / sổ đỏ) |
| Hạn làm việc | Ngày lịch (`dueOn`). Mở modal thêm: **ngày mai**. Có thể đổi lịch hoặc **Hôm nay** |
| Đếm ngược | Hôm nay · `N ngày` còn lại · `Quá hạn N ngày` |
| Ghim | `isPinned` — nhóm đầu list (chưa xong), nền vàng |
| Hoàn thành | `completedAt` — **cuối** list, chữ gạch ngang |

**Enum nguồn** (`targetType`): `NONE` · `CUSTOMER` · `LODAT` · `TRANSACTION` · `TITLE_SERVICE`.

## 4. Use cases

1. **Mở `/cong-viec`** — bảng việc của mình: ghim (hạn gần trước) → chưa ghim (hạn gần trước) → đã xong (cuối, gạch ngang).
2. **Thêm từ FAB** — nút góc phải dưới trên `/cong-viec` → modal (không gắn nguồn) → Lưu.
3. **Thêm từ list** — menu Thao tác → **Thêm công việc** → modal (gắn dòng) → Lưu.
4. **Huỷ modal** — không lưu.
5. **Ghim / Bỏ ghim** — menu Thao tác trên việc **chưa xong**.
6. **Bấm dòng** — modal chi tiết; chưa xong có **Hoàn thành**.

## 5. Quan hệ dữ liệu

- `WorkTask` → 1 User (`employeeId` = người tạo)
- Nguồn `NONE`: không FK. Nguồn khác: đúng **một** FK `customerId` / `lodatId` / `transactionId` / `titleServiceId`
- `targetLabel` = tên lúc lưu (khách / tiêu đề lô / mã GD / tên khách sổ đỏ); `NONE` → rỗng

## 6. UI (màn hình)

| Màn | Route | Hành vi chính |
|-----|-------|----------------|
| Công việc | `/cong-viec` | Bảng việc của mình (gồm đã xong) + FAB tạo |
| Modal thêm | FAB `/cong-viec` hoặc 4 list | Nội dung, hạn, Lưu / Huỷ |
| Modal sửa | menu **Sửa** trên `/cong-viec` | Nội dung + hạn (nguồn không đổi); chỉ việc chưa xong |
| Modal chi tiết | trên `/cong-viec` | Nội dung, hạn, đếm ngược; **Hoàn thành** nếu chưa xong |

## 7. Contract / API

Prefix `/api/v1`. Schema: `packages/shared/src/tasks.ts`.

| Method | Path | Body / query | Response | Auth |
|--------|------|--------------|----------|------|
| GET | `/tasks` | — | `{ items, total }` việc của user (**kể cả đã xong**) | JWT |
| POST | `/tasks` | `content`, `dueOn`; `targetType`+`targetId` (bỏ hoặc `NONE` = không gắn). `TITLE_SERVICE` → tiến độ `CONG_VIEC` (gắn `workTaskId`). `CUSTOMER` → lịch sử chăm sóc (ghi chú = nội dung việc) | `WorkTask` | JWT |
| PATCH | `/tasks/:id` | `content`, `dueOn` | `WorkTask`. Đồng bộ ghi chú care / tiến độ `CONG_VIEC` gắn `workTaskId` nếu đổi nội dung | JWT, chủ việc, **chưa xong** |
| PATCH | `/tasks/:id/pin` | `{ pinned }` | `WorkTask` | JWT, chủ việc, **chưa xong** |
| PATCH | `/tasks/:id/complete` | — | `WorkTask` (`completedAt`). Gắn sổ đỏ → tiến độ `CONG_VIEC`: hangtag **Đã hoàn thành**. Gắn khách → lần chăm sóc: hangtag **Đã hoàn thành** | JWT, chủ việc, **chưa xong** |

Sắp xếp GET:

1. Chưa xong + **ghim** — `dueOn` asc (hạn gần trước), rồi `createdAt` desc  
2. Chưa xong + **không ghim** — `dueOn` asc, rồi `createdAt` desc  
3. **Đã xong** — cuối list; `dueOn` asc, rồi `completedAt` desc  

Tối đa 200.

## 8. Mock data

Không. API thật.

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Không map.

## 11. Open questions

- Admin xem việc cả công ty?
- Badge số việc trên menu?

---

## 12. Trang `/cong-viec`

Thứ tự: **12.1 máy tính** → **12.2 mobile**. Bảng tuân [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) §4.5. **Không** lọc cột (list cá nhân, không thanh tìm).

### 12.1 Giao diện máy tính

```
┌ Header CRM (Công việc xanh) ─────────────────────────────────┐
├ Tiêu đề: Công việc                                             ┤
├ Bảng §4.5: # · Nội dung · Nguồn · Hạn làm · Đếm ngược · Thao tác ┤
└ Footer: Hiển thị N / Tổng M công việc                          ┘
  FAB «+» góc phải dưới → Thêm công việc
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

`taskContextLine` (mục 12.4). In hoa + `|`. VD. sổ đỏ: «DỊCH VỤ SỔ ĐỎ | CÔ CHI - CỘNG HOÀ». `NONE` → «TRANG CÔNG VIỆC». Tối đa 2 dòng. Màu nổi `#2563eb`.

##### 4. Hạn làm

`D/M/YYYY` (`dueOn`).

##### 5. Đếm ngược

Hangtag `CrmBadge` (chỉ việc **chưa xong**):

| Điều kiện | Chữ | Tone |
|----------|-----|------|
| Hạn = hôm nay (VN) | Hôm nay | amber |
| Còn ngày | `N ngày` | green |
| Quá hạn | `Quá hạn N ngày` | red |

Việc **đã xong:** không đếm hạn — hangtag **Đã hoàn thành** (`green`) thay cột/ô đếm ngược.

##### 6. Menu thao tác (chevron)

Portal `position: fixed`.

| Mục | Việc |
|-----|------|
| Xem chi tiết | Modal mục 12.5 |
| Sửa | Chỉ việc **chưa xong** → modal §12.6 (nội dung + hạn; nguồn không đổi) |
| Ghim / Bỏ ghim | Chỉ việc **chưa xong** |
| Hoàn thành | Chỉ việc **chưa xong** → toast «Đã hoàn thành công việc.»; dòng xuống cuối + gạch ngang |

##### 7. Ghim / chọn / đã xong

Ghim (chưa xong): nền vàng. Đang chọn / menu mở: highlight. Bấm dòng → modal 12.5.

**Đã xong:** cuối list; `content` (+ nguồn) **gạch ngang** (`text-decoration: line-through`); màu chữ xám; hangtag **Đã hoàn thành** (`green`); **không** hangtag Hôm nay / N ngày / Quá hạn. Menu chỉ **Xem chi tiết** (không Sửa / Ghim / Hoàn thành). Không nền vàng ghim (kể cả còn `isPinned`).

**Sắp xếp:** nhóm ghim chưa xong (hạn gần → xa) → nhóm không ghim chưa xong (hạn gần → xa) → đã xong (cuối).

Trống: «Chưa có công việc. Bấm nút + để thêm, hoặc thêm từ menu Thao tác trên khách, lô đất, giao dịch hoặc sổ đỏ.»

#### 12.1.4 FAB tạo công việc

Nút tròn cố định góc phải dưới (máy tính + mobile). Icon Lucide `Plus`. `aria-label`: **Tạo công việc**. Bấm → modal 12.3 (không gắn nguồn).

Nổi trên footer bảng / thẻ (cùng kiểu FAB chi tiết khách / lô — `position: fixed`, không nằm trong flow dưới dòng đếm). Không che menu thao tác (z-index cao hơn dòng; đóng menu khi mở FAB). Padding đáy vùng cuộn + lệch phải footer để chữ «Hiển thị…» không bị nút che.

#### 12.1.5 Footer

`Hiển thị N / Tổng M công việc`. Cùng màu header cột.

### 12.2 Giao diện mobile

Menu hamburger. **Thẻ xếp dọc**, không bảng cuộn ngang. Cùng FAB 12.1.4 (padding đáy trang để không che thẻ cuối).

#### 12.2.1 Tiêu đề trang

Cùng 12.1.2.

#### 12.2.2 Item (thẻ)

Sao ghim cạnh nội dung (nếu ghim **và chưa xong**). Chevron thao tác cùng 12.1.3 mục 6.

Hạn + hangtag đếm ngược (chưa xong) hoặc **Đã hoàn thành** (đã xong). Dòng nguồn = `taskContextLine`. Đã xong: gạch ngang nội dung + nguồn (cùng 12.1.3 mục 7).

Bấm thẻ → modal 12.5.

#### 12.2.3 Footer

Cùng câu 12.1.5.

---

## 12.3 Modal Thêm công việc (máy tính + mobile)

Mở từ **FAB** `/cong-viec` hoặc menu Thao tác 4 list. `CrmDialog` §4.7. Icon `ListTodo`. Tiêu đề: **Thêm công việc**.

#### 12.3.1 Dòng nguồn

Không sửa được. Copy:

| Nguồn | Câu (in hoa) |
|-------|------|
| FAB `/cong-viec` (`NONE`) | TRANG CÔNG VIỆC |
| Khách hàng | KHÁCH HÀNG \| [TÊN] |
| Lô đất | LÔ ĐẤT \| [TIÊU ĐỀ] |
| Sổ đỏ | DỊCH VỤ SỔ ĐỎ \| [TÊN KHÁCH] |
| Giao dịch | GIAO DỊCH \| [MÃ] |

Màu `#2563eb` (nổi).

#### 12.3.2 Nội dung công việc

`textarea` bắt buộc. Trống → «Nhập nội dung công việc.»

#### 12.3.3 Hạn làm việc

`input type="date"`. Mở modal: **ngày mai** (VN).

Nút **Hôm nay** → set hôm nay (VN). Có thể chọn ngày khác trên lịch.

#### 12.3.4 Nút

**Huỷ** (đóng, không lưu) · **Lưu** (primary). Busy khi POST.

Lưu xong: đóng modal, toast «Đã thêm công việc.» FAB: `targetType` = `NONE` (không `targetId`).

---

## 12.4 Menu Thao tác (4 list)

Mục **Thêm công việc** (icon `ListTodo`). Khách đã ẩn: **không** hiện (menu chỉ Khôi phục).

- `/khach-hang` — sau Cập nhật chăm sóc. **Thêm công việc** → API cũng ghi lịch sử chăm sóc (ghi chú = nội dung việc; không đổi trạng thái / tài chính / nhu cầu). **Hoàn thành** việc → lần chăm sóc đó `completedAt` (UI hangtag **Đã hoàn thành**).
- `/dich-vu-so-do` — sau Xem chi tiết. **Thêm công việc** trên sổ đỏ → API cũng tạo bước tiến độ `CONG_VIEC` (ghi chú = nội dung việc). **Hoàn thành** việc → bước đó `completedAt` (UI hangtag **Đã hoàn thành**).

## 12.5 Modal chi tiết công việc

Mở khi bấm dòng / thẻ / **Xem chi tiết**. `CrmDialog` §4.7. Icon `ListTodo`. Tiêu đề: **Công việc**.

Nội dung (`content`; đã xong → gạch ngang). Dòng nguồn (`NONE` → «TRANG CÔNG VIỆC»; sổ đỏ → «DỊCH VỤ SỔ ĐỎ | …»). Hạn `D/M/YYYY` + hangtag đếm ngược nếu chưa xong; đã xong → hangtag **Đã hoàn thành** (`green`), **không** đếm hạn.

**Chưa xong:** **Đóng** · **Hoàn thành** (primary). Busy khi PATCH. Xong: đóng, toast «Đã hoàn thành công việc.»

**Đã xong:** chỉ **Đóng** (không Hoàn thành).

## 12.6 Modal Sửa công việc

Mở từ menu **Sửa** (chỉ việc chưa xong). `CrmDialog` §4.7. Icon `ListTodo`. Tiêu đề: **Sửa công việc**.

- Dòng nguồn: cùng 12.3.1 — **không sửa** (`taskContextLine`).
- Prefill `content` + `dueOn`. Có nút **Hôm nay**.
- **Huỷ** · **Lưu** (primary). Toast «Đã cập nhật công việc.»
- Đổi nội dung → cập nhật ghi chú care / tiến độ `CONG_VIEC` gắn `workTaskId` (nếu có). **Không** đổi nguồn / ghim / hoàn thành.
