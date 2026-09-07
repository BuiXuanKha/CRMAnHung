# Domain: Nội dung web công khai (Khách / đăng web)

- **Slug:** `public-content`
- **Status:** Done — STAFF soạn/đăng **lô của mình** trên `/dashboard/lo-dat`. ADMIN **không** vào trang lô / không đăng-sửa-tạo listing (lô thuộc NV). ADMIN: Tổng quan + bài CMS + thống kê. Bốn trang CRM không thêm công tắc Đăng web.
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
| **Khách** | Chưa login | Tin tức, bài đăng, lô đất **đã Đăng web** |
| **NV đăng lô** | STAFF đã login CRM | Soạn / Đăng **lô mình tạo** đang Mở bán (`/dashboard/lo-dat`) |
| **Admin đăng web** | ADMIN đã login CRM | Soạn **bài CMS** rồi public / gỡ; xem tổng quan. **Không** đăng/sửa/tạo lô |

Khách không cần tài khoản. Không lộ dữ liệu CRM nội bộ (tên khách, SĐT, NV, hoa hồng, GD, chăm sóc).

---

## 2. Actors & quyền

| Actor | Được | Không |
|-------|------|--------|
| Khách (chưa login) | Đọc bài / lô **đã public**; share URL | Sửa, xem bản nháp, vào CRM |
| STAFF | CRM của mình + soạn / **Đăng web** **lô `createdByEmployeeId` = mình** (không Gỡ web) | Bài CMS (`/dashboard/bai-viet`); lô NV khác; Tổng quan dashboard |
| ADMIN | Bài CMS + thống kê + xem tổng quan (số lô trên web) | Đăng / soạn / tạo listing lô (thuộc NV); `/dashboard/lo-dat` |

Chốt (2026-09-06): lô không của Admin — STAFF tự đăng lô của mình. Bài viết CMS vẫn **chỉ ADMIN**. Trang khách vẫn thương hiệu công ty — không lộ PII / hoa hồng / tên NV.

---

## 3. Khái niệm & trạng thái

Ba loại nội dung khách thấy:

| Loại | Nguồn | Public khi |
|------|--------|------------|
| **Lô đất cần bán** | Một `Lodat` CRM (luồng NV) | NV của lô bật **Đăng web** |
| **Tin tức** | Bài CMS (`PublicPost`, chuyên mục tin) | Admin **Xuất bản** |
| **Bài đăng** | Cùng CMS; chuyên mục dự án / kiến thức / kinh nghiệm | Admin **Xuất bản** |

### 3.1 Lô trên web ≠ mọi lô Mở bán

CRM: công tắc **Mở bán / Tạm dừng** là việc nội bộ NV–khách.

Web: công tắc **Đăng web** là việc NV của lô chọn lô nào khách được thấy.

| CRM | Web khách |
|-----|-----------|
| Tạm dừng / nháp / thiếu ảnh | Không hiện |
| Mở bán nhưng chưa Đăng web | Không hiện |
| Đăng web + đang Mở bán | Hiện `/mua-ban-nha-dat-huyen-nam-sach/[slug]` |
| Đang Đăng web rồi Tạm dừng / Đã cọc / Đã bán | Khách: list/chi tiết chỉ hiện khi **Đăng web ∩ Mở bán**. **Không** tự tắt công tắc Đăng web — Gỡ tường minh trên dashboard |

### 3.2 Bài viết

Cùng entity `PublicPost`:

| Field ý niệm | Nghĩa |
|--------------|--------|
| `category` | `du-an` · `kien-thuc` · `lien-he` · `chinh-sach` · `tin-tuc` · `kinh-nghiem` |
| `status` | `DRAFT` · `PUBLISHED` |
| `slug` | URL ổn định, unique |
| `coverImageUrl` | Ảnh bìa / thumbnail (CDN) |
| `bodyHtml` | Nội dung rich text + ảnh đan xen |

### 3.3 Cấm lộ trên public

Không bao giờ hiện: tên khách, SĐT khách, tên NV, hoa hồng, ghi chú nội bộ lô/map, lịch sử GD, chat, file mật.

Được hiện (khi đã Đăng web): tiêu đề, ảnh lô/dự án, DT · MT · hướng, hangtag Nhà/Đất, địa chỉ (tỉnh/huyện/xã/thôn-dự án), giá **nếu** người soạn chọn công bố (**đã làm mờ**, không đúng số CRM — vd. 3,2 tỷ → `3 tỷ xxx`), mô tả public, nút gọi. Liên hệ: **hotline công ty** khi hết cookie share; **SĐT nhân viên share** khi còn cookie 30 ngày (trang chủ + chi tiết lô, kể cả lô NV khác); **tên + SĐT + avatar NV đã login** khi NV xem trang khách (§18). JSON-LD/canonical luôn hotline công ty.

---

## 4. Use cases

1. **Khách vào /** — hero brand + **ô tìm bài đăng** + lô đã đăng + teaser tin/bài. Không login.
2. **Khách xem lô** — `/mua-ban-nha-dat-huyen-nam-sach` và `/…/[slug]`; share OG.
3. **Khách đọc bài** — list + chi tiết theo chuyên mục.
4. **NV đăng lô** — list `/dashboard/lo-dat`: một lần bấm = preview; double-click = modal **Soạn bài đăng** (prefill copy đã lọc) → Lưu nháp / Đăng web. STAFF chỉ thấy lô mình tạo. ADMIN không vào trang này.
5. **Gỡ lô** — **đã bỏ** Gỡ Đăng web; khách ẩn khi hết Mở bán.
6. **Admin soạn bài** — nháp → Xuất bản / Gỡ về nháp. Chỉ ADMIN.
7. **Lô đổi trạng thái CRM** — không tự tắt Đăng web; Gỡ tường minh trên dashboard nếu cần.

---

## 5. Quan hệ dữ liệu

```
Lodat  1──0..1  PublicListing     (slug, isPublished, pricePublic, publicTitle, excerpt, metaDescription?, cover)
PublicPost                        (category, slug, status, cover, body) — không gắn khách
```

- Một `Lodat` tối đa một listing.
- Lô **kho** (`ProjectLot`): tối đa **một** listing đang public trên cùng số lô (tránh LK12 hiện 2 lần vì hai NV). STAFF gặp luồng NV khác đang hiện → lỗi. ADMIN không đăng lô nên không gỡ sibling.
- Ownership listing theo `Lodat.createdByEmployeeId` (cùng `/lo-dat`). STAFF không đọc/sửa overlay lô người khác.

Ảnh public = ảnh lô + ảnh dự án đã có trên CRM (R2 public CDN). Không copy file.

---

## 6. UI (màn hình)

| Màn | Route | Việc |
|-----|--------|------|
| **Dashboard** | `/dashboard` | Tổng quan + menu trái. **ADMIN.** §12 |
| **Lô đất** | `/dashboard/lo-dat` | List lô đăng web. **STAFF.** Admin vào URL này → `/dashboard`. §13 |
| **Bài viết** | `/dashboard/bai-viet` | List bài (dự án, kiến thức, liên hệ, chính sách…). **ADMIN.** §14 |
| **Thống kê** | `/dashboard/thong-ke` | List NV + số lô đã share + lượt xem (cookie NV và **Truy cập trực tiếp**). **ADMIN.** §20 |
| Trang chủ khách | `/` | Ô tìm bài đăng (trên «Sản phẩm dành cho bạn») → catalog `?q=` · lô đã Đăng web · **Dự án nổi bật** = bài `PUBLISHED` `/du-an` (tối đa 3) |

**Không** thêm công tắc Đăng web trên `/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do`.

Menu **trong** Dashboard: ADMIN = Tổng quan · Bài viết · Thống kê (không Lô đất). STAFF = chỉ **Lô đất** (vào `/dashboard`, `/dashboard/bai-viet`, `/dashboard/thong-ke` → `/dashboard/lo-dat`). ADMIN vào `/dashboard/lo-dat` → `/dashboard`.

Header CRM: bốn mục NV. STAFF thêm **Đăng web** → `/dashboard/lo-dat`. ADMIN thêm **Dashboard** (không thêm mục Đăng web trùng).

**Sau login thành công:** ADMIN vào **`/dashboard` trước** (trang đầu). STAFF vào `/khach-hang`. Logo CRM (góc trái) của admin cũng về `/dashboard`.

---

## 7. Contract / API dự kiến

Prefix `/api/v1`. Dashboard mock: `packages/shared/src/public-content.ts`.

| Method | Path | Auth | Việc |
|--------|------|------|------|
| GET | `/admin/public-web/lots` | JWT ADMIN, STAFF | Overlay bài đăng (STAFF = lô mình tạo) |
| POST | `/admin/public-web/media` | JWT ADMIN, STAFF | Upload ảnh public (TipTap lô / bìa bài) → CDN R2 |
| PATCH | `/admin/public-web/lots/:id/published` | JWT STAFF | Đăng lô (`isPublished: true`) — ownership lô; Admin 403 |
| PATCH | `/admin/public-web/lots/:id/draft` | JWT STAFF | Lưu copy public — ownership lô; Admin 403 |
| POST | `/admin/public-web/lots/gpt-content` | JWT STAFF | Nest gọi OpenAI — JSON SEO lô; Admin 403 |
| PATCH | `/admin/public-web/posts/:id/status` | JWT ADMIN | Xuất bản / về nháp — **Postgres** |
| GET | `/admin/public-web/posts` | JWT ADMIN | List bài (nháp + đã xuất bản) — **Postgres** |
| POST | `/admin/public-web/posts` | JWT ADMIN | Soạn bài (tiêu đề + chuyên mục + body) — **Postgres** |
| POST | `/admin/public-web/posts/gpt-content` | JWT ADMIN | Nest gọi OpenAI — bài **dự án** từ tên dự án → JSON SEO |
| GET | `/admin/lot-shares/employee-stats` | JWT ADMIN | List NV + `sharedListingCount` + `attributedViewCount` + `directViewCount` |
| POST | `/public/page-views` | Không (bỏ nếu có JWT NV) | +1 lượt xem: có `shareCode` hợp lệ → NV; không → **Truy cập trực tiếp** |
| POST | `/public/lot-shares/:code/page-view` | Không (bỏ nếu có JWT NV) | +1 lượt xem cho NV của mã share (giữ tương thích) |
| GET | `/public/listings` | Không | Lô đã đăng ∩ Mở bán → `publicCatalogListingSchema` |
| GET | `/public/listings/:slug` | Không | Chi tiết `/mua-ban-nha-dat-huyen-nam-sach/[slug]` — 404 nếu nháp / đã gỡ / không Mở bán |
| GET | `/public/posts` | Không | Bài `PUBLISHED` (`?category=` tuỳ chọn) → `publicGuestPostListResponseSchema` |
| GET | `/public/posts/:category/:slug` | Không | Chi tiết bài — 404 nếu nháp / sai chuyên mục |

---

## 8. Dữ liệu

Overlay Đăng web + catalog khách gọi API. Không RAM mock theo user nháp. Trống thì empty state.

---

## 9. Extension?

- [x] Không — không ingest Meta.

---

## 10. Migrate từ hệ cũ

Không có bảng CMS cũ. Listing/post = dữ liệu **mới**. Lô nguồn = `Lodat` đã copy.

---

## 11. Luật dashboard (chốt 2026-09-06)

1. STAFF vào `/dashboard/lo-dat` (header **Đăng web**). `/dashboard`, `/dashboard/bai-viet`, `/dashboard/thong-ke` của STAFF → `/dashboard/lo-dat`. ADMIN **không** vào `/dashboard/lo-dat` (redirect `/dashboard`). Bốn trang CRM **không** thêm công tắc Đăng web.
2. Lô lên web = công tắc tường minh **STAFF lô mình** — không auto theo Mở bán hay giao dịch. Admin không đăng/sửa/tạo listing.
3. Tắt Mở bán / tạo GD **không** tự tắt Đăng web. **Không** còn Gỡ Đăng web — listing đã đăng giữ `isPublished`; khách chỉ thấy khi Đăng web ∩ đang Mở bán.
4. Giá từng lô: hiện số **đã làm mờ** (không đúng số CRM) hoặc **Liên hệ**.
5. Cùng số lô kho → một listing public. STAFF không gỡ luồng NV khác đang hiện — báo lỗi.
6. Bài viết CMS = **chỉ ADMIN**; chuyên mục: dự án, kiến thức, liên hệ, chính sách bảo mật, tin tức, kinh nghiệm.
7. Liên hệ khách: hết cookie → hotline công ty. Còn cookie share NV → SĐT + avatar NV trên **trang chủ** (header + thẻ) và **chi tiết lô** trong **30 ngày**. Link NV khác ghi đè và đếm lại 30 ngày; cùng NV không reset. NV đã login CRM → số mình (thắng cookie) (§18). Chưa form SĐT.
8. Soạn bài đăng: double-click hàng/thẻ → modal copy public. Giá CRM **làm mờ**. Không copy hoa hồng, ghi chú nội bộ / chủ nhà, tên/SĐT khách.

---

## 12. Dashboard `/dashboard` — ADMIN

Thứ tự: **12.1 máy tính** → **12.2 mobile**. Không trộn PC/mobile trong một mục.

Không H1 lặp tên menu trên thanh tìm. H1 trên Tổng quan, Bài viết, Thống kê; **`/dashboard/lo-dat` không H1** (tên đã có trên menu trái).

### 12.0 Menu trong Dashboard (mọi màn `/dashboard/*`)

**Máy tính:** cột trái. Active chữ xanh `#2563eb` **700** + nền `#eff6ff`.

ADMIN — 3 mục:

1. **Tổng quan** → `/dashboard`
2. **Bài viết** → `/dashboard/bai-viet`
3. **Thống kê** → `/dashboard/thong-ke`

STAFF — chỉ **Lô đất** → `/dashboard/lo-dat`.

**Mobile:** cùng mục, cuộn ngang trên đầu nội dung.

---

### 12.1 Giao diện máy tính

```
┌ Dashboard              [Xem trang khách] [Soạn bài] ┐
│ Dòng phụ: khách chỉ thấy nội dung đã đăng                    │
├ 4 thẻ đếm (kiểu §4.3.6, không card marketing)                │
├ Hai cột: bảng Lô trên web · bảng Bài viết gần đây  (§4.5)    │
└ Không rail phải                                              │
```

#### 12.1.1 Thanh đầu trang

1. **H1** `Dashboard`
2. Dòng phụ: `Khách trên anhungland.com chỉ thấy lô và bài đã đăng.`
3. **Xem trang khách** — viền; mở `/` tab mới
4. **Soạn bài** — primary → dialog tiêu đề + chuyên mục → Lưu nháp / Xuất bản

#### 12.1.2 Bốn thẻ đếm

Cùng hình thức thẻ GD: nền trắng, viền `#e2e8f0`, bo 12px. 4 cột.

| Thẻ | Số | Gợi ý |
|-----|----|--------|
| Lô đang hiện | `publishedLotCount` | Khách thấy trên `/mua-ban-nha-dat-huyen-nam-sach` |
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

Bấm nền hàng: chọn dòng (xem). **Không** Đăng web từ Tổng quan — lô thuộc NV (`/dashboard/lo-dat`). Lô đang hiện: hangtag; không Gỡ web.

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
├ [Soạn bài]                       │
├ 4 thẻ đếm — lưới 2×2             │
├ Thẻ lô xếp dọc                   │
└ Thẻ bài xếp dọc                  │
```

#### 12.2.1 Thanh đầu — cùng 12.1.1

Nút đủ vùng chạm. `Xem trang khách` full ngang. **Soạn bài** một hàng (không nút Đăng lô).

#### 12.2.2 Thẻ đếm — cùng 12.1.2

Lưới **2×2**. Ẩn gợi ý dưới số. Chữ nhỏ hơn (như GD mobile).

#### 12.2.3 Item lô (thẻ)

1. Thumb trái
2. Tiêu đề đậm + hangtag Web
3. Địa chỉ dòng phụ
4. Giá `crm-money` hoặc `Liên hệ`
5. Bấm thẻ → chọn dòng (xem). Không confirm Đăng web.

Footer đếm dưới list lô.

#### 12.2.4 Item bài (thẻ)

1. Hangtag chuyên mục + hangtag trạng thái
2. Tiêu đề
3. Bấm thẻ → cùng confirm 12.1.4

Footer đếm dưới list bài.

---

## 13. List `/dashboard/lo-dat`

Nguồn list = **cùng lô CRM đang Mở bán** trên `/lo-dat` (**STAFF = lô mình tạo**). Overlay đăng web (slug, copy, `isPublished`) từ API. Một lần bấm hàng → preview phải. Double-click → modal **Soạn bài đăng**. **Đăng web** từ preview (lô chờ đăng) hoặc từ modal (lưu copy rồi `CrmConfirm`). **ADMIN không vào trang này.**

Không hiện trên list/preview/bài khách: tên khách, SĐT khách, hoa hồng, ghi chú nội bộ / thương lượng chủ nhà. Giá cột + preview = giá **công khai** (đã làm mờ), không đúng số CRM.

### 13.1 Máy tính

```
┌ Ô tìm (CrmSearchField, chrome trắng viền như /lo-dat)        ┐
├ Bảng §4.5 (giữa)                      │ Preview (phải ~440px) │
│ Ảnh · Tiêu đề/Địa chỉ · Phân loại     │ Ảnh + copy + CTA      │
│ DT·MT·Hướng · Giá · NV · Web · AI GPT │                       │
└ Footer đếm                            │                       ┘
```

1. **Không** H1 (tên đã có trên menu trái: **Lô đất**).
2. Ô tìm — khung trắng bo 12px, input viền `#cbd5e1` / focus xanh. Placeholder `Tìm tiêu đề, địa chỉ, nhân viên...`. Hangtag Clear sau caret. Gõ là lọc. **Không** nút Đăng lô cạnh ô tìm.
3. **Giữa — bảng** lô đang Mở bán (STAFF: của mình). Lọc cột §4.5.5. Không cột Thao tác / công tắc rao bán. Không tên khách. Cột **AI GPT** (nút GPT) → modal textarea JSON request GPT (§13.3a).
4. Bấm hàng một lần → chọn dòng (nền `#eff6ff`) + cập nhật preview. **Không** mở confirm / editor.
5. Double-click hàng → modal **Soạn bài đăng** (§13.3). Lần bấm đầu vẫn chọn + preview.
6. Footer: `Hiển thị N / Tổng M lô` (N đã lọc, M cả list Mở bán).

**Lọc cột (icon `ListFilter` sát chữ tên cột)**

| Cột | Menu |
|-----|------|
| Ảnh | Tất cả ảnh · Có ảnh · Chưa có ảnh |
| Tiêu đề / Địa chỉ | Tất cả địa chỉ · Có địa chỉ · Chưa có địa chỉ |
| Phân loại | Tất cả · Nhà · Đất |
| DT · MT · Hướng | Khoảng DT + hướng (AND), cùng `/lo-dat` |
| Giá | Khoảng 500tr + Chưa có giá — theo giá hiện trên cột (Liên hệ = chưa có giá) |
| NV | Tất cả NV · từng tên NV trong list |
| Web | Tất cả web · Đang hiện · Chờ đăng |
| AI GPT | Không lọc (nút mở modal) |

Không lọc trạng thái Mở bán (list đã chỉ lô đang mở bán). Không dropdown lọc trên thanh tìm desktop.

**Cột bảng**

| Cột | Ô |
|-----|---|
| Ảnh | Thumb 52px; thiếu = ô xám + `ImageOff` |
| Tiêu đề / Địa chỉ | **Đậm**; dòng phụ địa chỉ. Không tên khách |
| Phân loại | Hangtag Nhà `blue` / Đất `amber` |
| DT · MT · Hướng | DT dòng 1; MT · hướng dòng phụ. Trống: `—` |
| Giá | Giá công khai (`crm-money`) hoặc `Liên hệ` — không đúng số CRM |
| NV | Tên nhân viên đang rao lô |
| Web | **Đang hiện** `green` · **Chờ đăng** `gray` |
| AI GPT | Nút **GPT** (`Sparkles`) → `LotGptContentDialog` — JSON request + Gửi GPT + phản hồi |

### 13.3a Modal Tạo content bằng AI GPT

Icon Lucide `Sparkles`. `CrmDialog` rộng. Body = textarea **Mô tả thêm** (bắt buộc — NV nhập điểm nổi bật thực địa) + textarea JSON request (tự cập nhật, sửa được) + **Gửi** (disabled khi chưa nhập mô tả) → `POST /admin/public-web/lots/gpt-content` (STAFF, Nest gọi OpenAI `gpt-5.6-sol`) + textarea **Phản hồi GPT** (readonly). `OPENAI_API_KEY` + `OPENAI_MODEL` trên server — không commit.

**Request JSON (bắt buộc + tùy chọn):**

```json
{
  "title": "Lô 33 đấu giá Mạn Đê Nam Trung",
  "location": { "village": "Mạn Đê", "commune": "Nam Trung", "district": "Nam Sách", "province": "Hải Dương" },
  "area": 83,
  "residentialArea": null,
  "frontage": 4.5,
  "direction": "Bắc",
  "price": null,
  "priceText": "2 tỷ xxx",
  "kind": "DAT",
  "excerpt": "…",
  "slug": "lo-33-dau-gia-…",
  "extraDescription": "Lô góc, sát mẫu giáo, vỉa hè 3m, đèn cao áp…"
}
```

- `location.*` tách từ chuỗi địa chỉ public (detail → village, ward → commune, …); thiếu = `""`.
- `residentialArea`: parse từ tiêu đề/mô tả (`Thổ cư Nm²`) nếu có; không có trong DB → `null`.
- `price`: số VND từ nhãn giá công khai khi parse được; không thì `null` + `priceText`.
- `kind`, `excerpt`, `slug`: từ overlay lô khi có.
- `extraDescription`: **bắt buộc** — từ ô «Mô tả thêm *» trong modal.

**System prompt:** chuyên gia SEO An Hưng Land (Nam Sách) — quy tắc dữ liệu, SEO, không bịa pháp lý/quy hoạch; ưu tiên structured fields; `extraDescription` = thực địa NV.

**Response JSON (GPT trả về):**

```json
{
  "seoTitle": "…",
  "h1": "…",
  "metaDescription": "…",
  "slug": "ban-lo-…",
  "excerpt": "…",
  "bodyHtml": "<p>…</p><h2>…</h2>",
  "facebookPost": "…"
}
```

Map sang editor: nút **Dùng cho bài đăng** (sau khi có phản hồi) → mở modal §13.3 với `h1` → tiêu đề, **`bodyHtml` → Mô tả công khai** (luôn ghi đè overlay cũ), `slug`, `metaDescription`. `facebookPost` giữ trong JSON — UI chia sẻ Facebook để sau.

Trống: `Không có lô đang mở bán.`

**Phải — preview bài đăng** (cột cố định ~440px, luôn mở trên máy tính)

1. Nhãn `Preview Post`
2. Chưa chọn dòng: `Chọn một lô đang mở bán để xem bài đăng.`
3. Có chọn: ảnh bìa, hangtag Web, tiêu đề, địa chỉ, giá, DT · MT · hướng, hangtag Nhà/Đất, mô tả public (không PII), hotline công ty
4. Nút **Đăng web** khi chờ đăng → `CrmConfirm`. **Không** nút Gỡ web. Link `Xem trên anhungland.com` khi đang hiện.

### 13.2 Mobile

Cùng 13.1. Thẻ xếp dọc (ảnh + tiêu đề + hangtag Web + địa chỉ + phân loại + DT/MT/hướng + NV + giá). Preview **dưới** list khi đã chọn dòng — không rail phải.

Thanh tìm: ô tìm + **Bộ lọc** + **Tìm**. Panel: Phân loại · Giá · Web · NV. **Xoá lọc** xóa mọi lọc (cả cột desktop). Desktop không hiện Bộ lọc / Tìm.

Một lần chạm thẻ → chọn + preview. Double-tap / double-click → cùng modal 13.3.

Nhớ tìm + lọc + dòng chọn: `sessionStorage` `crmanhung:public-lot-list-state`.

### 13.3 Modal Soạn bài đăng

Cùng máy tính / mobile. Icon Lucide `PenLine`. Khung `CrmDialog` rộng (`crm-dialog--wide`, ~840px). Không `window.confirm`.

1. Prefill copy **công khai** từ lô đang Mở bán: tiêu đề, địa chỉ, giá đã làm mờ, mô tả (DT · MT · hướng · loại + CTA hotline công ty).
2. **Không** copy: hoa hồng, ghi chú giá / broker, ghi chú thương lượng chủ nhà, tên/SĐT khách, tên NV.
3. Ô chỉ đọc: giá gốc CRM không hiện đúng cho khách; người soạn duyệt giá công khai.
4. Sửa được: tiêu đề, địa chỉ public, chế độ giá (`AMOUNT` / `CONTACT`) + nhãn giá, **mô tả rich text (TipTap)**. Ảnh bìa = ảnh lô (không upload slice này).
5. Toolbar editor: Đậm · Nghiêng · H2 · H3 · Danh sách · Chèn ảnh (upload mock/R2 public CDN).
6. **Huỷ** · **Lưu nháp** (ghi overlay; không đổi `isPublished`; được thiếu mô tả) · **Đăng web** (lưu overlay rồi `CrmConfirm` nếu đang chờ đăng — **bắt buộc** có nội dung mô tả).
7. Sau lưu: list + preview cập nhật tiêu đề / giá / hangtag Web. Preview render HTML mô tả.

---

## 14. List `/dashboard/bai-viet`

### 14.1 Máy tính

```
┌ H1 Bài viết                                                  ┐
│ Dòng phụ: Dự án, kiến thức, liên hệ, chính sách bảo mật…     │
├ Ô tìm              [ Soạn bài bằng GPT AI ] [ Soạn bài ]     │
├ Bảng §4.5: Chuyên mục · Tiêu đề · Trạng thái                 │
└ Footer đếm                                                   ┘
```

1. Ô tìm — `CrmSearchField`, placeholder `Tìm tiêu đề, chuyên mục...`. Gõ là lọc. Hangtag Clear sau caret.
2. **Soạn bài bằng GPT AI** — modal §14.4: nhập tên dự án → JSON SEO chuyên mục **Dự án**.
3. **Soạn bài** — dialog chuyên nghiệp (§14.3): tiêu đề + chuyên mục; Lưu nháp / Xuất bản. GPT «Dùng cho bài soạn» mở dialog này (đã điền).
4. Hangtag chuyên mục `blue`: Dự án · Kiến thức · Liên hệ · Chính sách bảo mật · Tin tức · Kinh nghiệm
5. Hangtag trạng thái: Đã xuất bản `green` · Nháp `gray`
6. Bấm hàng → `CrmConfirm` Xuất bản / Về nháp (12.1.4). Toast khi xong.
7. Lọc cột §4.5.5 (icon `ListFilter` sát chữ tên cột). Không cột Thao tác.

| Cột | Menu |
|-----|------|
| Chuyên mục | Tất cả chuyên mục · từng chuyên mục (6 mục) |
| Tiêu đề | Không lọc cột (chỉ ô tìm) |
| Trạng thái | Tất cả trạng thái · Đã xuất bản · Nháp |

Footer: `Hiển thị N / Tổng M bài` (N đã lọc, M cả list).

Trống: `Không có bài viết.` (không lọc) · `Không có bài viết phù hợp.` (đang lọc / tìm).

### 14.2 Mobile

Cùng 14.1. Thẻ: hai hangtag + tiêu đề. Thanh tìm: ô tìm + **Bộ lọc** + **Tìm**. Panel: Chuyên mục · Trạng thái. **Xoá lọc** xóa lọc cột (giữ từ khoá ô tìm). Desktop không hiện Bộ lọc / Tìm.

Nhớ tìm + lọc + dòng chọn + cuộn: `sessionStorage` `crmanhung:public-post-list-state`.

### 14.3 Modal Soạn bài viết (trình soạn thảo)

Cùng máy tính / mobile. Icon Lucide `PenLine`. Khung `CrmDialog` rộng (`crm-dialog--wide`, ~840px). Không `window.confirm`. Không copy kiểu “mock / slice sau” trên UI.

**Trường**

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| Tiêu đề | Có | Max 160; đếm `n/160` |
| Chuyên mục | Có | Chip chọn (6 mục) |
| Ảnh bìa (thumbnail) | **Xuất bản** | ~16:9; JPG/PNG/WEBP → CDN WebP `{slug}-anh-1.webp`. Alt trang khách = tiêu đề. Nháp được trống. Không ô Alt/Title riêng |
| Nội dung | **Xuất bản** | Rich text (TipTap): đậm/nghiêng/H2/H3/list + **ảnh đan xen** (`{slug}-anh-n.webp`, alt = tiêu đề) |
| Đường dẫn dự kiến | Chỉ đọc | `/{category}/{slug}` từ tiêu đề qua `toPublicPostSlug` — **không cắt** 60/80 ký tự |

**Hành vi**

1. Dòng phụ: bài hiện trên web khách theo chuyên mục; nháp chỉ admin; Xuất bản = khách đọc được.
2. Ảnh bìa: **Chọn ảnh** · **Gỡ ảnh** + preview.
3. Toolbar editor: Đậm · Nghiêng · H2 · H3 · Danh sách · Chèn ảnh (upload → chèn vào vị trí con trỏ).
4. Ảnh bìa + ảnh trong bài = bucket **public** R2, **WebP** (`sharp`), tên file `{slug-tieu-de}-anh-n.webp`. Alt trên trang khách = tiêu đề. Mock: URL tạm / stub.
5. **Huỷ** · **Lưu nháp** (được thiếu ảnh/nội dung) · **Xuất bản** (thiếu ảnh bìa hoặc nội dung trống → lỗi form).
6. Lỗi validate / API: `crm-form-error`.

Slice API Postgres + upload R2 thật = sau khi mock UI ổn.

### 14.4 Modal Soạn bài bằng GPT AI (dự án)

Cùng máy tính / mobile. Icon Lucide `Sparkles`. `CrmDialog` rộng (`crm-dialog--wide crm-dialog--gpt`). Không `window.confirm`.

**Trường**

| Trường | Bắt buộc | Ghi chú |
|--------|----------|---------|
| Tên dự án | Có | Max 160. VD: `Khu đô thị Tây Nam Sách` |
| Ghi chú thêm | Không | Investor / quy mô / điểm admin biết — GPT được dùng |
| Prompt hệ thống | Chỉ đọc | `POST_GPT_SYSTEM_PROMPT` |
| JSON gửi GPT | Sửa được | Tự cập nhật từ tên dự án |
| Phản hồi GPT | Chỉ đọc | JSON SEO đầy đủ |

**Hành vi**

1. Dòng phụ: GPT viết bài **chuyên mục Dự án** từ tên dự án + kiến thức công khai. Admin phải đọc lại. Không thay Google; không bịa pháp lý / giá / hotline.
2. **Gửi** (disabled khi chưa nhập tên) → `POST /admin/public-web/posts/gpt-content` (ADMIN, Nest → OpenAI `OPENAI_MODEL`). Cùng key với GPT lô.
3. JSON trả về: `seoTitle`, `h1`, `metaDescription`, `slug`, `excerpt`, `bodyHtml`, `facebookPost`, `locationLabel`.
4. **Dùng cho bài soạn** — đóng GPT, mở §14.3 đã điền: chuyên mục Dự án, H1 = title, body, excerpt, meta. Admin thêm ảnh bìa rồi Lưu nháp / Xuất bản.
5. Ảnh bìa **không** do GPT tạo.

---

## 15. SEO lô trên trang khách

Chi tiết kỹ thuật: [`PUBLIC-SEO.md`](../PUBLIC-SEO.md) §7. Overlay soạn bài dashboard **không** đổi layout — chỉ có thể thêm `metaDescription` (tuỳ chọn).

1. URL khách: `/mua-ban-nha-dat-huyen-nam-sach/[slug]` — chỉ lô `isPublished` (không phụ thuộc `publishedAt`; cột đó = lần đăng đầu, có thể trống trên tin cũ).
2. Title = `seoTitle` (GPT) + `\| An Hưng Land`. H1 = `title` (GPT h1) — cùng địa danh, không bắt buộc trùng chữ. Meta = `metaDescription` hoặc excerpt.
3. Ảnh OG = ảnh bìa; thiếu → `/og-default.png`. Ảnh SEO: **tạo/sửa lô** đặt CDN key `{slug}-anh-n` (đổi title/địa chỉ rồi Lưu thì đổi key); Đăng web không làm lại. `alt` = `listingHeadline` (không lặp địa chỉ); sitemap `image:loc`; JSON-LD `ImageObject` — [`PUBLIC-SEO.md`](../PUBLIC-SEO.md) §10.
4. JSON-LD `RealEstateListing`: `name` = H1; giá = `priceLabel` công bố (hoặc bỏ số nếu Liên hệ / `xxx`); `itemOffered` Place/House + `floorSize` khi parse được.
5. Sitemap chỉ lô Đăng web ∩ Mở bán (+ URL ảnh CDN). Không Gỡ web — ẩn khỏi khách/sitemap khi hết Mở bán.
6. Cấm trên HTML + JSON-LD + meta: giá map CRM, hoa hồng, tên/SĐT khách, ghi chú nội bộ.

---

## 16. Roadmap ISR + SEO (triển khai dần)

**Mục tiêu:** Admin Lưu / Đăng / Xuất bản → Postgres → Next.js **ISR** → Googlebot + khách nhận HTML đầy đủ. **Revalidate on-demand** khi CRM lưu (không revalidate ngắn theo thời gian). Chi tiết SEO: [`PUBLIC-SEO.md`](../PUBLIC-SEO.md) §8.

**Thứ tự:** Phase 0 → 1 → (2→3→4 Lô) → (5→6→7 Bài) → 8.

### 16.0 Phase 0 — Nền

- [x] CRM `(crm)/layout` `robots: noindex` + `robots.ts` chặn `/dashboard`, CRM routes
- [x] Docs roadmap (§16 này) + PUBLIC-SEO §8 ISR
- [x] Secrets staging: `REVALIDATE_SECRET` (Next + Nest cùng giá trị), `PUBLIC_WEB_ORIGIN=http://127.0.0.1:5001` trên Nest — set VPS 2026-08-27; loopback revalidate 200
- [x] R2 public CDN ổn trên VPS (ảnh lô CDN); `pnpm doctor` local khi cần

### 16.1 Phase 1 — Media upload (chung lô + bài)

- [x] Contract: `uploadPublicMediaResponseSchema` `{ url, objectKey? }`
- [x] `POST /admin/public-web/media` — JWT ADMIN + STAFF, multipart, JPG/PNG/WEBP/GIF ≤ 5 MB → R2 **WebP** public CDN. Bài: optional `title` + `index` → `{slug}-anh-n.webp`
- [x] Web: `uploadPublicPostImage` gọi API (kèm title/index từ modal Soạn bài)
- [x] Bài cũ UUID: `pnpm images:seo-copy-posts` (`APPLY=1` trên VPS qua `[seo-copy-posts]`) — copy `{slug}-anh-n.webp` từng bài, không xóa file dùng chung

### 16.2 Phase 2 — Lô: DB + API

- [x] Prisma: `bodyHtml`, `publishedAt` trên `PublicLotListing`
- [x] Contract: draft = `bodyHtml`; guest catalog trả `bodyHtml`; `listingBodyToExcerpt`
- [x] Nest draft/published lưu + guest `GET /public/listings/:slug` trả body
- [x] Admin `/dashboard/lo-dat` TipTap + nối API (PR TipTap modal)

### 16.3 Phase 3 — Lô: guest ISR + revalidate

- [x] `/mua-ban-nha-dat/[slug]`: bỏ `force-dynamic` → ISR (`revalidate = false` hoặc rất dài)
- [x] Render `bodyHtml` SSR (sanitize)
- [x] `POST /api/revalidate` (secret) + Nest gọi sau draft (nếu đã published) / published / gỡ
- [x] Revalidate: slug + `/mua-ban-nha-dat` + sitemap (+ `/` khi đăng mới)

### 16.4 Phase 4 — Lô: QA SEO

- [x] Checklist PUBLIC-SEO §7 (title, meta, OG, JSON-LD, sitemap, gỡ → 404)
- [x] View Source có nội dung; Sharing Debugger (OG tags verified via View Source)

**QA staging `anhungland.com` (2026-08-27) — mẫu `/mua-ban-nha-dat/lo-nha-cap-4-moi-113-8m2`:**

| §7 | Kết quả |
|----|---------|
| Title / H1 `{title} tại {location}` | OK — khớp; title có `\| An Hưng Land` |
| Meta description từ excerpt ~160 | OK |
| Canonical tuyệt đối | OK |
| OG / Twitter + ảnh bìa CDN | OK |
| JSON-LD `RealEstateListing` + `BreadcrumbList` | OK — `1 tỷ xxx` / Liên hệ **không** bịa `Offer.price` |
| List `/mua-ban-nha-dat` title/H1/canonical/`ItemList` | OK |
| Sitemap chỉ lô published (5 = API 5) | OK |
| `/san-pham/…` → `/mua-ban-nha-dat/…` permanent | OK (308) |
| Slug giả / đã gỡ → 404 + `noindex` | OK |
| View Source có H1 + excerpt SSR | OK — meta/OG dùng excerpt; **on-page**: có `bodyHtml` thì không hiện lead `excerpt` (tránh trùng copy) |
| Layout chi tiết lô | Gallery · breadcrumb (Trang chủ → Nhà đất đang bán → **tên xã** → H1) · H1 · địa chỉ đủ dưới H1 · **một** strip Giá/DT/Hướng + Zalo/hotline hiện đủ số · related cùng xã + **Đất dự án khu vực Nam Sách** (3 khu PROJECT nhiều lô nhất). **Mobile thanh đáy:** «Liên hệ Zalo» + «Bấm là gọi» căn giữa + icon Lucide `Phone` |
| Chia sẻ | Copy **mô tả HTML→plain giữ xuống dòng** + URL (không nhồi H1/giá trùng). Mở Facebook để dán; không dùng sharer/`navigator.share` |
| robots cho phép list; chặn CRM `/login`… | OK (kèm Cloudflare managed) |

Sửa nhỏ kèm Phase 4: metadata 404 rõ hơn (không kế thừa canonical trang chủ); JSON-LD `dateModified` / `datePosted` khi API có.

### 16.5 Phase 5 — Bài: DB + API

- [x] Prisma `PublicPost` (slug, category, status, cover, bodyHtml, excerpt, meta*, publishedAt, authorLabel)
- [x] Admin CRUD + status; guest `GET /public/posts`, `GET /public/posts/:category/:slug`
- [x] Admin `/dashboard/bai-viet` nối API (bỏ mock RAM)

### 16.6 Phase 6 — Bài: guest ISR

- [x] Route `/{category}/{slug}` + list chuyên mục; ISR + on-demand revalidate
- [x] `generateMetadata` + JSON-LD `Article`; sitemap bài published
- [x] Trang chủ teaser từ API

### 16.7 Phase 7 — Bài: QA SEO

- [x] Cây SEO: title, slug, meta, cover+alt, bodyHtml, canonical, schema, ngày đăng/cập nhật

**QA staging `anhungland.com` (2026-08-27) — chưa có bài published trên DB; kiểm tra hub chuyên mục + code/mock:**

| §9 | Kết quả |
|----|---------|
| URL `/{category}/{slug}` (enum category) | OK — route `[category]/[slug]` |
| Title / H1 = `title` + template `\| An Hưng Land` | OK — `postMetadata` + `<h1>` SSR |
| Meta description = `metaDescription` hoặc excerpt ~160 | OK — `listingSearchDescription` |
| Canonical tuyệt đối | OK |
| OG / Twitter + ảnh bìa CDN (fallback `/og-default.png`) | OK |
| JSON-LD `Article` + `BreadcrumbList`: headline, image, datePublished, dateModified, author | OK |
| List chuyên mục title/H1/canonical + `ItemList` khi có bài | OK — hub `/du-an`, `/kien-thuc`, … |
| Sitemap chỉ bài `PUBLISHED` + hub category | OK — API `items: []` → sitemap không có URL bài |
| Slug giả / nháp / sai category → 404 + `noindex` | OK — `(public)/not-found.tsx` (không kế thừa canonical trang chủ) |
| View Source: H1 + excerpt + `bodyHtml` SSR (sanitize) | OK — mock + code |
| `<time dateTime>` ngày xuất bản trên trang chi tiết | OK |
| robots cho phép hub; chặn CRM `/login`… | OK |

Sửa nhỏ kèm Phase 7: `(public)/not-found.tsx` metadata 404; `unpublishedPostMetadata` OG; `ItemList` list chuyên mục; hiển thị `publishedAt` trên chi tiết bài.

### 16.8 Phase 8 — Vận hành

- [x] ~~Lô CRM không còn Mở bán → auto gỡ Đăng web~~ — **không làm** (chủ bác): Gỡ tường minh trên dashboard
- [x] Một listing public / số lô kho; không đổi slug sau publish (301 nếu bắt buộc — sau)
- [x] Log revalidate fail không rollback DB

**Triển khai (2026-08-27, chỉnh lại sau feedback):**

| Hạng mục | Cách làm |
|----------|----------|
| Gỡ web | **Đã bỏ (2026-09-05).** Không tắt `isPublished` từ UI/API user. Ẩn khách = hết Mở bán. (Sibling auto-unpublish khi Đăng lô kho khác vẫn giữ.) |
| Khách thấy lô | `isPublished` ∩ map `DANG_BAN` (rule guest API sẵn có — không đụng công tắc Đăng web) |
| Một listing / ProjectLot | STAFF không gỡ luồng NV khác đang hiện. Admin không đăng lô. |
| Slug ổn định | Slug = `toListingPublicSlug(title, leftover location)` lúc **tạo** listing (không trần 80; cấm `xa`). `PATCH draft` / Đăng lại **không** đổi slug trừ khi NV sửa ô slug |
| Đổi URL lô cũ | `pnpm lots:regenerate-public-slugs` dry-run; `APPLY=1` mới ghi `PublicLotSlugRedirect` + revalidate. Deploy **không** tự APPLY. VPS: commit `[apply-lot-slugs]` (hoặc `APPLY_LOT_SLUGS=1` trong `remote_deploy.sh`). Guest slug cũ → **301**. **Không** đổi tên file ảnh CDN |
| Revalidate fail | `PublicWebRevalidateService` log `warn` (kèm paths); **không throw** |

### 16.9 Luồng revalidate (chuẩn)

```
CRM (Lưu / Đăng / Xuất bản / Gỡ / Xóa)
  → PostgreSQL
  → Nest gọi Next revalidate (secret)
  → Next tạo/cập nhật HTML trang đó
  → Cache
  → Googlebot + khách
```

**PR gợi ý:** media → lot bodyHtml API → lot ISR+revalidate → PublicPost API → post guest ISR → admin nối API → auto-unpublish.

---

## 17. Hub địa bàn lô đất (Hướng A) — checklist đã chốt

**Mục tiêu:** SEO local theo sổ địa chỉ **4 cấp** (`addresses.md`). Không đụng `PublicPostCategory` / route bài viết (`/du-an`, `/kien-thuc`…).

### 17.1 Cây URL (chốt)

Path gốc catalog (đổi từ `/mua-ban-nha-dat`):

```
/mua-ban-nha-dat-huyen-nam-sach                         ← list tất cả lô huyện Nam Sách
/mua-ban-nha-dat-huyen-nam-sach/[slug]                   ← chi tiết 1 lô
/mua-ban-nha-dat-huyen-nam-sach/xa/[slug-xa]             ← hub xã (cấp 3)
/mua-ban-nha-dat-huyen-nam-sach/xa/[slug-xa]/[slug-c4]  ← hub cấp 4 trong xã
```

Cấp 4 = `Address.detail`: đất dân → thôn/tổ; dự án → tên KĐT/dự án. **KĐT thuộc xã**, không song song với xã.

Ví dụ:

| Trang | URL |
|-------|-----|
| List | `/mua-ban-nha-dat-huyen-nam-sach` |
| Lô | `/mua-ban-nha-dat-huyen-nam-sach/lo-33-dau-gia-man-de-nam-trung` |
| Xã Nam Trung | `/mua-ban-nha-dat-huyen-nam-sach/xa/nam-trung` |
| KĐT trong Nam Trung | `/mua-ban-nha-dat-huyen-nam-sach/xa/nam-trung/kdt-tay-nam-sach` |
| Thôn Mạn Đê trong Nam Trung | `/mua-ban-nha-dat-huyen-nam-sach/xa/nam-trung/man-de` |

**Không** dùng `/mua-ban-nha-dat/khu/...` ngang hàng với `/xa/...`.

Bài CMS giữ nguyên: `/du-an/...`, `/kien-thuc/...` (khác hub lô).

### 17.2 Quy tắc nghiệp vụ

1. **Hub xã (cấp 3) là trang cố định** — lưu `PublicCommuneHub` theo `wardId` (slug + tên xã + huyện + tỉnh). Site chỉ bán **huyện Nam Sách, Hải Dương** (không dùng hậu tố huyện vì trùng tên xã hai huyện). Lần đầu có listing `isPublished` (kể cả sau này hết Mở bán) → tạo hàng hub; **không xóa** khi 0 lô đang bán. Guest `/xa/{slug}` **200** + câu «Hiện không có lô đang bán…»; **không** 404. Sitemap **giữ** URL xã đã lưu. Đổi tên xã → slug mới, slug cũ **301** (`PublicCommuneHubRedirect`). Slug giả / chưa từng có hub → 404 + noindex.
2. Gom lô: cấp 3 = `wardId`; cấp 4 = `address.detail` **trong** ward đó. Không parse chuỗi `location` làm nguồn sự thật. Hub thôn/KĐT (cấp 4) vẫn derive lúc đọc: 0 lô → 404 (chưa persist).
3. Slug xã ổn định sau khi lưu. Slug cấp 4 unique trong phạm vi xã.
4. Related trên chi tiết lô (hai block, dưới gallery):
   1. «Lô đất cùng xã {xã}» → hub `/xa/…` (tối đa 9 thẻ; trừ lô đang xem).
   2. «Đất dự án khu vực Nam Sách» — lô `Address.kind = PROJECT` thuộc **3 khu cấp 4** có nhiều lô Đang hiện nhất (hòa: ngày đăng mới hơn). Tối đa 9 thẻ; trừ lô đang xem và lô đã hiện ở block cùng xã. «Xem tất cả» → catalog huyện. Không đoán thôn thường là dự án.
   Breadcrumb chi tiết lô: Trang chủ → Nhà đất đang bán → **{tên xã}** (link hub `/xa/…`) → H1. Không nhồi `location` đầy đủ vào crumb (thôn/huyện/tỉnh vẫn dưới H1).
5. Path cũ `/mua-ban-nha-dat`, `/san-pham` **không** redirect (site mới — chỉ dùng path mới).

### 17.3 Checklist triển khai (làm lần lượt)

#### Slice A — Đổi path gốc + 301

- [x] `PUBLIC_LISTING_PATH` = `/mua-ban-nha-dat-huyen-nam-sach`
- [x] Đổi thư mục route Next `app/(public)/mua-ban-nha-dat/` → path mới
- [x] `next.config`: **không** redirect `/san-pham`, `/mua-ban-nha-dat` (path cũ → 404)
- [x] Nest `PublicWebRevalidateService` paths mới
- [x] Sitemap, Meta Pixel, dashboard preview path, docs PUBLIC-SEO / PUBLIC-WEB
- [x] Smoke: list + chi tiết + 301 cũ → mới (live anhungland.com 2026-08-28)

#### Slice B — Docs UI hub + contract shared

- [x] §17.4 đặc tả màn hub (PC → mobile) đủ Ready for mock
- [x] Zod: hub kind `commune` | `place`; list hub sitemap; catalog thêm `communeSlug` / `placeSlug`
- [x] Helper slugify chung (`toPublicSlug` / `toListingPublicSlug` / `toPublicPostSlug` trong `@crmanhung/shared`)

#### Slice C — Hub xã (UI mock → API → nối)

- [x] Route `.../xa/[commune]/page.tsx` + metadata + JSON-LD `ItemList`
- [x] Hub xã persist `PublicCommuneHub` (slug theo `wardId`); mock/SSR fallback catalog khi API tắt; slug sai → 404 noindex; **0 lô đang bán → 200 + empty**
- [x] Guest API: list hubs xã + detail hub theo `wardId` + `address.detail`
- [x] Catalog guest trả `communeSlug` / `placeSlug` từ sổ địa chỉ (không parse location)
- [x] Web hub pages gọi `/public/listing-hubs/*`; fallback parse location khi API chưa sẵn (build/mock)
- [x] Sitemap hub xã; (revalidate hub path khi API sẵn)
- [x] Link related «cùng xã» → hub xã

#### Slice D — Hub cấp 4 trong xã

- [x] Route `.../xa/[commune]/[place]/page.tsx`
- [x] Gom hub theo `detail` trong xã (catalog location → placeSlug); sitemap hub cấp 4 có lô
- [x] Link related «tại KĐT/thôn» → hub cấp 4
- [x] Breadcrumb: Trang chủ → Nhà đất → Xã → Cấp 4
- [x] Trang hub xã: danh sách link thôn/KĐT trong xã (§17.4.1)
- [x] Guest API: hub cấp 4 theo `wardId` + `address.detail` (cùng endpoints `/public/listing-hubs`)

#### Slice E — QA staging SEO

- [x] Script `pnpm qa:public-hubs` — path, robots, CRM noindex, redirects, sitemap, routes
- [x] Hub canonical dưới `/mua-ban-nha-dat-huyen-nam-sach/xa/…` — không trùng `/du-an`
- [x] Hub xã 0 lô → 200 empty; slug xã sai → `notFound()` + `unpublishedHubMetadata` noindex. Hub cấp 4 0 lô / slug sai → 404
- [x] Sitemap: mọi hub xã đã persist (kể 0 lô); hub cấp 4 chỉ khi có lô (`listPlaceHubs` count > 0)
- [x] `robots.ts` allow `/`; disallow CRM — không chặn catalog mới
- [x] Smoke live `anhungland.com` sau merge PR #153 (301, hub HTML Nam Trung, sitemap hub URLs, hub 404)

**Chạy local trước deploy:**

```bash
pnpm qa:public-hubs
pnpm --filter @crmanhung/web build
```

**Sau deploy — kiểm tra tay:**

| Kiểm tra | Kỳ vọng |
|----------|---------|
| `/mua-ban-nha-dat`, `/san-pham` | 404 (path cũ đã bỏ) |
| Hub xã có lô | 200, canonical đúng; `robots index` + trong sitemap khi `PUBLIC_SEO_INDEX=1` (production đã bật — `PUBLIC-SEO.md` §11) |
| Hub xã đã persist, 0 lô đang bán | 200, câu empty; **vẫn** sitemap; không 404 |
| Hub xã slug cũ sau đổi tên | 301 → slug mới |
| Hub slug sai (chưa từng lưu) | 404, noindex |
| `/du-an` | Bài CMS — canonical `/{category}/{slug}`, khác hub lô |
| `/dashboard`, `/lo-dat` | noindex; không trong sitemap |

### 17.4 UI hub (Ready for mock)

Path: `{PUBLIC_LISTING_PATH}/xa/[slug-xa]` và `…/xa/[slug-xa]/[slug-place]`.

#### 17.4.1 Giao diện máy tính — hub xã

1. Breadcrumb: Trang chủ → Nhà đất đang bán → {tên xã}
2. H1: `Nhà đất {tên xã}, {huyện}` (thiếu huyện → chỉ tên xã)
3. Một câu mô tả: số lô đang bán trong xã (vd. «N lô đang giới thiệu trên An Hưng Land.»). **0 lô:** «Hiện không có lô đang bán tại {xã} trên An Hưng Land.»
4. (Tuỳ chọn) Danh sách link hub cấp 4 trong xã có ≥1 lô — chữ, không card
5. Grid thẻ lô — **cùng** markup/list `/mua-ban-nha-dat-huyen-nam-sach` (`ph-product-grid`)
6. Empty **có** trên URL xã đã persist (0 lô đang bán → 200, không 404)

#### 17.4.2 Giao diện máy tính — hub cấp 4

1. Breadcrumb: Trang chủ → Nhà đất đang bán → {xã} → {thôn|KĐT|dự án}
2. H1: `Lô đất {tên cấp 4}, {tên xã}`
3. Một câu mô tả + số lô
4. Grid thẻ lô — cùng list catalog
5. 0 lô → 404

#### 17.4.3 Giao diện mobile

1. Breadcrumb / back — cùng 17.4.1–2, wrap dòng
2. H1 + mô tả — cùng copy
3. Grid 1 cột (CSS list hiện có)
4. Thẻ lô — cùng field: ảnh · title · giá · DT · địa chỉ

#### 17.4.4 SEO / hành vi

| Hạng mục | Quy tắc |
|----------|---------|
| robots | Khi `PUBLIC_SEO_INDEX=1`: `index, follow` trang xã đã persist (kể 0 lô) và hub cấp 4 có lô. Local mặc định `noindex, follow` (`PUBLIC-SEO.md` §11) |
| 404 | Slug xã chưa từng lưu / slug cấp 4 0 lô hoặc sai → `notFound` + noindex |
| Canonical | URL hub tuyệt đối (slug đã lưu; slug cũ 301) |
| JSON-LD | `ItemList` URL lô trong hub (có thể rỗng); `BreadcrumbList` |
| Sitemap | Mọi hub xã đã persist; cấp 4 chỉ khi có lô; priority xã ~0.75, cấp 4 ~0.7 |

---

## 18. Share NV + liên hệ trên trang khách (chốt 2026-09-02)

NV A / NV B mỗi người kho lô riêng; **Đăng web** đưa lô lên trang chủ (cùng catalog). Nút **Chia sẻ**: mã cố định `(NV + listing)`, URL **`https://anhungland.com/mua-ban-nha-dat-huyen-nam-sach/{slug}?share=CODE`**. Cookie last-click ghi ở middleware khi URL có `?share=`. Không dùng `PUBLIC_WEB_ORIGIN` (loopback — chỉ ISR). Copy = mô tả public (HTML→plain) + URL canonical. Đổi slug overlay → 301 slug cũ.

| Khách vào | Liên hệ |
|-----------|---------|
| Không cookie / hết 30 ngày / máy khác / ẩn danh; chưa login CRM | Hotline công ty |
| Link share **NV A** | A trên **trang chủ** (header + thẻ sản phẩm) và **chi tiết lô** (header + khối liên hệ / Zalo / gọi) — 30 ngày. Catalog / hub cùng thẻ. Vào thẳng domain **không** cần `?share=` nếu cookie còn hạn |
| Link share **cùng NV A**, lô khác | Giữ A, **không** đếm lại 30 ngày (chỉ cập nhật mã share) |
| Link share **NV B** | Đổi thành B, **đếm lại 30 ngày** từ lần bấm B |
| NV đã login CRM | Số + avatar **chính mình** — thắng cookie |

Cookie `crmanhung_share` (httpOnly, SameSite=Lax, path `/`): payload `CODE~employeeId~expiresAt` (không JSON). Middleware gọi Nest loopback `:5050`, **ghi cookie** khi `?share=` đúng format (kể cả lúc lookup NV chậm). `maxAge` = thời hạn còn lại tới `expiresAt`. Lướt web không `?share=` **không** gia hạn. Google không gửi cookie → HTML bot = hotline công ty. JSON-LD / canonical luôn công ty.

Mã không khớp slug lô đang xem **vẫn hợp lệ** (không 404). **Lượt xem** (JS client, mỗi lần tải hoặc chuyển trang public — trang chủ, catalog, chi tiết lô, bài viết…; **F5 = +1**): khách còn cookie share → cộng cho NV (`attributedViewCount`); khách không cookie / hết hạn / máy khác → cộng **Truy cập trực tiếp** (`directViewCount`). NV đã login CRM không đếm. Googlebot không chạy JS → không đếm. Chi tiết lô `force-dynamic`.

Thứ tự: NV đã login (có SĐT) → cookie/`?share=` → hotline công ty. Avatar = CDN khi có; không ảnh → chữ cái.

---

## 19. Tìm bài đăng trên trang chủ (chốt 2026-09-02)

Khách tìm **lô đã Đăng web** (không phải bài CMS). Không login.

### 19.1 Giao diện máy tính — `/`

1. Vị trí: **dưới hero**, **trên** «Sản phẩm dành cho bạn». Không nhét ô tìm vào hero / header.
2. Nhãn: `Tìm bài đăng` (không thêm H1/H2 — H1 vẫn hero; H2 vẫn «Sản phẩm dành cho bạn»).
3. Ô một dòng — placeholder `Nhập xã, thôn, dự án, diện tích, tiêu đề…`. Icon Lucide `Search` trong ô.
4. Nút **Tìm kiếm** — đỏ brand. Enter = cùng nút.
5. Gửi `GET` `/mua-ban-nha-dat-huyen-nam-sach?q=…`. Trống → catalog không `q`.
6. Lưới «Sản phẩm dành cho bạn» **không** lọc theo ô tìm (vẫn toàn bộ lô đã đăng).

### 19.2 Giao diện máy tính — catalog `/mua-ban-nha-dat-huyen-nam-sach`

1. Cùng ô tìm, điền sẵn `q`.
2. Lọc client/server trên field public: tiêu đề, địa chỉ, xã, thôn/KĐT, DT, giá làm mờ, hangtag Nhà/Đất, excerpt. **Không** bodyHtml, PII, tên NV.
3. Có `q`: câu `N bài đăng phù hợp với «…».` · 0 kết quả: `Không tìm thấy bài đăng phù hợp.`
4. Không `q`: copy cũ «Xem và chia sẻ…» + mọi lô.

### 19.3 Giao diện mobile

1. Cùng 19.1–19.2. Ô + nút xếp dọc; nút full ngang.
2. Placeholder / hành vi Submit giống máy tính.

### 19.4 SEO

| Hạng mục | Quy tắc |
|----------|---------|
| Canonical catalog | Luôn path sạch — **không** `?q=` |
| Sitemap / OG | Không URL có `q` |
| JSON-LD `WebSite` | `SearchAction` → `{catalog}?q={search_term_string}` |
| JSON-LD `ItemList` catalog | Trang không `q` = mọi lô; có `q` = đúng lô đang hiện |

Contract: `matchPublicListingSearch` + `listingCatalogSearchPath` (`packages/shared` `public-content.ts`). API `GET /public/listings` không thêm query — lọc trên list đã published.

---

## 20. Thống kê share `/dashboard/thong-ke` (chốt 2026-09-02)

**ADMIN.** STAFF không vào (redirect `/dashboard/lo-dat`). List NV + số lô đã bấm **Chia sẻ** + **lượt xem** trang khách (cookie NV **và** không cookie). Không đếm Gọi/Zalo.

Zod: `shareEmployeeStatsResponseSchema` — `GET /admin/lot-shares/employee-stats` (`items` NV + `directViewCount`).

Thứ tự: **20.1 máy tính** → **20.2 mobile**. Không H1 trùng chữ menu trái.

### 20.1 Giao diện máy tính

```
┌ Thống kê                                                    ┐
│ Dòng phụ: share NV + lượt xem (cookie / truy cập trực tiếp) │
├ Bảng §4.5 — không lọc cột, không Thao tác                    │
└ Footer đếm dòng (NV + Truy cập trực tiếp)                    │
```

#### 20.1.1 Thanh đầu

1. **H1** `Thống kê`
2. Dòng phụ: `Số lô đã tạo link share và lượt khách xem trang. Cookie NV cộng cho nhân viên; không cookie = Truy cập trực tiếp. F5 cũng cộng 1.`

#### 20.1.2 Bảng

§4.5. Không icon lọc. Không bấm dòng.

| Cột | Ô NV | Ô **Truy cập trực tiếp** |
|-----|------|--------------------------|
| `#` | STT sau khi sắp xếp | Cùng STT trong list đã sort |
| Nhân viên | Avatar 32px + **tên**; dòng phụ username. Hangtag **Đã khóa** `red` nếu `isActive = false` | Icon Lucide `Globe` + **Truy cập trực tiếp**; dòng phụ `Không gắn nhân viên`. Không hangtag |
| Đã share | Số lô đã tạo mã (`sharedListingCount`); `0` khi chưa | Luôn `0` |
| Lượt xem | Khách còn cookie: mỗi lần tải/đổi trang public (`attributedViewCount`); F5 = +1; `0` khi chưa | Khách không cookie (`directViewCount`); cùng quy tắc F5; `0` khi chưa |

Sắp xếp (NV **và** dòng Truy cập trực tiếp): `attributedViewCount` / `directViewCount` giảm dần, rồi `sharedListingCount`, rồi tên `vi` (dòng trực tiếp xếp sau NV khi bằng điểm). Mọi User `STAFF` + `ADMIN` (kể cả 0 share / 0 xem). **Luôn** có đúng một dòng Truy cập trực tiếp — không tạo User giả.

Trống: không — luôn có dòng trực tiếp (kể cả 0 xem).

Footer: `Hiển thị N / Tổng M dòng` (NV + 1).

### 20.2 Giao diện mobile

Cùng dữ liệu. Thẻ xếp dọc: avatar / Globe · tên · Share / Xem. Footer cùng 20.1.2. Menu dashboard cuộn ngang (mục **Thống kê**).



