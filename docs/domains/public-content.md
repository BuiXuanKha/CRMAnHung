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
| Đăng web + đang Mở bán | Hiện `/mua-ban-nha-dat-huyen-nam-sach/[slug]` |
| Đang Đăng web rồi Tạm dừng / Đã cọc / Đã bán | Khách: list/chi tiết chỉ hiện khi **Đăng web ∩ Mở bán**. **Không** tự tắt công tắc Đăng web — admin Gỡ tường minh |

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

Được hiện (khi đã Đăng web): tiêu đề, ảnh lô/dự án, DT · MT · hướng, hangtag Nhà/Đất, địa chỉ (tỉnh/huyện/xã/thôn-dự án), giá **nếu** admin chọn công bố (**đã làm mờ**, không đúng số CRM — vd. 3,2 tỷ → `3 tỷ xxx`), mô tả public, nút gọi hotline công ty.

---

## 4. Use cases

1. **Khách vào /** — hero brand + lô đã đăng + teaser tin/bài. Không login.
2. **Khách xem lô** — `/mua-ban-nha-dat-huyen-nam-sach` và `/…/[slug]`; share OG.
3. **Khách đọc bài** — list + chi tiết theo chuyên mục.
4. **Admin đăng lô** — list `/dashboard/lo-dat`: một lần bấm = preview; double-click = modal **Soạn bài đăng** (prefill copy đã lọc) → Lưu nháp / Đăng web.
5. **Admin gỡ lô** — tắt Đăng web; URL cũ → không tìm thấy (hoặc 404).
6. **Admin soạn bài** — nháp → Xuất bản / Gỡ về nháp.
7. **Lô đổi trạng thái CRM** — không tự tắt Đăng web; admin Gỡ trên dashboard nếu cần.

---

## 5. Quan hệ dữ liệu

```
Lodat  1──0..1  PublicListing     (slug, isPublished, pricePublic, publicTitle, excerpt, metaDescription?, cover)
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
| **Lô đất** | `/dashboard/lo-dat` | List lô đăng web. §13 |
| **Bài viết** | `/dashboard/bai-viet` | List bài (dự án, kiến thức, liên hệ, chính sách…). §14 |
| Trang chủ khách | `/` | Lô đã Đăng web (`listPublishedPublicLots`) |

**Tạm thời không** thêm hành vi/quyền admin trên `/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do`.

Menu **trong** Dashboard (không gắn lên 4 trang CRM): Tổng quan · Lô đất · Bài viết.

Header CRM: bốn mục NV. ADMIN thêm **Dashboard**. STAFF vào URL `/dashboard` → `/khach-hang`.

**Sau login thành công:** ADMIN vào **`/dashboard` trước** (trang đầu). STAFF vào `/khach-hang`. Logo CRM (góc trái) của admin cũng về `/dashboard`.

---

## 7. Contract / API dự kiến

Prefix `/api/v1`. Dashboard mock: `packages/shared/src/public-content.ts`.

| Method | Path | Auth | Việc |
|--------|------|------|------|
| GET | `/admin/public-web/lots` | JWT ADMIN | Overlay bài đăng (nháp + đã đăng) |
| POST | `/admin/public-web/media` | JWT ADMIN | Upload ảnh public (bìa / TipTap) → CDN R2 |
| PATCH | `/admin/public-web/lots/:id/published` | JWT ADMIN | Đăng / gỡ lô (`isPublished`) — **Postgres** |
| PATCH | `/admin/public-web/lots/:id/draft` | JWT ADMIN | Lưu copy public — **Postgres** |
| PATCH | `/admin/public-web/posts/:id/status` | JWT ADMIN | Xuất bản / về nháp — **Postgres** |
| GET | `/admin/public-web/posts` | JWT ADMIN | List bài (nháp + đã xuất bản) — **Postgres** |
| POST | `/admin/public-web/posts` | JWT ADMIN | Soạn bài (tiêu đề + chuyên mục + body) — **Postgres** |
| GET | `/public/listings` | Không | Lô đã đăng ∩ Mở bán → `publicCatalogListingSchema` |
| GET | `/public/listings/:slug` | Không | Chi tiết `/mua-ban-nha-dat-huyen-nam-sach/[slug]` — 404 nếu nháp / đã gỡ / không Mở bán |
| GET | `/public/posts` | Không | Bài `PUBLISHED` (`?category=` tuỳ chọn) → `publicGuestPostListResponseSchema` |
| GET | `/public/posts/:category/:slug` | Không | Chi tiết bài — 404 nếu nháp / sai chuyên mục |

---

## 8. Mock data

Khi mock UI admin (sau Ready for mock):

- 3–5 lô CRM: chưa đăng / đã đăng / Mở bán vs Tạm dừng
- 1 lô kho hai NV — chỉ một listing public
- Bài: nháp + đã đăng, đủ 4 chuyên mục
- Khách `/` không thấy nháp — chỉ lô `isPublished` đang Mở bán; trống thì empty state, không hàng marketing giả

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
2. Lô lên web = công tắc tường minh do **ADMIN** (duyệt copy/ảnh rồi Đăng / Gỡ) — không auto theo Mở bán hay giao dịch.
3. Tắt Mở bán / tạo GD **không** tự tắt Đăng web. Gỡ web = admin tắt Đăng web tường minh. (Khách chỉ thấy lô Đăng web ∩ đang Mở bán.)
4. Giá từng lô: hiện số **đã làm mờ** (không đúng số CRM) hoặc **Liên hệ**.
5. Cùng số lô kho → một listing public (chưa mock conflict UI).
6. Bài viết = một list; chuyên mục: dự án, kiến thức, liên hệ, chính sách bảo mật, tin tức, kinh nghiệm.
7. Liên hệ khách: hotline + Zalo công ty; chưa form SĐT.
8. Soạn bài đăng: double-click hàng/thẻ → modal copy public. Giá CRM **làm mờ**. Không copy hoa hồng, ghi chú nội bộ / chủ nhà, tên/SĐT khách.

---

## 12. Dashboard `/dashboard` — ADMIN

Thứ tự: **12.1 máy tính** → **12.2 mobile**. Không trộn PC/mobile trong một mục.

Không H1 lặp tên menu trên thanh tìm. H1 trên Tổng quan và Bài viết; **`/dashboard/lo-dat` không H1** (tên đã có trên menu trái).

### 12.0 Menu trong Dashboard (mọi màn `/dashboard/*`)

**Máy tính:** cột trái, 3 mục. Active chữ xanh `#2563eb` **700** + nền `#eff6ff`.

1. **Tổng quan** → `/dashboard`
2. **Lô đất** → `/dashboard/lo-dat`
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

Nguồn list = **cùng lô CRM đang Mở bán** trên `/lo-dat` (ADMIN thấy mọi NV). Overlay đăng web (slug, copy, `isPublished`) vẫn mock. Một lần bấm hàng → preview phải. Double-click → modal **Soạn bài đăng**. **Đăng web** từ preview (lô chờ đăng) hoặc từ modal (lưu copy rồi `CrmConfirm`).

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
3. **Giữa — bảng** mọi lô NV đang Mở bán. Lọc cột §4.5.5. Không cột Thao tác / công tắc rao bán. Không tên khách. Cột **AI GPT** (nút GPT) → modal textarea JSON request GPT (§13.3a; API sau).
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

Icon Lucide `Sparkles`. `CrmDialog` rộng. Body = textarea **Mô tả thêm** (bắt buộc — NV nhập điểm nổi bật thực địa) + textarea JSON request (tự cập nhật, sửa được) + **Gửi** (disabled khi chưa nhập mô tả) → `POST /admin/public-web/lots/gpt-content` (ADMIN, Nest gọi OpenAI `gpt-5.6-sol`) + textarea **Phản hồi GPT** (readonly). `OPENAI_API_KEY` + `OPENAI_MODEL` trên server — không commit.

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
4. Nút **Đăng web** khi chờ đăng → `CrmConfirm`. **Không** nút Gỡ web trên màn này.
5. Nếu đang hiện: link `Xem trên anhungland.com` tab mới `/mua-ban-nha-dat-huyen-nam-sach/[slug]`

### 13.2 Mobile

Cùng 13.1. Thẻ xếp dọc (ảnh + tiêu đề + hangtag Web + địa chỉ + phân loại + DT/MT/hướng + NV + giá). Preview **dưới** list khi đã chọn dòng — không rail phải.

Thanh tìm: ô tìm + **Bộ lọc** + **Tìm**. Panel: Phân loại · Giá · Web · NV. **Xoá lọc** xóa mọi lọc (cả cột desktop). Desktop không hiện Bộ lọc / Tìm.

Một lần chạm thẻ → chọn + preview. Double-tap / double-click → cùng modal 13.3.

Nhớ tìm + lọc + dòng chọn: `sessionStorage` `crmanhung:public-lot-list-state`.

### 13.3 Modal Soạn bài đăng

Cùng máy tính / mobile. Icon Lucide `PenLine`. Khung `CrmDialog` rộng (`crm-dialog--wide`, ~840px). Không `window.confirm`.

1. Prefill copy **công khai** từ lô đang Mở bán: tiêu đề, địa chỉ, giá đã làm mờ, mô tả (DT · MT · hướng · loại + CTA hotline công ty).
2. **Không** copy: hoa hồng, ghi chú giá / broker, ghi chú thương lượng chủ nhà, tên/SĐT khách, tên NV.
3. Ô chỉ đọc: giá gốc CRM không hiện đúng cho khách; admin phải duyệt giá công khai.
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
├ Ô tìm                                      [ Soạn bài ]      │
├ Bảng §4.5: Chuyên mục · Tiêu đề · Trạng thái                 │
└ Footer đếm                                                   ┘
```

1. Ô tìm — `CrmSearchField`, placeholder `Tìm tiêu đề, chuyên mục...`. Gõ là lọc. Hangtag Clear sau caret.
2. **Soạn bài** — dialog chuyên nghiệp (§14.3): tiêu đề + chuyên mục; Lưu nháp / Xuất bản. Nội dung dài = slice sau.
3. Hangtag chuyên mục `blue`: Dự án · Kiến thức · Liên hệ · Chính sách bảo mật · Tin tức · Kinh nghiệm
4. Hangtag trạng thái: Đã xuất bản `green` · Nháp `gray`
5. Bấm hàng → `CrmConfirm` Xuất bản / Về nháp (12.1.4). Toast khi xong.
6. Lọc cột §4.5.5 (icon `ListFilter` sát chữ tên cột). Không cột Thao tác.

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
| Ảnh bìa (thumbnail) | **Xuất bản** | ~16:9; upload R2 public CDN. Nháp được trống |
| Nội dung | **Xuất bản** | Rich text (TipTap): đậm/nghiêng/H2/H3/list + **ảnh đan xen** |
| Đường dẫn dự kiến | Chỉ đọc | `/{category}/{slug}` từ tiêu đề |

**Hành vi**

1. Dòng phụ: bài hiện trên web khách theo chuyên mục; nháp chỉ admin; Xuất bản = khách đọc được.
2. Ảnh bìa: **Chọn ảnh** · **Gỡ ảnh** + preview.
3. Toolbar editor: Đậm · Nghiêng · H2 · H3 · Danh sách · Chèn ảnh (upload → chèn vào vị trí con trỏ).
4. Ảnh bìa + ảnh trong bài = bucket **public** R2. Mock: URL tạm / stub.
5. **Huỷ** · **Lưu nháp** (được thiếu ảnh/nội dung) · **Xuất bản** (thiếu ảnh bìa hoặc nội dung trống → lỗi form).
6. Lỗi validate / API: `crm-form-error`.

Slice API Postgres + upload R2 thật = sau khi mock UI ổn.

---

## 15. SEO lô trên trang khách

Chi tiết kỹ thuật: [`PUBLIC-SEO.md`](../PUBLIC-SEO.md) §7. Overlay soạn bài dashboard **không** đổi layout — chỉ có thể thêm `metaDescription` (tuỳ chọn).

1. URL khách: `/mua-ban-nha-dat-huyen-nam-sach/[slug]` — chỉ lô `isPublished`. `/mua-ban-nha-dat` + `/san-pham` 301 sang path mới.
2. Title / H1 = tiêu đề public. Meta = `metaDescription` hoặc excerpt.
3. Ảnh OG = ảnh bìa; thiếu → `/og-default.png`.
4. JSON-LD `RealEstateListing`: giá = `priceLabel` công bố (hoặc bỏ số nếu Liên hệ / `xxx`).
5. Sitemap chỉ lô đang hiện. Gỡ web → 404, không còn trong sitemap.
6. Cấm trên HTML + JSON-LD + meta: giá map CRM, hoa hồng, tên/SĐT khách, ghi chú nội bộ.

---

## 16. Roadmap ISR + SEO (triển khai dần)

**Mục tiêu:** Admin Lưu / Đăng / Xuất bản → Postgres → Next.js **ISR** → Googlebot + khách nhận HTML đầy đủ. **Revalidate on-demand** khi CRM lưu (không revalidate ngắn theo thời gian). Chi tiết SEO: [`PUBLIC-SEO.md`](../PUBLIC-SEO.md) §8.

**Thứ tự:** Phase 0 → 1 → (2→3→4 Lô) → (5→6→7 Bài) → 8.

### 16.0 Phase 0 — Nền

- [x] CRM `(crm)/layout` `robots: noindex` + `robots.ts` chặn `/dashboard`, CRM routes
- [x] Docs roadmap (§16 này) + PUBLIC-SEO §8 ISR
- [x] Secrets staging: `REVALIDATE_SECRET` (Next + Nest cùng giá trị), `PUBLIC_WEB_ORIGIN=http://127.0.0.1:5001` trên Nest, `NEXT_PUBLIC_USE_MOCK=false` trên prod — set VPS 2026-08-27; loopback revalidate 200
- [x] R2 public CDN ổn trên VPS (ảnh lô CDN); `pnpm doctor` local khi cần

### 16.1 Phase 1 — Media upload (chung lô + bài)

- [x] Contract: `uploadPublicMediaResponseSchema` `{ url, objectKey? }`
- [x] `POST /admin/public-web/media` — JWT ADMIN, multipart, JPG/PNG/WEBP/GIF ≤ 5 MB → R2 public CDN
- [x] Web: `uploadPublicPostImage` gọi API khi không mock; mock giữ object URL

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
| Layout chi tiết lô | Gallery · breadcrumb · H1 · địa chỉ · **một** strip Giá/DT/Hướng + Zalo/hotline hiện đủ số; không lặp Loại/Hướng ở lưới phụ |
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

- [x] ~~Lô CRM không còn Mở bán → auto gỡ Đăng web~~ — **không làm** (chủ bác): chỉ admin Gỡ tường minh
- [x] Một listing public / số lô kho; không đổi slug sau publish (301 nếu bắt buộc — sau)
- [x] Log revalidate fail không rollback DB

**Triển khai (2026-08-27, chỉnh lại sau feedback):**

| Hạng mục | Cách làm |
|----------|----------|
| Gỡ web | Chỉ admin **Gỡ** / tắt Đăng web trên dashboard. **Không** auto khi Tạm dừng hay tạo/sửa GD |
| Khách thấy lô | `isPublished` ∩ map `DANG_BAN` (rule guest API sẵn có — không đụng công tắc Đăng web) |
| Một listing / ProjectLot | Khi admin **Đăng web**, `unpublishSiblingProjectLotListings` gỡ listing published khác cùng `projectLotId` |
| Slug ổn định | Slug = `toListingPublicSlug(title, location)` lúc **tạo** listing; `PATCH draft` / Đăng lại **không** đổi slug |
| Đổi URL lô cũ | Migration + `scripts/regenerate-public-lot-slugs.ts` (chạy trong `remote_deploy.sh`): ghi `PublicLotSlugRedirect`; guest `/mua-ban-nha-dat/{slug-cũ}` → **301** sang slug mới (`GET /public/slug-redirects/:fromSlug`) |
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

1. Hub chỉ **index** khi có ≥ 1 lô Đang hiện (`isPublished` ∩ Mở bán). Hub 0 lô → **404 + noindex**, bỏ khỏi sitemap.
2. Gom lô: cấp 3 = `wardId`; cấp 4 = `address.detail` **trong** ward đó. Không parse chuỗi `location` làm nguồn sự thật.
3. Slug ổn định; trùng tên xã khác huyện → suffix huyện (vd. `nam-trung-nam-sach`). Slug cấp 4 unique trong phạm vi xã.
4. Related trên chi tiết lô: «cùng xã» → hub xã; «tại KĐT/thôn» → hub `xa/.../slug-c4`.
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
- [x] Helper slugify chung (`toPublicSlug` / `toListingPublicSlug` trong `@crmanhung/shared`)

#### Slice C — Hub xã (UI mock → API → nối)

- [x] Route `.../xa/[commune]/page.tsx` + metadata + JSON-LD `ItemList`
- [x] Hub derive từ catalog (location → communeSlug) — mock/SSR; 0 lô / slug sai → 404 noindex
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
- [x] Hub 0 lô / slug sai → `notFound()` + `unpublishedHubMetadata` noindex
- [x] Sitemap chỉ hub có lô (`listCommuneHubs` / `listPlaceHubs` filter count > 0)
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
| Hub xã có lô | 200, `robots index`, canonical đúng, trong sitemap |
| Hub slug sai | 404, noindex |
| `/du-an` | Bài CMS — canonical `/{category}/{slug}`, khác hub lô |
| `/dashboard`, `/lo-dat` | noindex; không trong sitemap |

### 17.4 UI hub (Ready for mock)

Path: `{PUBLIC_LISTING_PATH}/xa/[slug-xa]` và `…/xa/[slug-xa]/[slug-place]`.

#### 17.4.1 Giao diện máy tính — hub xã

1. Breadcrumb: Trang chủ → Nhà đất đang bán → {tên xã}
2. H1: `Nhà đất {tên xã}, {huyện}` (thiếu huyện → chỉ tên xã)
3. Một câu mô tả: số lô đang bán trong xã (vd. «N lô đang giới thiệu trên An Hưng Land.»)
4. (Tuỳ chọn) Danh sách link hub cấp 4 trong xã có ≥1 lô — chữ, không card
5. Grid thẻ lô — **cùng** markup/list `/mua-ban-nha-dat-huyen-nam-sach` (`ph-product-grid`)
6. Empty không xảy ra trên URL public (0 lô → 404)

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
| robots | `index, follow` khi có ≥1 lô |
| 404 | Slug sai / 0 lô → `notFound` + noindex |
| Canonical | URL hub tuyệt đối |
| JSON-LD | `ItemList` URL lô trong hub; `BreadcrumbList` |
| Sitemap | Chỉ hub có lô; priority xã ~0.75, cấp 4 ~0.7 |


