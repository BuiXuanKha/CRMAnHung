# Quy tắc UI — CRMAnHung

- **Slug:** `ui-guidelines`
- **Vai trò:** **Nguồn sự thật duy nhất** cho giao diện Web (agent + người cùng bám)
- **Phạm vi:** `apps/web` — trang khách (public) **và** CRM sau login (nhân viên / admin)
- **Không phải:** copy UI CRM cũ (`crm.anhungland.com`) theo mặc định

> Mọi màn UI mới / sửa lớn: **đọc file này trước**, rồi mới code.  
> Quy tắc do chủ sở hữu chốt được ghi vào đây; agent không tự ý đổi hướng visual.

---

## 1. Cách dùng tài liệu này

| Ai | Việc |
|----|------|
| Chủ sở hữu | Mô tả / chỉnh **quy tắc** trong các mục dưới (đặc biệt mục đã đánh dấu *Chờ chốt*) |
| Agent / dev | Bám quy tắc đã chốt; thiếu chỗ → hỏi hoặc ghi `TODO` trong PR, **không** đoán theo CRM cũ |

**Thứ tự khi làm UI**

1. Đọc `UI-GUIDELINES.md` (file này)
2. Domain liên quan trong `docs/domains/`
3. Public thì thêm `PUBLIC-WEB.md` + `PUBLIC-SEO.md`
4. Skill `ui-mock-feature` / `web-public-seo` tùy loại trang
5. Code mock → (sau) API

---

## 2. Hai bề mặt sản phẩm (tách rõ)

| Bề mặt | URL / khu | Người dùng | Mục tiêu UI |
|--------|-----------|------------|-------------|
| **Public** | `anhungland.com` — `(public)/` | Khách, không login | Brand, sản phẩm, tin; SEO |
| **CRM** | sau `/login` — `(crm)/` | Nhân viên, Admin | Làm việc nhanh, rõ dữ liệu, thao tác chính |

- **Không** dùng layout marketing (hero lớn, landing) cho CRM.
- **Không** nhồi dữ liệu CRM / PII lên public.

---

## 3. Nguyên tắc chung (đã chốt hướng)

1. **Một việc / một màn** — headline + thao tác chính rõ; tránh nhồi mọi thứ lên fold đầu.
2. **Ưu tiên thao tác thật** — tìm, lọc, thêm, mở chi tiết, gọi/SĐT… phải dễ thấy, dễ bấm (mobile ≥ vùng chạm thoải mái).
3. **Nhất quán** — cùng pattern nút, form, bảng/list, trạng thái (badge) trên mọi màn CRM.
4. **Tiếng Việt trên UI**; code/comment tiếng Anh.
5. **Responsive** — desktop và điện thoại đều dùng được; không chỉ “co bảng”.
6. **Không copy god-UI** từ FacebookCustomerCRM; nghiệp vụ lấy từ docs/domain, hình thức theo file này.
7. **CSS variables** — màu / radius / khoảng cách tập trung (CRM shell vs public có thể khác token).

---

## 4. CRM nhân viên (STAFF)

Phạm vi ưu tiên hiện tại: màn sau login, đặc biệt **Quản lý khách hàng**.

### 4.1 Đã thống nhất tạm

- Không bắt buộc giống pixel CRM cũ từng chi tiết; **cấu trúc shell** theo mục 4.2 (đã chốt).
- Admin UI: **chưa làm** cho đến khi STAFF ổn.
- Mock được (`NEXT_PUBLIC_USE_MOCK`); không gọi API production CRM cũ.
- **UI list/detail `/khach-hang` bản mock cũ đã gỡ** — đang để placeholder; làm lại sau khi nội dung trang (mục 4.3) được chốt.

### 4.2 Shell CRM chung (đã chốt) — mọi trang sau login

Phần **chung** (AppShell), không thuộc nội dung từng trang:

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER                                                      │
│  Trái: logo + tên «An Hưng Land CRM»                        │
│  Phải: «Họ tên | Nhân viên/Admin» · Cài đặt · Đăng xuất     │
├─────────────────────────────────────────────────────────────┤
│ NAVBAR (Thanh điều hướng) — menu ngang                      │
│  · Quản lý khách hàng                                       │
│  · Quản lý lô đất                                           │
│  · Quản lý giao dịch                                        │
│  · Dịch vụ sổ đỏ                                            │
│  (+ mục Admin chỉ hiện với role ADMIN, khi làm sau)         │
├─────────────────────────────────────────────────────────────┤
│ NỘI DUNG TRANG (riêng từng route — chưa chốt chi tiết)      │
└─────────────────────────────────────────────────────────────┘
```

| Hạng mục | Quyết định |
|----------|------------|
| Kiểu shell | **Header trên + navbar ngang** (không dùng sidebar làm nav chính) |
| Header trái | Logo + tên ứng dụng **An Hưng Land CRM** |
| Header phải | Tên người dùng + vai trò, nút **Cài đặt**, nút **Đăng xuất** |
| Navbar | Menu ngang; mục đang mở phải **active** rõ (nền/viền/chữ nổi) |
| Mobile | Navbar vẫn dùng được (cuộn ngang hoặc tương đương); không ẩn mất mục chính |

Implement: `apps/web` layout CRM (`(crm)/layout` → `AppShell`). Đổi shell = đổi một chỗ, áp mọi trang CRM.

### 4.3 Nội dung trang (chờ chốt)

Phần **dưới navbar** — từng màn (ưu tiên `/khach-hang`):

| Hạng mục | Quyết định | Ghi chú |
|----------|------------|---------|
| Cảm giác tổng thể | *(vd. hiện đại / gọn / ấm /…)* | |
| Màu chủ đạo CRM | | Xanh primary kiểu CRM làm việc là hướng tham chiếu từ shell |
| Font | | |
| Trang khách hàng: layout chính | *(list + panel / full table / cards…)* | |
| Thao tác luôn hiện vs menu ⋮ | | |
| Mobile: ưu tiên thẻ hay list | | |
| Mật độ thông tin (thoáng / đặc) | | |
| Tránh tuyệt đối | *(vd. bảng xám nhàm, quá nhiều filter…)* | |

### 4.4 Checklist trước khi merge UI CRM

- [ ] Đúng quy tắc mục 3 + shell mục 4.2 + nội dung đã chốt ở 4.3
- [ ] Desktop + mobile xem ổn
- [ ] Trạng thái trống / loading / lỗi có UI
- [ ] Không lộ mục chỉ dành cho Admin với user STAFF
- [ ] Header + navbar đúng cấu trúc 4.2 trên mọi trang CRM
---

## 5. CRM Admin

- **Tạm hoãn** UI riêng.
- Khi làm: bổ sung mục này (quyền, registry, cảnh báo phá hủy dữ liệu…).

---

## 6. Public (trang khách)

Giữ các doc chuyên biệt — **không mâu thuẫn** với file này:

- [`PUBLIC-WEB.md`](./PUBLIC-WEB.md) — IA / nội dung
- [`PUBLIC-SEO.md`](./PUBLIC-SEO.md) — SEO bắt buộc

Brand An Hưng Land (đỏ dịu / vàng) áp dụng **public**; CRM có thể dùng palette riêng nếu mục 4 chốt khác.

---

## 7. Anti-patterns (cấm / tránh)

- Làm UI CRM bằng cách “clone cảm giác” CRM cũ khi chủ sở hữu **không** yêu cầu.
- Form / bảng không có trạng thái rỗng hoặc lỗi.
- Nút quan trọng chỉ hiện trong menu sâu trên mobile.
- Trộn token màu public (đỏ-vàng landing) vào CRM nếu chưa chốt.
- Card trang trí không phục vụ thao tác (CRM).

---

## 8. Lịch sử chốt ngắn

| Ngày | Nội dung |
|------|----------|
| 2026-08-17 | Tạo `UI-GUIDELINES.md` làm nơi quy tắc UI chung; không mock theo CRM cũ làm mặc định; chờ mô tả UI nhân viên từ chủ sở hữu |
| 2026-08-17 | Gỡ UI mock `/khach-hang` (list/detail) — placeholder chờ chốt mục 4.2 |

---

## 9. Liên kết

- Playbook: [`PLAYBOOK.md`](./PLAYBOOK.md)
- Skill mock UI: `.cursor/skills/ui-mock-feature`
- Skill đọc quy tắc UI: `.cursor/skills/ui-guidelines`
- Domain khách hàng: [`domains/customers.md`](./domains/customers.md)
