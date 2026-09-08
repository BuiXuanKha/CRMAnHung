# Domain: Công việc

- **Slug:** `tasks`
- **Status:** Ready for mock — khung trang `/cong-viec` (menu header). **Chưa** form tạo / API / dữ liệu.
- **Owner:** Khả Bùi Xuân
- **Liên quan hệ cũ:** không có màn tương đương trên `crm.anhungland.com` (không copy)

Chủ sở hữu (2026-09-08): trang **nhắc nhở / ghi chú nhỏ** cho việc cần làm. Nội dung và cách tạo việc / lời nhắc **bàn sau** — không bịa field.

---

## 1. Mục đích

Một chỗ trên CRM để nhân viên (và Admin) xem việc mình cần làm — giống sổ nhắc, không phải quản lý khách / lô / giao dịch.

## 2. Actors & quyền

| Actor | Được làm (slice này) | Không được |
|-------|----------------------|------------|
| STAFF | Mở `/cong-viec` từ menu header | Tạo / sửa / xóa việc (chưa chốt) |
| ADMIN | Cùng trang khung | Tạo / sửa / xóa việc (chưa chốt) |

Quyền xem việc của người khác: **chưa chốt** (mặc định slice này: mỗi người vào cùng trang trống).

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| Công việc | Một việc cần làm hoặc lời nhắc — **chưa chốt** field |
| Trang Công việc | Màn `/cong-viec` sau login |

**State machine / enum:** chưa có. Không bịa `OPEN` / `DONE`.

## 4. Use cases

1. **Mở trang từ header** — đăng nhập → bấm **Công việc** → vào `/cong-viec`.
2. **Xem khung trống** — chưa có việc; không nút thêm.
3. **Tạo việc / lời nhắc** — **chưa** (chủ sẽ bảo sau).

## 5. Quan hệ dữ liệu

- Entity chính: **chưa có** (không bảng Prisma slice này).
- Ownership: sẽ theo người đăng nhập khi có API — **chưa chốt**.

## 6. UI (màn hình)

| Màn | Route | Hành vi chính |
|-----|-------|----------------|
| Công việc | `/cong-viec` | Khung nhắc việc; trạng thái trống |
| Tạo / chi tiết | — | Chưa có |

Đặc tả: **12.1 máy tính** → **12.2 mobile**. Không trộn PC/mobile trong một mục.

## 7. Contract / API dự kiến

Prefix: `/api/v1/...` — **chưa chốt**. Không endpoint slice này.

Hằng số route: `TASKS_WEB_PATH` trong `packages/shared/src/tasks.ts`.

## 8. Mock data cần có

- Không bản ghi giả.
- Case biên slice này: **trống** (duy nhất).

## 9. Extension?

- [x] Không

## 10. Migrate từ hệ cũ

Không có bảng / màn CRM cũ để map.

## 11. Open questions

- Tạo việc / lời nhắc thế nào (nút, form, nhanh từ list khách…)?
- Field: tiêu đề, ghi chú, hạn, gắn khách/lô?
- Việc của mình thôi hay Admin thấy cả công ty?
- Có thông báo (chuông, badge menu) không?

---

## 12. Trang `/cong-viec`

Thứ tự: **12.1 máy tính** → **12.2 mobile**.

### 12.1 Giao diện máy tính

```
┌ Header CRM (menu có Công việc, chữ xanh khi đang ở trang) ─┐
├ Tiêu đề: Công việc                                           ┤
├ Một câu: trang nhắc việc / ghi chú nhỏ                       ┤
└ Khối trống giữa: «Chưa có công việc.»                        ┘
```

#### 12.1.1 Menu header

Mục **Công việc** trên hàng menu (cùng vạch đứng §4.2). Icon Lucide `ListTodo`. Active: chữ xanh `#2563eb` 700.

Bấm → `/cong-viec`.

#### 12.1.2 Tiêu đề trang

`h1` **Công việc**. Một dòng phụ: trang nhắc việc và ghi chú nhỏ cho việc cần làm.

#### 12.1.3 Khối trống

Khối giữa, nền trắng, viền `#e2e8f0`, bo 12px.

1. Icon `ListTodo` — chỉ thể hiện
2. «Chưa có công việc.»
3. «Cách tạo việc và lời nhắc sẽ bàn sau.»

**Không** nút Thêm. **Không** bảng giả.

### 12.2 Giao diện mobile

Cùng nội dung 12.1. Menu = hamburger header (đã chốt shell). Không bảng, không FAB thêm.
