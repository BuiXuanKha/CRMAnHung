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
| Kiểu shell | **Header trên + navbar ngang**, **full chiều ngang viewport** (workbench, không khung hẹp giữa trang) |
| Header trái | Logo + tên ứng dụng **An Hưng Land CRM** |
| Header phải | Tên người dùng + vai trò, nút **Cài đặt**, nút **Đăng xuất** |
| Navbar | Nhãn «Thanh điều hướng» trái; **menu căn phải**; mục active nền xanh nhạt |
| Typography CRM | **Noto Sans**, gốc **14px** (public vẫn Be Vietnam Pro) |
| Mobile | Navbar vẫn dùng được (cuộn ngang hoặc tương đương); không ẩn mất mục chính |

**Phân cấp trang khách hàng (`/khach-hang`):**

1. Header (shell)  
2. Thanh điều hướng (shell)  
3. Nội dung trang  
   - 3.1 Tiêu đề trái + nút hành động phải  
   - 3.2 Hai cột  
     - 3.2.1 Trái: 3.2.1.1 lọc → 3.2.1.2 bảng (scroll nội bộ)  
     - 3.2.2 Phải: rail thu hẹp / mở rộng  

Implement: `apps/web` layout CRM (`(crm)/layout` → `AppShell`). Đổi shell = đổi một chỗ, áp mọi trang CRM.

### 4.3 Nội dung trang

Phần **dưới navbar** — từng màn (ưu tiên `/khach-hang`).

#### 4.3.1 Bảng dữ liệu — mẫu trang khách hàng

Mọi bảng list CRM tuân **§4.5** (shared). Dưới đây là **cột / nội dung** riêng `/khach-hang`:

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER cột · THÂN dòng · FOOTER đếm — xem §4.5               │
└──────────────────────────────────────────────────────────────┘
```

**Cột mẫu — Danh sách khách hàng** (desktop):

| Cột | Nội dung ô |
|-----|------------|
| `#` | Số thứ tự hẹp |
| `Tên khách` | Avatar tròn + **tên đậm** + badge trạng thái (vd. «Khách nét» xanh lá / «Khách mới» xanh dương) + icon kênh nhỏ (SĐT/chat) cạnh tên; có thể có dòng phụ nhạt dưới tên |
| `Nhu cầu` | Mô tả ngắn hoặc `—` |
| `Tài chính` | Khoảng ngân sách (vd. `1,5 tỷ - 2 tỷ`) hoặc `—` |
| `Kênh liên hệ` | Link/chữ **xanh** (tên NV, SĐT+ghi chú Zalo, Page…) |
| `Thao tác` | Nút vuông → **menu hành động** (§4.3.3) |

**Chưa chốt (hỏi tiếp):** layout mobile (bảng cuộn ngang vs thẻ; thanh lọc xếp dọc?); hành vi rail khi mở nhiều panel cùng lúc vs chỉ một.

| Hạng mục | Quyết định | Ghi chú |
|----------|------------|---------|
| Cảm giác tổng thể | Workbench, đặc | Theo §4.2 + §4.5 |
| Màu chủ đạo CRM | Xanh `#2563eb` + vàng ghim | §4.5 |
| Font | **Noto Sans**, gốc 14px | §4.2 / §4.5 |
| Trang khách hàng: layout chính | Tìm/lọc trên + **bảng** trái + **rail phải** | §4.3.1–4.3.4 |
| Thao tác trên dòng | **Menu hành động** (dropdown) | §4.3.3 |
| Mobile: ưu tiên thẻ hay list | *(chờ)* | |
| Mật độ thông tin | **Đặc** trên desktop | |
| Tránh tuyệt đối | Invent style bảng khác §4.5; thiếu footer; scroll cắt header cột | |

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

### 4.5 Bảng danh sách CRM — dùng chung (đã chốt)

Áp dụng **mọi** màn CRM có list dạng bảng (khách hàng, lô đất, giao dịch, sổ đỏ…).  
Cột / dữ liệu đổi theo domain; **hình thức** (font, hover, scroll, icon, footer…) **một bộ**.  
Skill: `crm-data-table`. Tham chiếu triển khai: `/khach-hang` (`features/customers`).

#### 4.5.1 Cấu trúc bắt buộc

```
┌─ container (bo góc 12px, viền #e2e8f0, nền trắng) ─────────────┐
│ HEADER CỘT — cố định, NGOÀI vùng overflow                      │
├────────────────────────────────────────────────────────────────┤
│ THÂN DÒNG — đây mới có thanh cuộn dọc                           │
├────────────────────────────────────────────────────────────────┤
│ FOOTER — «Hiển thị N / Tổng M …» căn phải                      │
└────────────────────────────────────────────────────────────────┘
```

| Khối | Quy tắc |
|------|---------|
| Header cột | Nền `#f1f5f9` phủ **hết bề ngang** (kể cả góc phải); chữ `#0f172a` **600**; **không** nằm trong vùng `overflow` |
| Thân | Chỉ thân có scrollbar; header + footer đứng yên khi cuộn; **không** để khe trống góc header vì bù scrollbar |
| Footer | Cùng nền header `#f1f5f9`; chữ `0.85rem` `#475569`; số **đậm** `#0f172a` |
| Ô trống | Luôn hiện `—` |
| Trống list | Một dòng/khối giữa: «Không có … phù hợp.» |

#### 4.5.2 Typography & màu chữ

| Phần | Cỡ / weight | Màu |
|------|-------------|-----|
| Toàn CRM shell | Noto Sans, gốc **14px**, line-height 1.5 | `#111827` |
| Lưới bảng (gốc) | **0.84rem** | kế thừa |
| Tên / primary cell | **600** | `#0f172a` |
| Dòng phụ (vd. tên FB) | **0.78rem**, italic | `#64748b` |
| Nhu cầu / mô tả | **0.82rem** | `#334155` |
| Số tiền / tài chính | **0.82rem**, **600** | `#0f172a` |
| Link / kênh liên hệ | **0.78rem**, **600** | `#2563eb` (primary) |
| Cột `#` | **700**, tabular | `#1e40af` |
| Badge trạng thái | **0.72rem**, **600** | theo tone bên dưới |

**Không** dùng font marketing (Be Vietnam Pro) trong CRM list.

#### 4.5.3 Trạng thái dòng (hover / selected / nổi bật)

| Trạng thái | Nền | Ghi chú |
|------------|-----|---------|
| Mặc định | `#fff` | Viền dưới `#f1f5f9` |
| **Hover** | `#f1f5f9` | Cả dòng |
| **Selected** (đang chọn) | `#eff6ff` | Click dòng |
| **Nổi bật / ghim** | `#fef9c3` + viền trái inset `#ca8a04` (3px) | Ưu tiên hơn selected khi kết hợp → `#fef3c7` |
| Menu hành động đang mở | `#fef3c7` | Cùng cảm giác “đang thao tác” |

Cursor: `pointer` trên dòng (trừ vùng nút menu).

#### 4.5.4 Icon & hangtag (badge)

Icon trong bảng / menu: **chỉ Lucide** (§4.7). Avatar giữ quy tắc dưới.

| Phần | Quy tắc |
|------|---------|
| Avatar | Tròn **32×32**; ảnh hoặc chữ tắt; nền `#e2e8f0` |
| Icon phụ cạnh tên | Lucide **12px**; SĐT `Phone` màu `#ea580c`; chat/FB `MessageCircle` màu `#16a34a` — **cấm** emoji |
| Hangtag | Component `CrmBadge` — pill bo tròn; padding `2px 10px`; **không** shadow |
| Tone `green` | Nền `#dcfce7` / chữ `#166534` (vd. Khách nét) |
| Tone `blue` | Nền `#dbeafe` / chữ `#1e3a8a` (vd. Khách mới) |
| Tone `amber` | Nền `#fed7aa` / chữ `#9a3412` (vd. Cần chăm sóc) |
| Tone `gray` | Nền `#e2e8f0` / chữ `#475569` (vd. Khác) |
| Tone `red` | Nền `#fee2e2` / chữ `#991b1b` (cảnh báo / lỗi trạng thái) |

**Cấm** invent màu hangtag từng màn — map domain → một trong 5 tone trên.

#### 4.5.5 Cột Thao tác & menu

- Một nút **32×32**, viền `#e2e8f0`, nền trắng, chevron xuống/lên (§4.3.3).
- Menu: trắng, bo 10px, shadow nhẹ; mục `0.88rem` **600**; icon 16px trái.
- Hành động phá hủy: chữ + icon **đỏ** `#b91c1c`.
- Chỉ **một** menu mở / bảng.

#### 4.5.6 Implement

- Tái dùng **một** component/shared styles (không copy CSS từng màn).
- Đổi cột = props/config domain; **không** đổi token hover/font mỗi trang.
- File CSS bảng > ~400 dòng → tách (vd. `*-table.css` / `*-chrome.css`).

### 4.6 Icon CRM — một bộ (đã chốt)

- **Thư viện:** [`lucide-react`](https://lucide.dev) — **duy nhất** trong CRM shell / list / menu / modal.
- **Kiểu:** outline (stroke); mặc định `strokeWidth={2}`; kích thước chuẩn: **12** (mini cạnh tên), **16** (nav / menu), **18** (header / modal title).
- **Màu:** `currentColor` trừ khi guidelines chỉ định (vd. mini phone/chat, danger).
- **Cấm:** emoji làm icon; trộn Heroicons / Font Awesome / SVG tự vẽ song song Lucide; fill-solid lệch bộ outline.
- Import qua `shared/ui/icon` khi cần wrapper size; hoặc `lucide-react` trực tiếp với size chuẩn.

### 4.7 Dialog / thông báo dùng chung (đã chốt)

**Không** dùng `window.alert` / `window.confirm` / `window.prompt` trên CRM.

| Loại | Khi nào | UI |
|------|---------|-----|
| **Alert** | Thông báo 1 nút (OK / Đã hiểu) | Modal giữa màn; tiêu đề + nội dung; 1 nút primary |
| **Confirm** | Hỏi Có / Không trước hành động | Modal; Huỷ (secondary) + Xác nhận (primary); phá hủy → nút xác nhận **đỏ** |
| **Form dialog** | Nhập liệu ngắn (thêm SĐT, ghi chú…) | Cùng khung modal; body = form; Huỷ + Submit primary |
| **Toast** | Feedback nhẹ sau thao tác (không chặn) | Thanh dưới giữa; tự ẩn ~2,8s |

**Khung chung** (`CrmDialog` / `shared/ui/dialog`):

- Backdrop `#0f172a` / 50%; panel trắng, bo **12px**, shadow nhẹ, rộng max **460px**.
- Header: nền `#f1f5f9`, chữ **600**, có thể kèm icon Lucide 18px.
- Body: padding `16–18px`; chữ `#334155`.
- Footer actions: căn phải; secondary viền `#cbd5e1`; primary `#2563eb`; danger `#b91c1c`.
- Escape / click backdrop = Huỷ (trừ khi `busy`).

Skill: `crm-dialog`. Tham chiếu: `apps/web/src/shared/ui/dialog.tsx`.

### 4.8 Checklist trước khi merge UI CRM

- [ ] Đúng quy tắc mục 3 + shell mục 4.2 + nội dung đã chốt ở 4.3
- [ ] Bảng list: đúng **§4.5** (header ngoài scroll, hover/selected/ghim, typography, footer)
- [ ] Icon: **Lucide** (§4.6); hangtag: tone chuẩn (§4.5.4)
- [ ] Alert / confirm / form: **CrmDialog** (§4.7) — không `window.*`
- [ ] Desktop + mobile xem ổn
- [ ] Trạng thái trống / loading / lỗi có UI
- [ ] Không lộ mục chỉ dành cho Admin với user STAFF
- [ ] Header + navbar đúng cấu trúc 4.2 trên mọi trang CRM
- [ ] Cột / domain đúng mục 4.3.x của màn đó
- [ ] Rail phải (nếu có): §4.3.2
- [ ] Menu hành động (nếu có cột Thao tác): §4.3.3 + §4.5.5
- [ ] Thanh tìm/lọc (nếu có): §4.3.4

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
- Bảng list CRM lệch §4.5 (font khác, scroll cắt header, hover tự invent…).
- Icon không Lucide / emoji làm icon CRM (§4.6).
- Hangtag màu tự invent ngoài 5 tone (§4.5.4).
- `window.alert` / `confirm` / `prompt` thay vì CrmDialog (§4.7).
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
| 2026-08-17 | Layout workbench full ngang + Noto Sans 14px; phân cấp §1–§3.2.2 trang khách hàng |
| 2026-08-17 | **Chốt §4.5 bảng list dùng chung** + skill `crm-data-table` (hover, scroll, font, badge…) |
| 2026-08-17 | **Chốt §4.6 Lucide**; hangtag 5 tone; **§4.7 CrmDialog** (alert/confirm/form/toast) |

---

## 9. Liên kết

- Playbook: [`PLAYBOOK.md`](./PLAYBOOK.md)
- Skill mock UI: `.cursor/skills/ui-mock-feature`
- Skill đọc quy tắc UI: `.cursor/skills/ui-guidelines`
- Skill bảng list CRM: `.cursor/skills/crm-data-table`
- Skill dialog CRM: `.cursor/skills/crm-dialog`
- Domain khách hàng: [`domains/customers.md`](./domains/customers.md)
