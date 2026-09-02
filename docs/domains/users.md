# Domain: Users (Đăng nhập / nhân viên)

- **Slug:** `users`
- **Status:** Ready for API — `/login` nối bảng User; quản lý NV `/quan-tri/nguoi-dung` (ADMIN); avatar NV
- **Nguồn:** CRM cũ `/login` + quản trị user (đọc hiểu, không copy god-file)
- **UI:** [`UI-GUIDELINES.md`](../UI-GUIDELINES.md) login; shell avatar
- **Contract:** `packages/shared/src/auth.ts`

Slice này: **đăng nhập / đăng xuất** + **quản lý nhân viên** (ADMIN). CRM cũ: modal user tương đương.

**Thứ tự copy:** User **trước** (FK `employeeId` bắt buộc). Hotline nguồn **trước hoặc sau** khách (`sourceHotlineId` cho phép trống). SĐT / FB / chăm sóc **sau** map khách. `MIGRATION.md`.

---

## 1. Mục đích

Nhân viên / admin vào CRM bằng username + mật khẩu. Mọi khách / lô gắn `employeeId` → **phải có User trước** khi copy khách.

## 2. Actors

| Actor | Được | Không |
|-------|------|--------|
| Chưa login | `/login` | Mọi trang CRM |
| STAFF | Vào CRM; khách của mình (khi có API) | CRUD user; registry |
| ADMIN | Vào CRM; (sau) quản lý NV | — |
| `isActive = false` | — | Login |

## 3. Khái niệm

| Thứ | Nghĩa |
|-----|--------|
| User | `tblUsers` cũ → Prisma `User` (username, họ tên, SĐT, mật khẩu hash, avatar) |
| STAFF / ADMIN | `UserRole` |
| Avatar | Ảnh NV public R2 (`avatarObjectKey`) → CDN `avatarUrl`. Trống = chữ tắt họ tên |
| Refresh token | Hash trong DB; rotation; revoke lúc logout |

Mật khẩu: bcrypt cost ≥ 12. Không lưu plaintext.

## 4. Use cases

1. **Đăng nhập** — username + mật khẩu → JWT access + refresh → ADMIN `/dashboard`, STAFF `/khach-hang`
2. **Sai / khoá** — cùng câu: «Tên đăng nhập hoặc mật khẩu không đúng»; user `isActive=false` không vào được
3. **Phiên** — F5: còn refresh thì `/auth/me`; hết hạn → `/login`
4. **Đăng xuất** — avatar menu → revoke refresh → `/login`

## 5. Quan hệ

`User` 1–n `Customer` (owner), hotline, page FB, care note, refresh token.

Copy data: **User trước** (`employeeId` bắt buộc). Hotline nguồn có thể sau khách rồi gắn `sourceHotlineId`. Bảng phụ (SĐT, FB, chăm sóc) sau map `customer`.

## 6. UI

| Màn | Route | Việc |
|-----|-------|------|
| Login | `/login` | Form đăng nhập |
| CRM | sau login | ADMIN → `/dashboard` (trang đầu); STAFF → `/khach-hang` (header **Đăng web** → `/dashboard/lo-dat`) |
| Quản lý NV | `/quan-tri/nguoi-dung` | ADMIN — bảng NV; thêm / sửa / xoá / reset MK |

### 6.1 Giao diện máy tính — `/login`

```
┌ Logo + Đăng nhập CRM ─┐
├ Tên đăng nhập         │
├ Mật khẩu              │
└ [ Đăng nhập ]         ┘
```

1. Link «Về trang khách»
2. Ô tên đăng nhập
3. Ô mật khẩu
4. Nút Đăng nhập → ADMIN `/dashboard`, STAFF `/khach-hang`
5. Lỗi dưới form (tiếng Việt)

### 6.2 Giao diện mobile — `/login`

Cùng control 6.1. Ô nhập ≥ 16px (không zoom). Nút đủ vùng chạm.

### 6.3 Giao diện máy tính — `/quan-tri/nguoi-dung` (ADMIN)

```
┌ Quản lý người dùng ─────────────── [ + Thêm mới ] ─┐
├ # │ Avatar │ User │ Họ tên │ SĐT │ Vai trò │ Trạng thái │ Sửa │ Reset MK │ Xoá ┤
└──────────────────────────────────────────────────────────────────────────────┘
```

1. Chỉ ADMIN; STAFF redirect `/khach-hang`
2. Nút **Thêm mới** → modal: user, mật khẩu, họ tên, SĐT, vai trò, avatar
3. **Sửa** → modal (không đổi mật khẩu ở đây); đổi / gỡ avatar
4. **Reset MK** → modal nhập mật khẩu mới
5. **Xoá** → confirm; không xoá NV đã có khách/lô/giao dịch/sổ đỏ hoặc chính mình
6. Cột **Avatar** — ảnh tròn 32px (CDN); trống = chữ tắt. Chỉ thể hiện; bấm **Sửa** để đổi
7. Modal avatar — chọn jpg/png/webp; preview; **Gỡ ảnh** khi đã có. Lưu: PATCH field; file mới → `POST /users/:id/avatar`; gỡ → `DELETE /users/:id/avatar`

### 6.4 Giao diện mobile — `/quan-tri/nguoi-dung`

Cùng cột (kể cả Avatar 32px); cuộn ngang bảng. Nút thêm full-width trên header.

## 7. API (đã có)

Prefix `/api/v1`

| Method | Path | Auth |
|--------|------|------|
| POST | `/auth/login` | Public; throttle |
| POST | `/auth/refresh` | Public |
| POST | `/auth/logout` | Public (body refresh) |
| GET | `/auth/me` | JWT |
| GET | `/users` | ADMIN — list NV |
| POST | `/users` | ADMIN — tạo NV |
| PATCH | `/users/:id` | ADMIN — sửa NV |
| POST | `/users/:id/avatar` | ADMIN — multipart `file` (ảnh → WebP R2) |
| DELETE | `/users/:id/avatar` | ADMIN — gỡ avatar |
| DELETE | `/users/:id` | ADMIN — xoá NV (nếu không còn dữ liệu) |
| POST | `/users/:id/reset-password` | ADMIN — đặt lại mật khẩu |

`GET /users`, `POST /users`, `PATCH /users/:id`, `/auth/me` trả `avatarUrl` (CDN) khi có ảnh. Header CRM dùng ảnh đó; không nhét URL vào JWT.

Zod: `packages/shared/src/auth.ts`.

## 8. Tài khoản

- Login CRM gọi API `/auth/login` + bảng `User` (copy từ CRM cũ: `kha`, `buinam`, `admin`).
- **Không** seed / login giả `staff`/`staff123` hay `admin`/`admin123`.
- Local trống User: chạy migrate legacy (`docs/MIGRATION.md`), không tạo user nháp.

## 9. Extension?

- [x] Có — sau: cùng username/password API mới (chưa làm slice này)

## 10. Migrate `tblUsers`

Sau freeze CRM cũ:

1. Copy user → `public.User`
2. Map ID → `migrate.legacy_id_map` (entity `user`)
3. Giữ `username`, `role`, `isActive`, **passwordHash** nếu cùng bcrypt
4. Rồi mới copy khách (`employeeId` = id mới)

## 11. Việc tiếp theo (login → khách)

1. ~~Nối `/login` → API + copy `tblUsers`~~
2. ~~Copy khách cơ bản~~ (`customers.md` §13)
3. ~~Copy hotline nguồn + gắn `sourceHotlineId`~~
4. Copy profile Facebook NV + metadata FB khách (cột Kênh liên hệ)
5. Bảng phụ theo todo `MIGRATION.md` (SĐT, chăm sóc, …)
6. ~~P4: CRUD nhân viên~~ — `/quan-tri/nguoi-dung`
