# Web công khai — chuẩn SEO

Áp dụng cho mọi trang **public** trên `anhungland.com` (route `(public)/`, không cần login).  
CRM sau login **không** ưu tiên SEO.

Tham chiếu: ADR [0006-nextjs-web](./adr/0006-nextjs-web.md) · skill `web-public-seo`.

---

## Mục tiêu

1. Công cụ tìm kiếm (Google, Bing…) **index** đúng trang khách.
2. Kết quả tìm kiếm / chia sẻ MXH hiện **title + mô tả + ảnh** ổn.
3. Trang **nhanh**, nội dung chính có trong HTML lần tải đầu (SSR/SSG/RSC — không SPA trống).
4. URL **ổn định**, không trùng nội dung (canonical).

---

## Bắt buộc khi làm / sửa trang public

### 1. Metadata (Next.js `metadata` hoặc `generateMetadata`)

Mỗi route public phải có:

| Field | Quy ước |
|-------|---------|
| `title` | Rõ, tiếng Việt; unique theo trang. Brand: `… \| An Hưng Land` hoặc tương đương |
| `description` | 1–2 câu (~120–160 ký tự), mô tả nội dung thật |
| `alternates.canonical` | URL tuyệt đối `https://anhungland.com/...` |
| Open Graph | `openGraph.title`, `.description`, `.url`, `.siteName`, `.locale` (`vi_VN`), `.type` |
| Twitter card | `twitter.card` = `summary_large_image` (khi có ảnh) + title/description |
| `robots` | Index trang công khai hữu ích; `noindex` cho trang lỗi / tạm / trùng |

**Không** để title/description mặc định giống nhau mọi trang.

### 2. HTML semantic & nội dung

- Một `<h1>` duy nhất / trang, khớp ý title.
- Heading `h2`/`h3` theo cấu trúc thật — không dùng heading chỉ để “cho to chữ”.
- Ảnh: `alt` mô tả; kích thước hợp lý; ưu tiên `next/image`.
- Link nội bộ dùng URL sạch (`/du-an/...`), không query tracking làm canonical.
- Nội dung chính **không** chỉ render sau `useEffect` phía client (bot khó đọc).

### 3. Kỹ thuật crawl

| Hạng mục | Quy ước |
|----------|---------|
| `app/robots.ts` | Cho phép crawl public; chặn `/login`, khu `(crm)` (`/khach-hang`, `/lo-dat`, …) |
| `app/sitemap.ts` | URL public ổn định + **lô đã đăng** `/mua-ban-nha-dat/[slug]` (không nháp) |
| HTTPS | Chỉ `https://anhungland.com` (www → apex hoặc ngược lại — một hướng, khớp canonical) |
| `lang` | `<html lang="vi">` (đã có ở root layout) |

### 4. Hiệu năng (ảnh hưởng SEO gián tiếp)

- LCP: ảnh hero / font không chặn quá mức; preload có chủ đích.
- Không nhồi script bên thứ ba trên above-the-fold nếu không cần.
- Tránh layout shift lớn (CLS) do ảnh/font không kích thước.

### 5. Chia sẻ & mạng xã hội

- Có ảnh OG mặc định brand (ví dụ `/og-default.png`) và ảnh riêng cho trang quan trọng.
- Kiểm tra bằng Facebook Sharing Debugger / Twitter Card Validator khi gần ship trang mới.

### 6. Meta Pixel (Facebook Ads)

Meta Events Manager: dán **mã cơ sở vào `<head>`** (trước `</head>`), trên **mọi trang**.  
Next.js không có file HTML tĩnh — tương đương: snippet trong `app/layout.tsx` (`<head>` của layout gốc) để mọi URL `anhungland.com` đều có pixel.

| Hạng mục | Quy ước |
|----------|---------|
| Vị trí | `<head>` layout gốc `app/layout.tsx` — cùng snippet Meta (init + PageView) |
| Pixel ID | `391165622297911` (public, hiện trong View Source) |
| noscript | Ảnh 1×1 trong `<head>` (fallback tắt JS) |
| SPA | `MetaPixelRouteTracker` — PageView khi đổi route Next `Link` (bỏ lần tải đầu) |
| Sản phẩm | URL `/mua-ban-nha-dat` → custom **ViewProductList**; `/mua-ban-nha-dat/[slug]` → chuẩn **ViewContent** (`content_ids` = slug) |
| Dev | Tắt khi `next dev` (`NODE_ENV !== production`) |

Trong Events Manager: Test events / số sự kiện `ViewContent` = khách xem chi tiết 1 lô; `ViewProductList` = khách vào danh sách. Có thể tạo conversion URL chứa `/mua-ban-nha-dat` trên `PageView` nếu muốn gom cả hai.

---

## Không làm trên web công khai

- Nhét toàn bộ CRM / dữ liệu khách lên route public.
- `noindex` nhầm trang marketing cần xếp hạng.
- Duplicate: cùng nội dung ở nhiều URL mà không canonical.
- Client-only shell trống rồi mới hydrate nội dung chính.

---

## Checklist PR (trang public)

- [ ] `title` + `description` riêng, tiếng Việt
- [ ] `canonical` đúng
- [ ] OG (+ Twitter) đủ field cơ bản
- [ ] `h1` một cái; ảnh có `alt`
- [ ] Nội dung chính có trong HTML SSR/RSC
- [ ] Cập nhật `sitemap` nếu URL mới
- [ ] `robots` không chặn nhầm trang cần index
- [ ] Kiểm tra nhanh trên mobile viewport
- [ ] Lô: title / excerpt / canonical / OG bìa / JSON-LD trung thực theo §7
- [ ] Sitemap chỉ lô đã đăng; lô gỡ → 404 `noindex`

---

## Việc làm nền (một lần / khi thiếu)

1. `app/robots.ts` + `app/sitemap.ts` nếu chưa có.
2. Ảnh OG mặc + metadata gốc trong layout public (không ghi đè CRM).
3. Tách metadata CRM (có thể `noindex` toàn `(crm)` layout).

CRM layout: khuyến nghị `robots: { index: false, follow: false }` để tránh index trang nội bộ.

---

## 7. Công thức SEO lô đã đăng (`/mua-ban-nha-dat/[slug]`)

Áp dụng khi admin **Đăng web**. Khách và Google chỉ thấy field public (title, slug, excerpt, cover, `priceLabel`, vị trí). Không index lô nháp / đã gỡ.

Contract: `publicGuestListingSchema` + `listingSearchDescription` trong `packages/shared`. Field `metaDescription` **tuỳ chọn** — overlay soạn bài có thể điền sau; trống thì dùng excerpt.

| Hạng mục | Công thức | Không làm |
|----------|-----------|-----------|
| **URL** | `https://anhungland.com/mua-ban-nha-dat/{slug}` — slug ổn định, không dấu, unique. `/san-pham/...` 301 | Query tracking làm canonical; đổi slug khi chỉ sửa copy |
| **Title** | `{title} tại {location}` + `\| An Hưng Land` nếu địa chỉ chưa nằm trong tên. Khớp H1. Không đổi slug | Nhồi «đất nền Đồng Nai giá rẻ…»; title chỉ mã lô không có xã/huyện |
| **Meta description** | `metaDescription` nếu có, không thì **excerpt** public, cắt ~160 ký tự | Copy giống nhau mọi lô; mô tả CRM / hoa hồng |
| **Canonical** | Đúng URL tuyệt đối ở trên | Hai URL một lô |
| **H1** | Cùng công thức title (tên + địa chỉ) — **một** H1 | H1 khác title hoặc nhiều H1 |
| **Copy** | Excerpt + mô tả **riêng** từng lô (SSR) | Lặp đoạn khuôn + keyword |
| **OG / Twitter** | title + description như trên; `og:image` = ảnh bìa; thiếu bìa → `/og-default.png`; `summary_large_image` | Ảnh PII / ảnh nội bộ CRM |
| **JSON-LD** | `RealEstateListing` + `BreadcrumbList`. `Offer.price` **chỉ** khi `priceLabel` parse được (vd. `2,85 tỷ`). `Liên hệ` / `3 tỷ xxx` → không bịa số | AggregateRating giả; giá map CRM |
| **Link nội bộ** | Breadcrumb Trang chủ → Nhà đất đang bán → lô; block sản phẩm khác; list `/mua-ban-nha-dat` | Orphan URL |
| **Sitemap** | Chỉ lô `isPublished`. Gỡ web → bỏ khỏi sitemap, URL cũ 404 `noindex` | Nháp, Tạm dừng, Đã cọc / Đã bán |
| **robots** | Cho phép `/mua-ban-nha-dat`; chặn `/login` + CRM | `Disallow: /mua-ban-nha-dat` |

**Giá trên SERP:** cùng `priceLabel` khách thấy. Chính sách làm mờ (3,2 tỷ → `3 tỷ xxx`) thì meta/OG/JSON-LD cũng mờ — không lộ số CRM.

**Danh sách `/mua-ban-nha-dat`:** title/H1 `Nhà đất đang bán`; canonical `/mua-ban-nha-dat`; OG + `ItemList` các URL đã đăng.

