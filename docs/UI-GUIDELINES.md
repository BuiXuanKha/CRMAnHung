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
- **UI list `/khach-hang`:** mock theo **4.3.1–4.3.4** (tìm/lọc, bảng, menu hành động, rail phải). Chi tiết `[id]` vẫn placeholder.

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
│ NỘI DUNG: tìm/lọc (§4.3.4) + bảng (§4.3.1) + rail (§4.3.2) │
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

### 4.3 Nội dung trang

Phần **dưới navbar** — từng màn (ưu tiên `/khach-hang`).

#### 4.3.1 Bảng dữ liệu (đã chốt — theo ảnh mẫu)

Mọi **danh sách dạng bảng** trên CRM (ví dụ **Danh sách khách hàng**) phải gồm **đúng 3 khối**, nhìn giống ảnh mẫu chủ sở hữu gửi:

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER bảng — tên cột (nền xám/xanh rất nhạt, chữ đậm)      │
├──────────────────────────────────────────────────────────────┤
│ DÒNG dữ liệu × N                                             │
│  (một số dòng nền vàng nhạt = nổi bật / ưu tiên)             │
│  viền trái xanh mỏng · ngăn dòng bằng đường ngang mảnh       │
├──────────────────────────────────────────────────────────────┤
│ FOOTER — góc phải: «Hiển thị N / Tổng M khách hàng»          │
└──────────────────────────────────────────────────────────────┘
```

| Khối | Quy tắc |
|------|---------|
| **Header** | Một hàng cố định; chỉ **tên cột**; nền xám-xanh rất nhạt; chữ đậm tối |
| **Dòng dữ liệu** | Mỗi record một dòng; ô trống hiện `—`; mật độ thông tin **đặc** (nhiều cột, chữ gọn) |
| **Footer** | Dưới bảng, căn phải; chữ nhỏ xám: **Hiển thị {đang xem} / Tổng {tổng} …** |

**Cột mẫu — Danh sách khách hàng** (desktop):

| Cột | Nội dung ô |
|-----|------------|
| `#` | Số thứ tự hẹp |
| `Tên khách` | Avatar tròn + **tên đậm** + badge trạng thái (vd. «Khách nét» xanh lá / «Khách mới» xanh dương) + icon kênh nhỏ (SĐT/chat) cạnh tên; có thể có dòng phụ nhạt dưới tên |
| `Nhu cầu` | Mô tả ngắn hoặc `—` |
| `Tài chính` | Khoảng ngân sách (vd. `1,5 tỷ - 2 tỷ`) hoặc `—` |
| `Kênh liên hệ` | Link/chữ **xanh** (tên NV, SĐT+ghi chú Zalo, Page…) |
| `Thao tác` | Nút vuông xám nhạt → **menu hành động** (§4.3.3); không rải nhiều nút trên dòng |

**Nhìn / token (bám ảnh):**

- Nền trang/bảng trắng; dòng nổi bật: vàng nhạt (~`#FFF9E6`)
- Accent link / viền trái dòng: xanh primary CRM
- Badge nhỏ, bo góc nhẹ; không card trang trí quanh bảng
- Container bảng: bo góc nhẹ + đổ bóng rất nhẹ (tuỳ implement, không phồng)

**Chưa chốt (hỏi tiếp):** layout mobile (bảng cuộn ngang vs thẻ; thanh lọc xếp dọc?); cảm giác màu toàn CRM ngoài bảng; hành vi rail khi mở nhiều panel cùng lúc vs chỉ một.

| Hạng mục | Quyết định | Ghi chú |
|----------|------------|---------|
| Cảm giác tổng thể | *(chờ)* | Bảng: sạch, trắng + vàng nhạt + xanh link |
| Màu chủ đạo CRM | *(chờ palette đầy đủ)* | Xanh primary + vàng highlight dòng |
| Font | *(chờ)* | Sans-serif UI, không marketing display |
| Trang khách hàng: layout chính | Tìm/lọc trên + **bảng** trái + **rail phải** | §4.3.1–4.3.4 |
| Thao tác trên dòng | **Menu hành động** (dropdown) | §4.3.3 |
| Mobile: ưu tiên thẻ hay list | *(chờ)* | |
| Mật độ thông tin | **Đặc** trên desktop | |
| Tránh tuyệt đối | Bảng xám nhàm không badge/highlight; thiếu footer đếm; thiếu header cột | |

#### 4.3.2 Rail phải — mở rộng / thu hẹp (đã chốt — theo ảnh mẫu)

Không phải sidebar điều hướng (nav chính vẫn là navbar ngang §4.2). Đây là **cột phụ bên phải** của nội dung trang: nhiều **thanh dọc hẹp** xếp cạnh nhau; bấm để **mở rộng / thu hẹp** panel chi tiết.

```
┌──────────────────────────────┬────┬────┬────┐
│ BẢNG / nội dung chính        │ C  │ L  │ Đ  │
│ (§4.3.1)                     │ h  │ ị  │ ấ  │
│                              │ a  │ c  │ t  │
│                              │ t  │ h  │    │
└──────────────────────────────┴────┴────┴────┘
     thu hẹp: chỉ thấy thanh dọc + chữ xoay 90°
     mở rộng: panel bung sang trái, hiện nội dung đầy đủ
```

**Khi thu hẹp** (trạng thái mặc định trên ảnh):

| Chi tiết | Quy tắc |
|----------|---------|
| Hình dạng | Thanh dọc hẹp, bo góc, xếp **cạnh nhau** bên phải |
| Đỉnh thanh | Icon chevron **sang trái** (`‹`) — gợi ý «mở ra» |
| Nhãn | Chữ **xoay 90°** (đọc từ dưới lên), tiếng Việt |
| Active | Thanh đang chọn: nền **xanh nhạt**, chữ/icon xanh; các thanh khác: nền trắng, chữ tối |

**Nhãn mẫu — trang khách hàng** (theo ảnh, trái → phải):

1. **Nội dung chat**
2. **Lịch sử chăm sóc**
3. **Danh sách lô đất**

**Khi mở rộng:** panel bung sang trái, hiện dữ liệu của đúng nhãn đó (chat / lịch sử / lô đất). Đóng lại thì thu về thanh dọc.

Implement: một component rail dùng lại được (không copy layout god-file CRM cũ); gắn vào layout nội dung `/khach-hang` (và màn list tương tự khi cần).

#### 4.3.3 Menu hành động (đã chốt — theo ảnh mẫu)

Cột **Thao tác** trên mỗi dòng bảng: **một nút** mở **menu hành động** (dropdown/popover). Không hiện hàng loạt nút trên dòng.

**Nút mở:**

| Trạng thái | Hình |
|------------|------|
| Đóng | Nút vuông bo góc, nền xám nhạt, **chevron xuống** |
| Mở | Cùng nút, **chevron lên**; dòng đang mở menu **nền vàng nhạt** |

**Menu (khi mở):** thẻ trắng nổi, bo góc, đổ bóng nhẹ; mỗi mục = icon trái + chữ tiếng Việt.

**Mục mẫu — khách hàng** (trên → dưới, theo ảnh):

| Mục | Ghi chú |
|-----|---------|
| Mở chat | |
| Mở Messenger | |
| Cập nhật chăm sóc | |
| Tạo lô đất | |
| Dịch vụ sổ đỏ | |
| Bỏ ghim khách | (hoặc «Ghim khách» tùy trạng thái — chưa tách rule) |
| **Xóa khách** | **Màu đỏ** (icon + chữ) — hành động phá hủy |

Chỉ **một** menu mở tại một thời điểm. Bấm ra ngoài / chọn mục / bấm lại nút → đóng.

#### 4.3.4 Section tìm kiếm và lọc (đã chốt — theo ảnh mẫu)

Một **hàng ngang** phía **trên bảng**, trong khung trắng bo góc, viền xám rất mỏng. Không nhồi filter thành nhiều hàng trừ khi màn hẹp.

```
┌──────────────────────────────────────────────────────────────┐
│ [  ô tìm kiếm rộng …          ] [▼] [▼] [▼] [▼] [▼]         │
└──────────────────────────────────────────────────────────────┘
```

| Phần | Quy tắc |
|------|---------|
| **Ô tìm** (trái, ~40–50% bề ngang) | Input một dòng; placeholder: `Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)` |
| Focus | Viền **xanh** |
| **Lọc** (phải) | 5 select cùng hàng, viền xám nhạt, chevron xuống |

**Select mặc định — trang khách hàng** (trái → phải):

1. Tất cả trạng thái  
2. Tất cả tài chính  
3. Tất cả kênh liên hệ  
4. Tất cả lô đất  
5. Tất cả nhu cầu  

Ô tìm lọc theo tên / SĐT / nhu cầu / ghi chú. Gợi ý trong placeholder: `@` = gồm bản ghi đã xóa; `@@` = chỉ bản ghi đã xóa (giữ nguyên nghĩa khi implement).

Đổi ô tìm hoặc select → cập nhật bảng bên dưới (mock: lọc client; sau: API).

### 4.4 Checklist trước khi merge UI CRM

- [ ] Đúng quy tắc mục 3 + shell mục 4.2 + nội dung đã chốt ở 4.3
- [ ] Desktop + mobile xem ổn
- [ ] Trạng thái trống / loading / lỗi có UI
- [ ] Không lộ mục chỉ dành cho Admin với user STAFF
- [ ] Header + navbar đúng cấu trúc 4.2 trên mọi trang CRM
- [ ] Bảng danh sách: đủ header cột + dòng + footer đếm (§4.3.1); giống ảnh mẫu
- [ ] Rail phải: thanh dọc chữ xoay + mở rộng/thu hẹp (§4.3.2); giống ảnh mẫu
- [ ] Menu hành động cột Thao tác: chevron + danh sách mục; Xóa khách màu đỏ (§4.3.3)
- [ ] Thanh tìm + 5 select lọc phía trên bảng (§4.3.4); giống ảnh mẫu

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
| 2026-08-17 | Gỡ UI mock `/khach-hang` (list/detail) — placeholder chờ chốt nội dung trang |
| 2026-08-17 | **Chốt shell CRM:** header (logo+tên, user, cài đặt, đăng xuất) + navbar ngang (4 mục STAFF) |
| 2026-08-17 | **Chốt bảng dữ liệu (§4.3.1):** header cột + dòng + footer «Hiển thị N / Tổng M»; mẫu cột `/khach-hang` theo ảnh |
| 2026-08-17 | **Chốt rail phải (§4.3.2):** thanh dọc chữ xoay 90°; mở rộng / thu hẹp; nhãn Chat · Lịch sử chăm sóc · Danh sách lô đất |
| 2026-08-17 | **Chốt menu hành động (§4.3.3):** dropdown cột Thao tác; chevron lên/xuống; Xóa khách đỏ |
| 2026-08-17 | **Chốt tìm/lọc (§4.3.4):** ô tìm rộng + 5 select (trạng thái, tài chính, kênh, lô đất, nhu cầu) |
| 2026-08-17 | Mock UI `/khach-hang` theo §4.2 + §4.3.1–4.3.4 (chưa chốt mobile) |

---

## 9. Liên kết

- Playbook: [`PLAYBOOK.md`](./PLAYBOOK.md)
- Skill mock UI: `.cursor/skills/ui-mock-feature`
- Skill đọc quy tắc UI: `.cursor/skills/ui-guidelines`
- Domain khách hàng: [`domains/customers.md`](./domains/customers.md)
