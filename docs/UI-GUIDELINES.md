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
- CRM gọi API mới; không gọi API production CRM cũ (`crm.anhungland.com`).
- **UI list `/khach-hang`:** visual §4.3.1–4.3.4. **Từng control:** [`domains/customers.md`](./domains/customers.md) **§12**. Chi tiết `[id]`: §12.3.

### 4.2 Shell CRM chung (đã chốt) — mọi trang sau login

Phần **chung** (AppShell), không thuộc nội dung từng trang:

```
┌─────────────────────────────────────────────────────────────┐
│ HEADER (một hàng)                                           │
│  Trái: logo + «An Hưng Land CRM»                            │
│  Phải: menu | menu | menu   [avatar]                        │
├─────────────────────────────────────────────────────────────┤
│ NỘI DUNG: tìm/lọc (§4.3.4) + bảng (§4.3.1) + cột phụ (§4.3.2) │
└─────────────────────────────────────────────────────────────┘
```

| Hạng mục | Quyết định |
|----------|------------|
| Kiểu shell | **Một hàng header**, **full chiều ngang viewport** (workbench) |
| Header trái | Logo + tên ứng dụng **An Hưng Land CRM** |
| Header phải | Menu chính **cạnh avatar**, mục cách nhau **vạch đứng 1px** (không dùng ký tự `|` trong DOM); **cũng có vạch trước avatar** |
| Menu | **Công việc** \| Quản lý khách hàng \| Quản lý lô đất \| Quản lý giao dịch \| Dịch vụ sổ đỏ (+ **Đăng web** STAFF → `/dashboard/lo-dat`; + Dashboard / quản trị nếu ADMIN) |
| Active | Chữ **xanh** `#2563eb` **700** — không pill nền riêng |
| Avatar | Click → menu: tên + vai trò; **Cài đặt**; **Đổi mật khẩu**; **Đăng xuất** cuối (đỏ) |
| Typography CRM | **Noto Sans**, gốc **14px** (public vẫn Be Vietnam Pro) |
| Mobile | Menu cuộn ngang trong header; không ẩn mất mục chính |
| Mobile ô nhập | **16px** tối thiểu (`input` / `textarea` / `select`) — Safari phóng to trang nếu nhỏ hơn khi gõ |

**Không** còn hàng «Thanh điều hướng» riêng.

**Phân cấp trang khách hàng (`/khach-hang`):**

1. Header (logo + menu `|` + avatar)  
2. Nội dung trang  
   - 2.1 Lọc + nút thêm  
   - 2.2 Hai cột: bảng trái + cột phụ phải  

Implement: `apps/web` layout CRM (`(crm)/layout` → `AppShell`). Đổi shell = đổi một chỗ, áp mọi trang CRM.

### 4.3 Nội dung trang

Phần **dưới header** — từng màn (ưu tiên `/khach-hang`).

#### 4.3.1 Bảng dữ liệu — mẫu trang khách hàng

Mọi bảng list CRM tuân **§4.5** (shared). Dưới đây là **cột / nội dung** riêng `/khach-hang`:

```
┌──────────────────────────────────────────────────────────────┐
│ HEADER cột · THÂN dòng · FOOTER đếm — xem §4.5               │
└──────────────────────────────────────────────────────────────┘
```

**Cột — Danh sách khách hàng** (desktop). **Hành vi = CRM đang chạy:** [`customers.md` §12](./domains/customers.md).

| Cột | Nội dung ô |
|-----|------------|
| `#` | STT (§12.1.4 mục 1) |
| `Tên khách` | Avatar + tên + bút sửa tên (mục 2) + SĐT **xanh** copy (mục 3) + SĐT **cam** thêm số (mục 4) + Map đếm lô (mục 6) + hangtag (mục 7) + tên FB (mục 8). Lọc cột: trạng thái + lô đất (có/chưa). **Không** icon mess trên dòng; **không** cột «Số lô đất» |
| `Nhu cầu` | NeedSummary mới nhất (mục 9) |
| `Tài chính` | `crm-money` (mục 10) |
| `Kênh liên hệ` | Page FB NV hoặc hotline (mục 11) |
| `Thao tác` | Chevron menu (mục 12) |

Cột «Số lô đất» đã bỏ — lô = icon Map + số cạnh tên; lọc lô gắn icon cột Tên.

**Cột phụ:** một panel; ẩn thanh trống ([`customers.md` §12.1.6](./domains/customers.md)).

| Hạng mục | Quyết định | Ghi chú |
|----------|------------|---------|
| Cảm giác tổng thể | Workbench, đặc | Theo §4.2 + §4.5 |
| Màu chủ đạo CRM | Xanh `#2563eb` + vàng ghim | §4.5 |
| Font | **Noto Sans**, gốc 14px | §4.2 / §4.5 |
| Trang khách hàng: layout chính | Tìm/lọc trên + **bảng** trái + **cột phụ phải** | §4.3.1–4.3.4 |
| Thao tác trên dòng | **Menu hành động** (dropdown) | §4.3.3 |
| Mobile `/khach-hang` | **Thẻ xếp dọc** + Bộ lọc + Tìm + nút Thêm SĐT đáy | Đã chốt theo ảnh mẫu |
| Mobile `/giao-dich` | **Thẻ xếp dọc** + Bộ lọc + Tìm; 3 thẻ thống kê vẫn 3 cột | Đã chốt theo CRM cũ |
| Mobile `/dich-vu-so-do` | **Thẻ xếp dọc** + Bộ lọc + Tìm; ẩn panel chi tiết | Đã chốt theo CRM cũ |
| Mật độ thông tin | **Đặc** trên desktop | |
| Tránh tuyệt đối | Invent style bảng khác §4.5; thiếu footer; scroll cắt header cột | |

**Mobile (≤767px) — đã chốt theo ảnh CRM cũ:** **thẻ xếp dọc**, không bảng cuộn ngang. Ẩn cột phụ phải.

```
┌─ ô tìm ───── [ Bộ lọc ] [ Tìm ] ─┐
│ thẻ: avatar  tên + gọi          │
│              kênh    [hangtag]   │
│              ngân sách           │
│              nhu cầu     [sửa][▾]│
└─ All N/M · KN · KM · CCS · KH · ĐG ┘
└─ [ + Thêm khách bằng SĐT ] ──────┘
```

| Hạng mục | Quy tắc |
|----------|---------|
| Tìm / lọc | Cùng **một hàng**: ô tìm + **Bộ lọc** + **Tìm** (nền xanh). Panel lọc inline: trạng thái, tài chính, kênh, lô đất, nhu cầu. Ẩn nút «Thêm khách…» trên thanh (chuyển xuống đáy) |
| Thẻ | Grid `48px / 1fr / auto`. Ghim: nền `#fef9c3` + viền trái `#ca8a04`. **Không** `<button>` chứa `<div>`. `flex-shrink: 0` |
| Trái | Avatar tròn 48px (ảnh FB hoặc initials) |
| Giữa | Tên; SĐT **xanh** = gọi `tel:`; SĐT **cam** = thêm số; Map+số nếu có lô; hangtag (kể **Đã xoá**); kênh; ngân sách; nhu cầu. **Không** tên Facebook; **không** icon mess |
| Phải | `SquarePen` = Cập nhật chăm sóc; chevron = menu §4.3.3 |
| Bấm thẻ | Mở `/khach-hang/[id]` |
| Footer | `All N / M` · `KN` · `KM` · `CCS` · `KH` · `ĐG` (ghim) |
| CTA đáy | Nút full-width xanh lá `#16a34a`: **Thêm khách bằng SĐT** |

Desktop giữ bảng §4.5 + cột phụ (§4.3.2).

#### 4.3.2 Cột phụ phải — mở rộng / thu hẹp (đã chốt — theo ảnh mẫu)

Không phải sidebar điều hướng (nav chính nằm trên **header** §4.2). Đây là **cột phụ bên phải** của nội dung trang: nhiều **thanh dọc hẹp** xếp cạnh nhau; bấm để **mở rộng / thu hẹp** panel chi tiết.

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

**Đã chốt:** chỉ **một** panel mở. Bấm thanh khác → **đổi** panel, không chồng. Bấm lại thanh đang mở → thu hẹp. **Ẩn thanh** khi khách đang chọn không có dữ liệu (chat / chăm sóc / lô). Không còn thanh nào → ẩn cả cột phụ. Mobile: ẩn cột phụ.

**Nội dung chat** trên cột phụ = tin **đã lưu**, không phải Inbox Facebook sống (chưa làm — `customers.md` §11 mục 27). Menu **Mở chat** / **Mở Messenger** = tab ngoài.

Implement: một component cột phụ dùng lại được (không copy layout god-file CRM cũ); gắn vào layout nội dung `/khach-hang` (và màn list tương tự khi cần). Chi tiết dữ liệu từng panel: [`customers.md` §12.1.6](./domains/customers.md).

#### 4.3.3 Menu hành động (đã chốt — theo ảnh mẫu)

Cột **Thao tác** trên mỗi dòng bảng: **một nút** mở **menu hành động** (dropdown/popover). Không hiện hàng loạt nút trên dòng.

**Nút mở:**

| Trạng thái | Hình |
|------------|------|
| Đóng | Nút vuông bo góc, nền xám nhạt, **chevron xuống** |
| Mở | Cùng nút, **chevron lên**; dòng đang mở menu **nền vàng nhạt** |

**Menu (khi mở):** thẻ trắng nổi, bo góc, đổ bóng nhẹ; mỗi mục = icon trái + chữ tiếng Việt.

**Mục — khách hàng:** [`customers.md` §12.1.4 mục 12](./domains/customers.md) (máy tính). Mobile: §12.2.4 mục 12.

| Mục | Ghi chú UI |
|-----|------------|
| Mở chat | Tab ngoài: Page → URL Business Suite; E2EE → `/messages/e2ee/t/…`; còn lại `facebook.com/messages/t/…`. Ẩn mobile; thiếu URL → CrmAlert |
| Mở Messenger | Tab `messenger.com/t/…` (thread hoặc uid số); thiếu mã → CrmAlert |
| Cập nhật chăm sóc | CrmDialog form: trạng thái, nhu cầu, chip tài chính, ghi chú. Mobile: trang `/khach-hang/[id]/cham-soc` |
| Thêm công việc | CrmDialog: nội dung, hạn mặc định ngày mai, Lưu / Huỷ. Gắn khách đang mở menu |
| Thêm / Sửa số điện thoại | Modal nhỏ. Chưa có số: thêm. Đã có: Lưu ghi đè + Xóa (confirm). Icon cam cạnh tên = thêm nhanh |
| Tạo lô đất | STAFF → `/khach-hang/[id]/them-lo-dat` (form §12.5 lodats). ADMIN: CrmAlert không tạo từ menu khách |
| Dịch vụ sổ đỏ | `/khach-hang/[id]/dich-vu-so-do` (form tạo hồ sơ; ADMIN được tạo) |
| Ghim khách / Bỏ ghim khách | **Một chỗ**, đổi nhãn theo `isPinned` |
| **Xóa khách** | Đỏ — confirm **ẩn** (`isHidden`), không hard-delete |
| Hiện lại khách | Khi đang xem khách ẩn (`@`/`@@`); thay chỗ «Xóa khách» |

Chỉ **một** menu mở tại một thời điểm. Bấm ra ngoài / chọn mục / bấm lại nút → đóng.

#### 4.3.4 Section tìm kiếm và lọc (đã chốt)

Một **hàng ngang** phía **trên bảng**, trong khung trắng bo góc, viền xám rất mỏng.

```
┌──────────────────────────────────────────────────────────────┐
│ [  ô tìm kiếm rộng …                        ] [ + Thêm khách ] │
└──────────────────────────────────────────────────────────────┘
```

| Phần | Quy tắc |
|------|---------|
| **Ô tìm** (trái, chiếm phần lớn hàng) | Input một dòng; placeholder: `Tìm tên, SĐT, nhu cầu, ghi chú... (@ cả đã xoá, @@ chỉ đã xoá)` |
| **Hangtag Clear** | Ô không trống → hangtag **Clear** (`CrmBadge` gray) **ngay sau con trỏ**; bấm xoá hết từ khoá, giữ focus. Chữ tràn → hangtag dính mép phải phần đang thấy. Component `CrmSearchField` — mọi ô tìm list CRM (`/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do`). **Không** nút × mép phải riêng. |
| Focus | Viền **xanh** |
| **CTA** | Nút xanh «Thêm khách hàng bằng số điện thoại» **cùng hàng**, bên phải |

**Không** hiện H1 «Quản lý khách hàng» trên trang (đã có trên menu header).  
Desktop: **không** lặp dropdown trên thanh này — trạng thái / nhu cầu / tài chính / kênh / **số lô đất** lọc bằng **icon cột** §4.5.5.  
Mobile: ô tìm + Bộ lọc + Tìm; CTA thêm SĐT dính đáy — xem khối Mobile §4.3.1.

**Tìm / `@` `@@` / nút thêm:** máy tính [`§12.1.1–12.1.2`](./domains/customers.md); mobile [`§12.2.1–12.2.3`](./domains/customers.md) — đúng CRM `crm.anhungland.com/khach-hang`.

Đổi ô tìm hoặc lọc → cập nhật bảng (mock: lọc client; API: query §7 domain).

#### 4.3.5 Bảng dữ liệu — trang lô đất (đã chốt cột)

Mọi bảng list CRM tuân **§4.5**. **Hành vi từng control:** [`lodats.md` §12](./domains/lodats.md) (màn [`/lo-dat`](https://anhungland.com/lo-dat)).

Dưới đây là **cột / nội dung** riêng `/lo-dat` (đối chiếu nghiệp vụ ảnh CRM cũ; **không** nút GD/Sửa trên dòng).

**Cột — Danh sách lô đất** (desktop):

| Cột | Nội dung ô |
|-----|------------|
| `Ảnh` | Thumbnail vuông bo góc; overlay `+N` nếu còn ảnh; thiếu ảnh = ô xám `#e2e8f0` + icon Lucide `ImageOff`. Lọc cột «Chưa có ảnh» |
| `Tiêu đề / Địa chỉ` | **Tiêu đề đậm**; dòng phụ nhạt = địa chỉ / khu |
| `Phân loại` | Hangtag `CrmBadge`: **Nhà** `blue` · **Đất** `amber`; lọc cột Tất cả / Nhà / Đất |
| `DT · MT · Hướng` | Dòng 1: diện tích (`90 m²`); dòng 2: `MT 4,5 m · Bắc` — thiếu = `—`. Lọc cột: **khoảng DT** (1–100 / 100–200 / &gt;200) + **hướng** (Đông…Khác), AND |
| `Giá bán` | Giá `crm-money`; dòng phụ ghi chú giá; hoa hồng chữ đã lưu (`1%` / `2%` / `Chưa trao đổi`). Lọc cột: khoảng giá bước **500tr** + «Chưa có giá» (đồng bộ mobile) |
| `Trạng thái` | **Chỉ** Mở bán ↔ Tạm dừng (công tắc). **Không** phải đã bán / đặt cọc. Track xanh `#10b981` khi Mở bán; xám khi Tạm dừng |
| `Thao tác` | Một nút chevron → menu: **Xem chi tiết**, **Thêm công việc**, **Giao dịch**, **Sửa** |

**Không** hiện cột `Cập nhật` trên list `/lo-dat` (timestamp vẫn dùng cho sort API).

**Thanh tìm (§4.3.4, biến thể lô đất):** desktop chỉ ô tìm, **không** H1, **không** dropdown trạng thái/giá trên thanh (lọc bằng icon cột). Mobile: ô tìm + Bộ lọc + Tìm — xem khối Mobile bên dưới. Placeholder: `Tìm lô, địa chỉ, khách... (@ cả tạm dừng)`. `@` = gồm lô tạm dừng; `@@` = chỉ tạm dừng. Mặc định **ẩn** `TAM_DUNG`. Ô tìm: tiêu đề, địa chỉ, tên chủ, hướng, ghi chú — **không** chữ Nhà/Đất → hangtag (lọc cột Phân loại). Không rail phải trên màn này. Không nút «Thêm lô».

**Mobile (≤767px) — đã chốt theo ảnh CRM cũ:** **thẻ xếp dọc**, không bảng cuộn ngang. Header CRM vẫn §4.2.

```
┌─ ô tìm ───── [ Bộ lọc ] [ Tìm ] ─┐
│ (mở Bộ lọc: Trạng thái · Giá)    │
│ thẻ: tiêu đề                     │
│ [ảnh + hangtag Mở bán]  địa chỉ  │
│                         giá      │
│                         ghi chú giá (nếu có) │
│                         hoa hồng (nếu có)    │
│                         DT·MT·Hướng │
└─ Hiển thị N / Tổng M lô đất ─────┘
```

| Hạng mục | Quy tắc |
|----------|---------|
| Thẻ | Nền trắng, viền `#e2e8f0`, bo 12px; **chỉ thông tin cơ bản**: tiêu đề đậm trên cùng; thân 2 cột. **Không** hangtag Nhà/Đất, **không** chevron thao tác, **không** công tắc Mở bán trên thẻ |
| Ảnh | Thumbnail trái ~80×56, bo 8px; overlay hangtag trạng thái **Mở bán** `green` / **Tạm dừng** `gray` (góc trên trái ảnh); `+N` ảnh thêm góc dưới phải |
| Phải ảnh | Địa chỉ nhạt; giá `crm-money`; **ghi chú giá** / **hoa hồng** (chữ đã lưu) nếu có — cùng cột Giá bán desktop; một dòng `90 m² · MT 8 m · Nam`. Thiếu ghi chú / hoa hồng → ẩn dòng |
| Bấm thẻ | Mở chi tiết |
| Tìm / lọc | Cùng **một hàng**: ô tìm + nút **Bộ lọc** + nút **Tìm** (nền xanh). Bộ lọc bung panel **inline** dưới hàng (không `CrmDialog`): select Trạng thái, select khoảng giá (bước 500tr + «Chưa có giá»), nút Xoá lọc khi đang lọc. Nút Tìm đóng bàn phím; gõ ô tìm vẫn lọc. Ô tìm viền vàng khi bắt đầu bằng `@` |
| Footer | Cùng câu «Hiển thị N / Tổng M lô đất», dính đáy vùng list |

Desktop giữ bảng §4.5 (cột phân loại, công tắc, menu thao tác, lọc cột). Không hiện nút Bộ lọc / Tìm trên desktop.

#### 4.3.6 Bảng dữ liệu — trang giao dịch (đã chốt cột)

Mọi bảng list CRM tuân **§4.5**. **Hành vi từng control:** [`transactions.md` §12](./domains/transactions.md) (màn [`/giao-dich`](https://anhungland.com/giao-dich)).

Dưới đây là **cột / nội dung** riêng `/giao-dich` (đối chiếu nghiệp vụ ảnh CRM cũ; **không** nút Xóa trên dòng).

**Ba thẻ thống kê** (trên thanh tìm — chốt theo ảnh mẫu, không phải card marketing):

| Thẻ | Giá trị | Gợi ý dưới số |
|-----|---------|----------------|
| Số lô giao dịch | Số dòng đang hiện | Theo bộ lọc hiện tại |
| Tổng doanh thu | Tổng `salePriceVnd` của `OWN` + `HOAN_TAT` trong bộ lọc hiện tại | Chỉ giao dịch của tôi · Hoàn thành |
| Tổng hoa hồng | Tổng `commissionVnd` cùng điều kiện | Chỉ giao dịch của tôi · Hoàn thành |

Thẻ: nền trắng, viền `#e2e8f0`, bo 12px. Số tiền dùng `crm-money`.

**Cột — Danh sách giao dịch** (desktop):

| Cột | Nội dung ô |
|-----|------------|
| `Mã GD` | Mã (`GD-00012`) — **không** icon lọc (identifier; ô tìm phủ) |
| `Loại` | Hangtag `CrmBadge`: **Của tôi** `blue` · **Ghi nhận** `gray` |
| `Lô đất` | Tiêu đề lô; thiếu = `—` |
| `Người bán` | Mỗi tên một dòng; rỗng = `—` |
| `Người mua` | Mỗi tên một dòng; rỗng = `—` |
| `Giá bán` | `crm-money`; thiếu / 0 = `—` |
| `Hoa hồng` | `crm-money`; **Ghi nhận** hoặc thiếu = `—` |
| `Trạng thái` | Hangtag: Đã cọc `amber` · Đã công chứng `blue` · Hoàn thành `green` · Đã hủy `red` |
| `Hẹn CC` | Ngày `D/M/YYYY`. Đếm ngược **chỉ** Của tôi + Đã cọc: `Còn N ngày` (xanh), `Hôm nay` (amber), `Quá N ngày` (đỏ). RECORD / không ngày / không còn Đã cọc = ngày hoặc `—` |
| `Ghi chú` | Một dòng, cắt `…`; thiếu = `—` |
| `Ngày tạo` | `HH:mm:ss D/M/YYYY` — **không** icon lọc (timestamp) |
| `Thao tác` | Một nút chevron → menu: **Xem chi tiết**, **Thêm công việc**, **Sửa**, **Xóa** (đỏ + `CrmConfirmDialog`) |

**Thanh tìm (§4.3.4, biến thể giao dịch):** desktop chỉ ô tìm, **không** H1, **không** dropdown loại/trạng thái trên thanh (lọc bằng icon cột). Mobile: ô tìm + Bộ lọc + Tìm — xem khối Mobile bên dưới. Placeholder: `Tìm mã GD, lô đất, người bán, người mua, ghi chú...`. Không rail phải. Không nút «Thêm GD». Cột NV (admin) chưa mock.

**Mobile (≤767px) — đã chốt theo CRM cũ:** **thẻ xếp dọc**, không bảng cuộn ngang. Header CRM vẫn §4.2. Ba thẻ thống kê **giữ 3 cột** (không xếp dọc 1 cột).

```
┌─ Số lô · Doanh thu · Hoa hồng ───────┐
┌─ ô tìm ───── [ Bộ lọc ] [ Tìm ] ─────┐
│ (mở Bộ lọc: Loại · Trạng thái)       │
│ thẻ: mã GD   [Loại] [Trạng thái] [▾] │
│      tiêu đề lô                      │
│      Người bán / Người mua           │
│      Giá bán · Hoa hồng              │
│      Hẹn CC · Ghi chú · Ngày tạo     │
└─ Hiển thị N / Tổng M giao dịch ──────┘
```

| Hạng mục | Quy tắc |
|----------|---------|
| Thẻ | Nền trắng, viền `#e2e8f0`, bo 12px. Đầu thẻ: **mã GD** + hangtag Loại + hangtag Trạng thái + chevron thao tác. **Tiêu đề lô** đậm. Meta 2 cột: người bán, người mua, giá `crm-money`, hoa hồng, hẹn CC (kèm đếm ngược), ghi chú (1 dòng `…`), ngày tạo. Ghi nhận / thiếu = `—`. **Không** nút Xóa riêng trên thẻ |
| Thống kê | 3 cột như desktop; chữ nhỏ hơn; **ẩn** gợi ý dưới số; số tiền rút gọn (`2,6 tỷ`, `26 triệu`) |
| Bấm thẻ | Mở chi tiết `/giao-dich/[id]`. Chevron → menu §4.3.6 (Xem chi tiết / Sửa / Xóa) |
| Tìm / lọc | Cùng **một hàng**: ô tìm + nút **Bộ lọc** + nút **Tìm** (nền xanh). Bộ lọc bung panel **inline** dưới hàng (không `CrmDialog`): select Loại, select Trạng thái, nút Xoá lọc khi đang lọc. Nút Tìm đóng bàn phím; gõ ô tìm vẫn lọc. Desktop không hiện Bộ lọc / Tìm |
| Footer | Cùng câu «Hiển thị N / Tổng M giao dịch», dính đáy vùng list |

Desktop giữ bảng §4.5 (lọc cột, menu thao tác).

#### 4.3.7 Bảng dữ liệu — trang dịch vụ sổ đỏ (đã chốt cột)

Mọi bảng list CRM tuân **§4.5**. **Hành vi từng control:** [`title-services.md` §12](./domains/title-services.md) (màn [`/dich-vu-so-do`](https://anhungland.com/dich-vu-so-do)).

Dưới đây là **cột / panel** riêng `/dich-vu-so-do` (đối chiếu nghiệp vụ ảnh CRM cũ).

**Cột — Danh sách hồ sơ sổ đỏ** (desktop):

| Cột | Nội dung ô |
|-----|------------|
| `#` | Số thứ tự; nếu **ghim** thì icon Lucide `Star` (vàng `#ca8a04`) thay số — **không** emoji, **không** icon lọc |
| `Tên khách` | **Tên đậm** + hangtag trạng thái + dòng phụ mã hồ sơ (`SD-2026-0001`) · SĐT. Hangtag: Đang làm `green` · Tạm dừng `gray` · Hoàn thành `blue` · Hủy `red`. Lọc cột = trạng thái |
| `Nhu cầu` | Mô tả; thiếu = `—` |
| `Lịch sử đang làm` | Bước mới nhất **đậm** + ngày `D/M/YYYY`; chưa có = `Chưa ghi tiến độ` |
| `Giá / Thu / Chi` | Ba dòng: Giá `crm-money`; Thu chữ xanh `#047857`; Chi chữ đỏ `#b91c1c`; thiếu giá / 0 = `0 đ` hoặc `—` với giá |
| `Tài liệu` | `N file` hoặc `Chưa có` |
| `Số ngày` | Hangtag `CrmBadge` green (`30 ngày` / `Hôm nay`) — **không** icon lọc |
| `Thao tác` | Chevron → menu: **Xem chi tiết**, **Thêm công việc** (đồng thời ghi tiến độ **Công việc**), **Ghim / Bỏ ghim**, **Thêm tiến độ**, **Nhập thu**, **Nhập chi phí**, **Thêm tài liệu**, **Sửa thông tin**, **Xóa hồ sơ** (đỏ + confirm) |

**Thanh tìm:** desktop chỉ ô tìm (+ **ADMIN:** select nhân viên tạo). Placeholder: `Tìm mã hồ sơ, tên khách, SĐT...`. **Không** dropdown trạng thái, **không** nút Tìm, **không** nút Thêm hồ sơ trên desktop. Mobile: ô tìm + Bộ lọc + Tìm — xem khối Mobile bên dưới.

**Panel phải — Chi tiết hồ sơ** (biến thể §4.3.2, **một** tab):

- Thu hẹp: thanh dọc nhãn **Chi tiết hồ sơ** (chữ xoay 90°).
- Mở: kicker «Chi tiết hồ sơ», tên + mã; lưới 2×2 Trạng thái / Giá thỏa thuận / Đã thu / Đã chi; hộp Nhu cầu; bốn nút `+ Tiến độ` `+ Tài liệu` `+ Thu` `+ Chi` (`CrmDialog`); timeline tiến độ, file, thu/chi gần đây. Mỗi file: hangtag loại (Sổ đỏ `blue` · CCCD `amber` · Giấy tờ khác `gray`) trên đầu, tên file dòng dưới.
- Bấm dòng bảng → chọn + mở panel. Nền dòng chọn `#eff6ff` (§4.5), ghim `#fef9c3`.
- **Mobile:** ẩn panel; thao tác qua chevron trên thẻ.

**Mobile (≤767px) — đã chốt theo CRM cũ:** **thẻ xếp dọc**, không bảng cuộn ngang. Header CRM vẫn §4.2.

```
┌─ ô tìm ───── [ Bộ lọc ] [ Tìm ] ─┐
│ (mở Bộ lọc: Trạng thái · NV nếu ADMIN) │
│ thẻ: ★ tên           [hangtag][▾]│
│      mã · số ngày · SĐT          │
│      Nhu cầu                     │
│      Giá · Thu · Chi             │
│      tiến độ · tài liệu          │
└─ Hiển thị N / Tổng M hồ sơ sổ đỏ ┘
```

| Hạng mục | Quy tắc |
|----------|---------|
| Thẻ | Nền trắng, viền `#e2e8f0`, bo 12px. Ghim: nền `#fef9c3` + viền trái `#ca8a04` + sao Lucide vàng cạnh tên (**không** emoji). **Không** `<button>` chứa `<div>`. `flex-shrink: 0` |
| Đầu thẻ | Tên đậm; hangtag trạng thái; chevron thao tác §4.3.7 |
| Meta | Mã hồ sơ · số ngày (`30 ngày` / `Hôm nay`) · SĐT nếu có |
| Thân | Nhu cầu (2 dòng); một hàng Giá `crm-money` / Thu xanh `#047857` / Chi đỏ `#b91c1c`; bước tiến độ mới nhất; `N file` hoặc `Chưa có` |
| Bấm thẻ | `/dich-vu-so-do/[id]`. Chevron = menu đầy đủ |
| Tìm / lọc | Cùng **một hàng**: ô tìm + **Bộ lọc** + **Tìm** (nền xanh). Panel inline: select Trạng thái, **ADMIN** thêm select NV, nút Xoá lọc khi đang lọc. Desktop không hiện Bộ lọc / Tìm (ADMIN vẫn thấy select NV cạnh ô tìm) |
| Footer | «Hiển thị N / Tổng M hồ sơ sổ đỏ». Không nút Thêm hồ sơ |

Desktop giữ bảng §4.5 + panel Chi tiết hồ sơ.

#### 4.3.8 Bảng dữ liệu — trang công việc (đã chốt cột)

Mọi bảng list CRM tuân **§4.5**. **Hành vi từng control:** [`tasks.md` §12](./domains/tasks.md) (màn [`/cong-viec`](https://anhungland.com/cong-viec)).

**Cột — Danh sách công việc** (desktop):

| Cột | Nội dung ô |
|-----|------------|
| `#` | Số thứ tự; nếu **ghim** thì icon Lucide `Star` (vàng `#ca8a04`) thay số — **không** emoji, **không** icon lọc |
| `Nội dung` | `content`, tối đa 3 dòng |
| `Nguồn` | `taskContextLine` in hoa — VD. **DỊCH VỤ SỔ ĐỎ \| TÊN**; màu `#2563eb` |
| `Hạn làm` | `D/M/YYYY` |
| `Đếm ngược` | Hangtag: **Hôm nay** `amber` · `N ngày` `green` · `Quá hạn N ngày` `red` — **không** icon lọc |
| `Thao tác` | Chevron → **Xem chi tiết**; việc chưa xong thêm **Ghim / Bỏ ghim**, **Hoàn thành** |

**Không** ô tìm, **không** lọc cột (list việc của chính mình). Bấm dòng → modal chi tiết. **Sắp xếp:** ghim chưa xong (hạn gần trước) → không ghim chưa xong (hạn gần trước) → đã xong cuối list. Việc xong: chữ gạch ngang.

**FAB** góc phải dưới (máy tính + mobile): nút tròn `Plus` — **Tạo công việc** → modal thêm (không bắt buộc gắn nguồn). Chi tiết [`tasks.md` §12.1.4](./domains/tasks.md).

**Mobile (≤767px):** thẻ xếp dọc. Đầu thẻ: sao ghim (nếu có, chưa xong) + nội dung + chevron. Hạn + hangtag đếm ngược. Dòng nguồn. Việc xong gạch ngang. Footer «Hiển thị N / Tổng M công việc». Cùng FAB.

Desktop giữ bảng §4.5.

### 4.5 Bảng danh sách CRM — dùng chung (đã chốt)

Áp dụng **mọi** màn CRM có list dạng bảng (khách hàng, lô đất, giao dịch, sổ đỏ, công việc…).  
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
| Số tiền / tài chính | **0.82rem**, **600** | **`#b45309`** (money — một màu toàn CRM; class `crm-money`) |
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
| Icon phụ cạnh tên | Lucide **12px**; SĐT `Phone` **xanh** `#047857` khi đã có số (bấm = copy + tick); **cam** `#ea580c` khi chưa có số (bấm = modal thêm SĐT). List `/khach-hang`: **không** icon `MessageCircle` cạnh tên — chat chỉ trong menu thao tác. **Cấm** emoji |
| Hangtag | Component `CrmBadge` — pill bo tròn; padding `2px 10px`; **không** shadow |
| Tone `green` | Nền `#dcfce7` / chữ `#166534` (vd. Khách nét) |
| Tone `blue` | Nền `#dbeafe` / chữ `#1e3a8a` (vd. Khách mới) |
| Tone `amber` | Nền `#fed7aa` / chữ `#9a3412` (vd. Cần chăm sóc) |
| Tone `gray` | Nền `#e2e8f0` / chữ `#475569` (vd. Khác) |
| Tone `red` | Nền `#fee2e2` / chữ `#991b1b` (cảnh báo / lỗi trạng thái) |

**Cấm** invent màu hangtag từng màn — map domain → một trong 5 tone trên.

#### 4.5.5 Icon lọc trên tên cột (đã chốt)

Mỗi **cột dữ liệu** (không gồm `#` và **Thao tác**): tên cột + icon Lucide `ListFilter` **14px** **sát ngay bên phải chữ** (không đẩy icon ra mép phải ô).

| Trạng thái | Hình |
|------------|------|
| Mặc định | Icon xám `#94a3b8`, nền trong suốt |
| Hover / menu mở | Nền `#e2e8f0`, icon `#334155` |
| Đang lọc | Icon lọc xanh `#2563eb` / `#dbeafe`; **thêm** icon Lucide `X` **sát phải** (chỉ lúc này) — mặc định nền `#fee2e2` chữ `#b91c1c`; hover đậm hơn `#fecaca` / `#7f1d1d`; bấm về «Tất cả» |
| Không lọc | Không hiện icon xóa |

Bấm **chỉ icon** (không bấm tên cột) → menu trắng (cùng chrome menu thao tác): danh sách lựa chọn; mục đang chọn có `Check`. Một menu lọc mở / bảng. Lọc cột **thay** dropdown trùng trên thanh §4.3.4.

Component: `shared/ui/column-filter.tsx`.

#### 4.5.6 Cột Thao tác & menu

- Một nút **32×32**, viền `#e2e8f0`, nền trắng, chevron xuống/lên (§4.3.3).
- Menu: trắng, bo 10px, shadow nhẹ; mục `0.88rem` **600**; icon 16px trái.
- Menu **portal tới `document.body`** (`position: fixed`, z-index ~100) — không để trong `.…-table-scroll` / shell `overflow` (bị cắt hit-test).
- Hành động phá hủy: chữ + icon **đỏ** `#b91c1c`.
- Chỉ **một** menu mở / bảng.

#### 4.5.7 Implement

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

- Render bằng **portal tới `document.body`** (tránh bị `overflow: hidden` của shell/list cắt mất).
- Backdrop `#0f172a` / 50%; **z-index 200**; panel trắng, bo **12px**, shadow nhẹ, rộng max **460px**. Mobile: `min-width: 0` + `max-width: 100%` — không để ô `file` native đẩy panel tràn mép.
- Header: nền `#f1f5f9`, chữ **600**, có thể kèm icon Lucide 18px.
- Body: padding `16–18px`; chữ `#334155`.
- Footer actions: căn phải; secondary viền `#cbd5e1`; primary `#2563eb`; danger `#b91c1c`.
- Escape / **mousedown** trên backdrop = Huỷ (trừ khi `busy`) — không dùng `click` trên backdrop (tránh gesture mở menu đóng modal).

Skill: `crm-dialog`. Tham chiếu: `apps/web/src/shared/ui/dialog.tsx`.

### 4.8 Checklist trước khi merge UI CRM

- [ ] Đúng quy tắc mục 3 + shell mục 4.2 + nội dung đã chốt ở 4.3
- [ ] Bảng list: đúng **§4.5** (header ngoài scroll, hover/selected/ghim, typography, footer)
- [ ] Icon: **Lucide** (§4.6); hangtag: tone chuẩn (§4.5.4)
- [ ] Alert / confirm / form: **CrmDialog** (§4.7) — không `window.*`
- [ ] Desktop + mobile xem ổn
- [ ] Trạng thái trống / loading / lỗi có UI
- [ ] Không lộ mục chỉ dành cho Admin với user STAFF
- [ ] Header (logo + menu `|` + avatar) đúng §4.2 trên mọi trang CRM
- [ ] Cột / domain đúng mục 4.3.x của màn đó
- [ ] Rail phải (nếu có): §4.3.2
- [ ] Menu hành động (nếu có cột Thao tác): §4.3.3 + §4.5.6
- [ ] Icon lọc trên tên cột dữ liệu: §4.5.5
- [ ] Thanh tìm/lọc (nếu có): §4.3.4

---

## 5. CRM Admin

Hai việc **khác nhau** — không gộp một màn:

| Việc | Trạng thái |
|------|------------|
| **Đăng web công khai** (tin, bài, lô bán) | **Dashboard** `/dashboard` — ADMIN: Tổng quan, Lô đất, Bài viết. STAFF: header **Đăng web** → `/dashboard/lo-dat` (chỉ lô mình). Bài CMS chỉ ADMIN. [`public-content.md`](./domains/public-content.md). **Không** thêm công tắc Đăng web trên 4 trang CRM. |
| Registry / xóa cứng khách, CRUD NV | **Tạm hoãn** (P4). `/quan-tri/khach-hang` vẫn placeholder. |

Khi mock Đăng web: shell CRM §4.2; bảng list §4.5; dialog §4.7. Không dùng layout marketing public cho màn admin.

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
| 2026-08-17 | Header phải = **avatar** → menu (Cài đặt dưới, Đăng xuất cuối) |
| 2026-08-17 | Bỏ hàng «Thanh điều hướng»; menu lên header cạnh avatar, cách `\|` |
| 2026-08-17 | **Chốt bảng dữ liệu (§4.3.1):** header cột + dòng + footer «Hiển thị N / Tổng M»; mẫu cột `/khach-hang` theo ảnh |
| 2026-08-17 | **Chốt rail phải (§4.3.2):** thanh dọc chữ xoay 90°; mở rộng / thu hẹp; nhãn Chat · Lịch sử chăm sóc · Danh sách lô đất |
| 2026-08-17 | **Chốt menu hành động (§4.3.3):** dropdown cột Thao tác; chevron lên/xuống; Xóa khách đỏ |
| 2026-08-17 | **Chốt tìm/lọc (§4.3.4):** ô tìm + nút thêm SĐT; lọc cột gồm Số lô đất |
| 2026-08-17 | Mock UI `/khach-hang` theo §4.2 + §4.3.1–4.3.4 (chưa chốt mobile) |
| 2026-08-17 | Layout workbench full ngang + Noto Sans 14px; phân cấp §1–§3.2.2 trang khách hàng |
| 2026-08-17 | **Chốt §4.5 bảng list dùng chung** + skill `crm-data-table` (hover, scroll, font, badge…) |
| 2026-08-17 | **Chốt §4.6 Lucide**; hangtag 5 tone; **§4.7 CrmDialog** (alert/confirm/form/toast) |
| 2026-08-17 | **Chốt màu số tiền CRM** `#b45309` (`crm-money`) — thống nhất mọi cột giá / tài chính |
| 2026-08-17 | **Chốt §4.5.5** icon lọc `ListFilter` trên tên cột dữ liệu; đồng bộ thanh lọc |
| 2026-08-17 | **Chốt §4.3.5** cột list `/lo-dat` (ảnh, tiêu đề, DT·MT·hướng, giá, hangtag, menu thao tác) |
| 2026-08-18 | Header: vạch phân cách CSS 1px (không ký tự `|`); ẩn caret soạn thảo trên chữ tĩnh |
| 2026-08-18 | **Chốt §4.3.5 cột Trạng thái `/lo-dat`:** chỉ Mở bán ↔ Tạm dừng (không phải đã bán / đặt cọc) |
| 2026-08-18 | **Chốt §4.3.5 cột Phân loại `/lo-dat`:** Nhà / Đất (hangtag + lọc cột) |
| 2026-08-18 | **Chốt §4.3.6** list `/giao-dich`: 3 thẻ thống kê + cột mã/loại/lô/các bên/giá/hoa hồng/trạng thái/hẹn CC |
| 2026-08-18 | **Chốt §4.3.7** list `/dich-vu-so-do`: cột khách/nhu cầu/tiến độ/thu-chi + panel Chi tiết hồ sơ |
| 2026-08-18 | **Chốt §4.3.5 mobile `/lo-dat`:** thẻ xếp dọc + nút Bộ lọc (không bảng cuộn ngang) |
| 2026-08-18 | **Chốt lại §4.3.5 mobile `/lo-dat`:** hàng ô tìm + Bộ lọc + Tìm; thẻ chỉ tiêu đề / ảnh / địa chỉ / giá / DT·MT·Hướng |
| 2026-08-19 | **Chốt §4.3.1 mobile `/khach-hang`:** thẻ avatar + hangtag + Bộ lọc/Tìm + footer All/KN/KM + nút Thêm SĐT đáy |
| 2026-08-19 | **Chốt §4.3.6 mobile `/giao-dich`:** thẻ mã GD + hangtag + meta cơ bản; Bộ lọc Loại/Trạng thái; 3 thẻ thống kê vẫn 3 cột |
| 2026-08-19 | **Chốt §4.3.7 mobile `/dich-vu-so-do`:** thẻ tên/hangtag/nhu cầu/thu-chi/tiến độ; Bộ lọc Trạng thái; ẩn panel |
| 2026-08-19 | **Chốt nghiệp vụ list `/khach-hang`:** ô tìm / cột / icon / menu / rail một panel / ẩn=`isHidden` — `domains/customers.md` §12; status domain → Ready for API (list) |
| 2026-08-19 | **§12 theo CRM đang chạy** `crm.anhungland.com/khach-hang`: SĐT xanh/cam, không icon mess trên dòng, lô = icon Map, nhu cầu = NeedSummary |
| 2026-08-19 | **Đặc tả list `/lo-dat`:** `domains/lodats.md` §12 — cùng format đánh số; nguồn anhungland.com/lo-dat |
| 2026-08-19 | **Đặc tả list `/giao-dich`:** `domains/transactions.md` §12 — nguồn anhungland.com/giao-dich |
| 2026-08-19 | **Đặc tả list `/dich-vu-so-do`:** `domains/title-services.md` §12 — nguồn anhungland.com/dich-vu-so-do |
| 2026-08-19 | **§12 chia máy tính / mobile trước**, rồi mới chi tiết thành phần — 4 domain list + skill `write-domain-doc` |
| 2026-08-19 | **Mobile: ô nhập ≥ 16px** — tránh trình duyệt phóng to trang khi focus (iOS Safari) |
| 2026-08-20 | Mini SĐT cạnh tên: xanh `#047857` khi đã có số (copy + tick); cam `#ea580c` khi chưa có (modal **Thêm số điện thoại**; trùng → modal gộp/xác nhận) |
| 2026-08-20 | Thêm khách bằng SĐT: hotline bắt buộc + tên + số + ghi chú; Cài đặt Quản lý SĐT |
| 2026-08-20 | Sửa tên khách: bút Lucide trên máy tính |
| 2026-08-20 | Lọc tài chính (chưa có / đã có / dưới 1 tỷ / 1–2 tỷ / trên 2 tỷ) + lọc kênh (page FB / hotline thật) |
| 2026-08-20 | Form chăm sóc: trạng thái + nhu cầu + chip tài chính + ghi chú (modal PC / trang mobile) |
| 2026-08-20 | Rail Nội dung chat: tin đã lưu + thumbnail ảnh; bấm ảnh → CrmDialog gallery (prev/next) |
| 2026-08-20 | Chi tiết `/khach-hang/[id]`: hero + SĐT + tài chính + lịch sử; lô đất mock. Mobile bấm thẻ → trang này |
| 2026-08-20 | List `/khach-hang`: lần đầu 50 dòng, cuộn gần đáy tải thêm 50; nhớ lọc/scroll khi rời trang (mọi lối, cùng tab) |
| 2026-08-20 | Mục 24 list khách: tải 50 dòng khi cuộn + nhớ lọc/scroll (sessionStorage) — `customers.md` §12.1.5 |
| 2026-08-25 | Trang sửa lô: **Đổi chủ** (CrmDialog chọn khách + sửa giá/trạng thái/hoa hồng/ghi chú; đóng map cũ / mở map mới) |
| 2026-08-25 | List `/lo-dat`: lần đầu 50 dòng, cuộn gần đáy tải thêm 50; lọc cột chạy trên API; hook `useCrmInfiniteList` |
| 2026-08-25 | Ô tìm list CRM: hangtag **Clear** (`CrmBadge` gray) ngay sau con trỏ — `CrmSearchField` |
| 2026-08-25 | Helper chung nhớ list (`shared/list-state` + skill `crm-list-state`): `/khach-hang` refactor; `/lo-dat` nhớ tìm/lọc/cuộn; logout xóa mọi `*-list-state` |
| 2026-08-25 | Khách: `lodatCount` API + Map cạnh tên; bỏ cột Số lô; rail/chi tiết lô từ `GET /customers/:id/lodats` |
| 2026-08-24 | Khách: xoá SĐT = **NV phụ trách khách** (không chỉ admin). Hangtag «Tự khôi phục» = BUG-021 FIXED (2026-09-05). |
| 2026-08-26 | Menu khách **Dịch vụ sổ đỏ** → form `/khach-hang/[id]/dich-vu-so-do` (STAFF + ADMIN; không nút Thêm trên list) |
| 2026-08-26 | List `/dich-vu-so-do`: nhớ tìm / lọc / cuộn (`sessionStorage`, skill `crm-list-state`) |
| 2026-08-26 | Panel sổ đỏ **File tài liệu:** hangtag loại giấy (Sổ đỏ / CCCD / Giấy tờ khác) trên đầu mỗi file |
| 2026-08-26 | `/dich-vu-so-do` ADMIN: select nhân viên tạo; xem file mật ghi nhật ký `TitleServiceAttachmentView` |
| 2026-08-26 | **Dashboard** `/dashboard` (ADMIN): menu Tổng quan · Lô đất public mở bán · Bài viết. Bốn trang CRM không thêm quyền admin |
| 2026-08-26 | Mock dashboard: Đăng/Gỡ lô, Soạn bài / Xuất bản / Về nháp; admin login → `/dashboard` |
| 2026-08-26 | `/dashboard/lo-dat`: giữa = lô NV đang Mở bán; phải = preview bài đăng trang khách |
| 2026-08-26 | `/dashboard/lo-dat`: không H1, không nút Đăng lô cạnh ô tìm; ô tìm chrome như `/lo-dat`; preview ~440px; cột bảng sát list lô NV |
| 2026-08-26 | `/dashboard/lo-dat` preview: **Đăng web** khi chờ đăng; lô đang hiện chỉ còn link xem trang khách — không nút Gỡ web |
| 2026-08-26 | Menu trong Dashboard: **Lô đất** (trước: Lô đất public mở bán) |
| 2026-08-26 | `/dashboard/lo-dat` panel phải: tiêu đề **Preview Post** |
| 2026-08-26 | `/dashboard/lo-dat`: lọc cột §4.5.5 (ảnh, địa chỉ, phân loại, DT/hướng, giá, NV, Web); mobile Bộ lọc |
| 2026-08-30 | Dialog CRM mobile: panel không tràn viewport; ô file dùng hàng «Chọn tệp» + tên (không native width) |
| 2026-08-30 | `/dich-vu-so-do` mobile: bấm thẻ / Xem chi tiết → trang `/dich-vu-so-do/[id]` (panel vẫn máy tính) |
| 2026-08-30 | Docs `/khach-hang` khớp code: tạo lô từ khách STAFF; menu khôi phục ẩn; lô rail/chi tiết = API; không nhớ panel rail; lọc lô/nhu cầu `has|empty` |
| 2026-08-30 | Khách: **không** modal sửa tên Facebook — tên FB nhận từ extension khi scan |
| 2026-08-30 | List `/khach-hang`: bỏ icon mess cạnh tên; hangtag **Đã xoá** khi `isHidden`; thẻ mobile **không** tên Facebook |
| 2026-08-30 | List `/khach-hang`: menu Thao tác **Thêm / Sửa số điện thoại** (Lưu / Xóa); icon cam vẫn thêm nhanh |
| 2026-08-30 | Panel phải + chi tiết khách: thẻ lô ảnh trái / chữ phải; bấm ảnh = gallery (+N); bấm chữ = `/lo-dat/[id]` |
| 2026-08-30 | Cột phụ `/khach-hang`: ẩn thanh Chat / Chăm sóc / Lô khi khách không có tin, lịch sử, hoặc lô |
| 2026-08-30 | Docs khách: Inbox Facebook sống ≠ cột phụ tin đã lưu / menu Mở chat; ô tìm API không khớp tên FB |
| 2026-08-31 | List `/lo-dat` cột Giá bán: dòng hoa hồng = chữ đã lưu (`brokerFeeNote`), không phải `%` số `commissionPercent` |
| 2026-08-31 | `/lo-dat`: thiếu ảnh = ô xám + `ImageOff`; ô tìm không map chữ Nhà/Đất sang hangtag (lọc cột Phân loại) |
| 2026-09-02 | STAFF header **Đăng web** → `/dashboard/lo-dat` (lô mình tạo). Preview **Gỡ web** khi đang hiện. Bài CMS + Tổng quan vẫn ADMIN |
| 2026-09-02 | Dashboard menu **Thống kê** `/dashboard/thong-ke` (ADMIN): list NV + cột số lô đã tạo link share + lượt xem khách (cookie, gồm trang chủ, F5 = +1) |
| 2026-09-02 | Thống kê: thêm dòng **Truy cập trực tiếp** (khách không cookie share); cùng F5 = +1; icon Lucide `Globe` |
| 2026-09-03 | Chi tiết `/khach-hang/[id]` mobile: ẩn «← Danh sách khách»; FAB gọi (`tel:`) + **Zalo** (`zalo.me`) khi có SĐT + **Mở Messenger** (cùng menu list mobile); máy tính không đổi |
| 2026-09-03 | Chi tiết `/lo-dat/[id]` mobile: ẩn «← Danh sách lô đất»; FAB liên hệ **chủ đất** (Gọi / Zalo / Mở Messenger); nổi trên footer Giao dịch·Sửa; máy tính không đổi |
| 2026-09-04 | Chi tiết `/khach-hang/[id]`: dưới tên chỉ hiện **tên kênh**; FAB **«⋯»** popover + icon Lucide (chăm sóc / tạo lô / sổ đỏ) |
| 2026-09-04 | AddressPicker: chọn bằng `onClick` (không `preventDefault` pointerdown) — vuốt cuộn được; chặn click xuyên iOS bằng ignore-trigger ngắn |
| 2026-09-04 | List `/khach-hang` menu Thao tác: ưu tiên mở dưới chevron, thiếu chỗ thì trên; không khóa cuộn — cuộn list/resize đóng menu |
| 2026-09-04 | Menu Thao tác: đóng khi cuộn trên iOS — `touchmove` + listener trực tiếp `.kh-cards` / `.kh-table-scroll` + theo dõi vị trí nút (window capture scroll không đủ) |
| 2026-09-04 | List `/lo-dat` thẻ mobile: thêm dòng **Ghi chú giá** + **Hoa hồng** (cùng cột Giá bán desktop; thiếu thì ẩn) |
| 2026-09-08 | `/cong-viec`: FAB **Tạo công việc** (Plus) góc phải dưới — máy tính + mobile; modal không bắt buộc gắn nguồn |
| 2026-09-08 | `/cong-viec`: sắp xếp ghim→hạn gần; đã xong ở cuối + gạch ngang |
| 2026-09-08 | `/dich-vu-so-do`: **Thêm công việc** → tiến độ **Công việc**; avatar CRM: **Đổi mật khẩu** |
| 2026-09-08 | `/cong-viec` nguồn: bỏ «Công việc này cho…»; in hoa `LOẠI \| TÊN` màu `#2563eb` |
| 2026-09-08 | `/cong-viec` FAB `+`: `fixed` nổi trên footer/list (không nằm dưới dòng «Hiển thị») |

---

## 9. Liên kết

- Playbook: [`PLAYBOOK.md`](./PLAYBOOK.md)
- Skill mock UI: `.cursor/skills/ui-mock-feature`
- Skill đọc quy tắc UI: `.cursor/skills/ui-guidelines`
- Skill bảng list CRM: `.cursor/skills/crm-data-table`
- Skill nhớ tìm/lọc/cuộn list: `.cursor/skills/crm-list-state`
- Skill dialog CRM: `.cursor/skills/crm-dialog`
- Domain khách hàng: [`domains/customers.md`](./domains/customers.md)
- Domain lô đất: [`domains/lodats.md`](./domains/lodats.md)
- Domain giao dịch: [`domains/transactions.md`](./domains/transactions.md)
- Domain sổ đỏ: [`domains/title-services.md`](./domains/title-services.md)
- Domain web công khai (đăng tin/bài/lô): [`domains/public-content.md`](./domains/public-content.md)
