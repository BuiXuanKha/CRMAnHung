# Domain: Nội dung web công khai (Khách / Admin đăng)

- **Slug:** `public-content`
- **Status:** Ready for mock — **Dashboard** `/dashboard` (ADMIN). Bốn trang CRM không thêm quyền admin.
- **Owner:** An Hưng Land
- **IA khách:** [`PUBLIC-WEB.md`](../PUBLIC-WEB.md) · SEO: [`PUBLIC-SEO.md`](../PUBLIC-SEO.md)
- **Lô nguồn:** [`lodats.md`](./lodats.md) — **không** tự đẩy mọi lô Mở bán lên web
- **Không phải:** registry xóa cứng khách (`/quan-tri/khach-hang`, P4)

Hệ cũ **không** có CMS web công khai. Đây là bề mặt mới.

---

## 1. Mục đích

Hai chế độ trên cùng domain `anhungland.com`:

| Chế độ | Ai | Thấy |
|--------|----|------|
| **Khách** | Chưa login | Tin tức, bài đăng, lô đất **đã được admin đăng** |
| **Admin đăng web** | ADMIN đã login CRM | Chọn lô / soạn bài rồi **public** hoặc **gỡ** |

Khách không cần tài khoản. Không lộ dữ liệu CRM nội bộ (tên khách, SĐT, NV, hoa hồng, GD, chăm sóc).

---

## 2. Actors & quyền

| Actor | Được | Không |
|-------|------|--------|
| Khách (chưa login) | Đọc bài / lô **đã public**; share URL | Sửa, xem bản nháp, vào CRM |
| STAFF | Làm CRM như hiện tại | Đăng / gỡ web; sửa copy public |
| ADMIN | Như STAFF trên CRM + **đăng / gỡ** lô và bài | — |

Đề xuất quyền (§11, dùng cho mock): **chỉ ADMIN** bấm Đăng web — trang khách là thương hiệu công ty, không phải sàn từng NV.

---

## 3. Khái niệm & trạng thái

Ba loại nội dung khách thấy:

| Loại | Nguồn | Public khi |
|------|--------|------------|
| **Lô đất cần bán** | Một `Lodat` CRM (luồng NV) | Admin bật **Đăng web** |
| **Tin tức** | Bài CMS (`PublicPost`, chuyên mục tin) | Admin **Xuất bản** |
| **Bài đăng** | Cùng CMS; chuyên mục dự án / kiến thức / kinh nghiệm | Admin **Xuất bản** |

### 3.1 Lô trên web ≠ mọi lô Mở bán

CRM: công tắc **Mở bán / Tạm dừng** là việc nội bộ NV–khách.

Web: công tắc **Đăng web** là việc admin chọn lô nào khách được thấy.

| CRM | Web khách |
|-----|-----------|
| Tạm dừng / nháp / thiếu ảnh | Không hiện |
| Mở bán nhưng chưa Đăng web | Không hiện |
| Đăng web + đang Mở bán | Hiện `/san-pham/[slug]` |
| Đang Đăng web rồi Tạm dừng / Đã cọc / Đã bán | **Tự gỡ** (đề xuất) |

### 3.2 Bài viết

Cùng entity `PublicPost`:

| Field ý niệm | Nghĩa |
|--------------|--------|
| `category` | `du-an` · `kien-thuc` · `lien-he` · `chinh-sach` · `tin-tuc` · `kinh-nghiem` |
| `status` | `DRAFT` · `PUBLISHED` |
| `slug` | URL ổn định, unique |

### 3.3 Cấm lộ trên public

Không bao giờ hiện: tên khách, SĐT khách, tên NV, hoa hồng, ghi chú nội bộ lô/map, lịch sử GD, chat, file mật.

Được hiện (khi đã Đăng web): tiêu đề, ảnh lô/dự án, DT · MT · hướng, hangtag Nhà/Đất, địa chỉ (tỉnh/huyện/xã/thôn-dự án), giá **nếu** admin chọn công bố, mô tả public, nút gọi hotline công ty.

---

## 4. Use cases

1. **Khách vào /** — hero brand + lô đã đăng + teaser tin/bài. Không login.
2. **Khách xem lô** — `/san-pham` và `/san-pham/[slug]`; share OG.
3. **Khách đọc bài** — list + chi tiết theo chuyên mục.
4. **Admin đăng lô** — chọn lô đang Mở bán → điền/chỉnh copy public (tiêu đề, mô tả, hiện giá?) → Đăng web.
5. **Admin gỡ lô** — tắt Đăng web; URL cũ → không tìm thấy (hoặc 404).
6. **Admin soạn bài** — nháp → Xuất bản / Gỡ về nháp.
7. **Lô đổi trạng thái CRM** — Tạm dừng / cọc / bán → web tự gỡ (đề xuất).

---

## 5. Quan hệ dữ liệu

```
Lodat  1──0..1  PublicListing     (slug, isPublished, pricePublic, publicTitle, publicBody)
PublicPost                        (category, slug, status, cover, body) — không gắn khách
```

- Một `Lodat` tối đa một listing.
- Lô **kho** (`ProjectLot`): tối đa **một** listing đang public trên cùng số lô (tránh LK12 hiện 2 lần vì hai NV). Admin chọn luồng nào đăng.
- Ownership listing: `publishedByEmployeeId` (admin). Không theo `employeeId` của lô để STAFF tự đăng.

Ảnh public = ảnh lô + ảnh dự án đã có trên CRM (R2 public CDN). Không copy file.

---

## 6. UI (màn hình)

| Màn | Route | Việc |
|-----|--------|------|
| **Dashboard** | `/dashboard` | Tổng quan + menu trái. §12 |
| **Lô đất public mở bán** | `/dashboard/lo-dat` | List lô đăng web. §13 |
| **Bài viết** | `/dashboard/bai-viet` | List bài (dự án, kiến thức, liên hệ, chính sách…). §14 |
| Trang chủ khách | `/` | Mock sẵn |

**Tạm thời không** thêm hành vi/quyền admin trên `/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do`.

Menu **trong** Dashboard (không gắn lên 4 trang CRM): Tổng quan · Lô đất public mở bán · Bài viết.

Header CRM: bốn mục NV. ADMIN thêm **Dashboard**. STAFF vào URL → `/khach-hang`.

---

## 7. Contract / API dự kiến

Prefix `/api/v1`. Dashboard mock: `packages/shared/src/public-content.ts`.

| Method | Path | Auth | Việc |
|--------|------|------|------|
| GET | `/admin/public-web/dashboard` | JWT ADMIN | Số đếm + lô/bài gần đây |
| PATCH | `/admin/public-web/lots/:id/published` | JWT ADMIN | Đăng / gỡ lô (`isPublished`) — mock |
| PATCH | `/admin/public-web/posts/:id/status` | JWT ADMIN | Xuất bản / về nháp — mock |
| POST | `/admin/public-web/posts` | JWT ADMIN | Soạn bài (tiêu đề + chuyên mục) — mock |
| GET | `/public/listings` | Không | Lô đã đăng (trang khách) — sau |
| GET | `/public/posts` | Không | Bài `PUBLISHED` — sau |

---

## 8. Mock data

Khi mock UI admin (sau Ready for mock):

- 3–5 lô CRM: chưa đăng / đã đăng / Mở bán vs Tạm dừng
- 1 lô kho hai NV — chỉ một listing public
- Bài: nháp + đã đăng, đủ 4 chuyên mục
- Khách `/` không thấy nháp

---

## 9. Extension?

- [x] Không — không ingest Meta.

---

## 10. Migrate từ hệ cũ

Không có bảng CMS cũ. Listing/post = dữ liệu **mới**. Lô nguồn = `Lodat` đã copy.

---

## 11. Luật dùng cho mock dashboard (2026-08-26)

Chủ chuyển sang mock; dùng mặc định dưới. Bác thì sửa docs rồi UI.

1. Chỉ **ADMIN** vào `/dashboard`. Bốn trang CRM **không** thêm UI/quyền admin.
2. Lô lên web = công tắc tường minh — không auto mọi lô Mở bán.
3. Tạm dừng / Đã cọc / Đã bán → gỡ web (chưa mock hành vi; chỉ số đếm).
4. Giá từng lô: hiện số hoặc **Liên hệ**.
5. Cùng số lô kho → một listing public (chưa mock conflict UI).
6. Bài viết = một list; chuyên mục: dự án, kiến thức, liên hệ, chính sách bảo mật, tin tức, kinh nghiệm.
7. Liên hệ khách: hotline + Zalo công ty; chưa form SĐT.
8. Mô tả public = ô riêng (form làm slice sau).

---

## 12. Dashboard `/dashboard` — ADMIN

Thứ tự: **12.1 máy tính** → **12.2 mobile**. Không trộn PC/mobile trong một mục.

Không H1 lặp tên menu trên thanh tìm — **có** H1 trên từng trang dashboard.

### 12.0 Menu trong Dashboard (mọi màn `/dashboard/*`)

**Máy tính:** cột trái, 3 mục. Active chữ xanh `#2563eb` **700** + nền `#eff6ff`.

1. **Tổng quan** → `/dashboard`
2. **Lô đất public mở bán** → `/dashboard/lo-dat`
3. **Bài viết** → `/dashboard/bai-viet`

**Mobile:** cùng 3 mục, cuộn ngang trên đầu nội dung.

---

### 12.1 Giao diện máy tính

```
┌ Dashboard              [Xem trang khách] [Đăng lô] [Soạn bài] ┐
│ Dòng phụ: khách chỉ thấy nội dung đã đăng                    │
├ 4 thẻ đếm (kiểu §4.3.6, không card marketing)                │
├ Hai cột: bảng Lô trên web · bảng Bài viết gần đây  (§4.5)    │
└ Không rail phải                                              │
```

#### 12.1.1 Thanh đầu trang

1. **H1** `Dashboard`
2. Dòng phụ: `Khách trên anhungland.com chỉ thấy lô và bài đã đăng.`
3. **Xem trang khách** — viền; mở `/` tab mới
4. **Đăng lô** — primary → dialog chọn lô chờ đăng → xác nhận Đăng web
5. **Soạn bài** — viền → dialog tiêu đề + chuyên mục → Lưu nháp / Xuất bản

#### 12.1.2 Bốn thẻ đếm

Cùng hình thức thẻ GD: nền trắng, viền `#e2e8f0`, bo 12px. 4 cột.

| Thẻ | Số | Gợi ý |
|-----|----|--------|
| Lô đang hiện | `publishedLotCount` | Khách thấy trên `/san-pham` |
| Chờ đăng | `pendingLotCount` | Mở bán CRM, chưa Đăng web |
| Bài đã đăng | `publishedPostCount` | Khách đọc được |
| Bài nháp | `draftPostCount` | Chỉ admin |

#### 12.1.3 Bảng Lô trên web

§4.5. Không icon lọc cột (hub). Không cột Thao tác.

| Cột | Ô |
|-----|---|
| Ảnh | Thumb 52px; thiếu = ô xám + `ImageOff` |
| Tiêu đề | **Đậm**; dòng phụ địa chỉ. **Không** tên khách / NV |
| Giá | `crm-money` nếu hiện số; không thì chữ `Liên hệ` |
| Web | Hangtag **Đang hiện** `green` · **Chờ đăng** `gray` |

Bấm nền hàng → `CrmConfirm` **Đăng web** (lô chờ đăng) hoặc **Gỡ web** (đang hiện). Toast khi xong. Số đếm cập nhật.

Footer: `Hiển thị N / Tổng M lô` (N = dòng trên hub; M = đang hiện + chờ đăng).

Trống: `Không có lô trên web.`

#### 12.1.4 Bảng Bài viết gần đây

§4.5. Không lọc cột.

| Cột | Ô |
|-----|---|
| Chuyên mục | Hangtag `blue`: Tin tức / Dự án / Kiến thức / Kinh nghiệm |
| Tiêu đề | **Đậm** |
| Trạng thái | **Đã xuất bản** `green` · **Nháp** `gray` |

Bấm hàng → `CrmConfirm` **Xuất bản** (nháp) hoặc **Về nháp** (đã đăng). Toast khi xong.

Footer: `Hiển thị N / Tổng M bài` (M = đã đăng + nháp).

Trống: `Không có bài viết.`

---

### 12.2 Giao diện mobile

```
┌ H1 + dòng phụ                    ┐
├ [Xem trang khách]                │
├ [Đăng lô] [Soạn bài]             │
├ 4 thẻ đếm — lưới 2×2             │
├ Thẻ lô xếp dọc                   │
└ Thẻ bài xếp dọc                  │
```

#### 12.2.1 Thanh đầu — cùng 12.1.1

Nút đủ vùng chạm. `Xem trang khách` full ngang. Hai nút Đăng lô / Soạn bài một hàng.

#### 12.2.2 Thẻ đếm — cùng 12.1.2

Lưới **2×2**. Ẩn gợi ý dưới số. Chữ nhỏ hơn (như GD mobile).

#### 12.2.3 Item lô (thẻ)

1. Thumb trái
2. Tiêu đề đậm + hangtag Web
3. Địa chỉ dòng phụ
4. Giá `crm-money` hoặc `Liên hệ`
5. Bấm thẻ → cùng confirm 12.1.3

Footer đếm dưới list lô.

#### 12.2.4 Item bài (thẻ)

1. Hangtag chuyên mục + hangtag trạng thái
2. Tiêu đề
3. Bấm thẻ → cùng confirm 12.1.4

Footer đếm dưới list bài.

---

## 13. List `/dashboard/lo-dat`

### 13.1 Máy tính

```
┌ H1 Lô đất public mở bán                                      ┐
├ Ô tìm (CrmSearchField)                     [ Đăng lô ]       │
├ Bảng §4.5: Ảnh · Tiêu đề · Giá · Web                         │
└ Footer đếm                                                   ┘
```

1. Ô tìm — placeholder `Tìm tiêu đề, địa chỉ...`. Hangtag Clear sau caret. Gõ là lọc.
2. **Đăng lô** — cùng hàng ô tìm; dialog chọn lô chờ đăng.
3. Bảng — cùng cột 12.1.3. Không icon lọc cột (slice này).
4. Bấm hàng → `CrmConfirm` Đăng web / Gỡ web (12.1.3).
5. Footer: `Hiển thị N / Tổng M lô` (N đã lọc, M cả list).

Trống: `Không có lô trên web.`

### 13.2 Mobile

Cùng 13.1. Thẻ xếp dọc như 12.2.3. Ô tìm trên list.

Nhớ tìm + dòng chọn: `sessionStorage` `crmanhung:public-lot-list-state`.

---

## 14. List `/dashboard/bai-viet`

### 14.1 Máy tính

```
┌ H1 Bài viết                                                  ┐
│ Dòng phụ: Dự án, kiến thức, liên hệ, chính sách bảo mật…     │
├ Ô tìm                                      [ Soạn bài ]      │
├ Bảng §4.5: Chuyên mục · Tiêu đề · Trạng thái                 │
└ Footer đếm                                                   ┘
```

1. Ô tìm — `Tìm tiêu đề, chuyên mục...`
2. **Soạn bài** — dialog tiêu đề + chuyên mục; Lưu nháp / Xuất bản. Nội dung dài = slice sau.
3. Hangtag chuyên mục `blue`: Dự án · Kiến thức · Liên hệ · Chính sách bảo mật · Tin tức · Kinh nghiệm
4. Hangtag trạng thái: Đã xuất bản `green` · Nháp `gray`
5. Bấm hàng → `CrmConfirm` Xuất bản / Về nháp (12.1.4).

Trống: `Không có bài viết.`

### 14.2 Mobile

Cùng 14.1. Thẻ: hai hangtag + tiêu đề.

Nhớ list: `crmanhung:public-post-list-state`.


