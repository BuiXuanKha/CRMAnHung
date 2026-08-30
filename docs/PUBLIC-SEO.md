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
| `robots` | **Hiện tại:** `noindex` toàn bộ HTML công khai cho đến khi bật `PUBLIC_SEO_INDEX=1` (§11). Sau khi bật: index trang hữu ích; `noindex` trang lỗi / tạm / trùng |

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
| `app/robots.ts` | Cho phép crawl public (để bot đọc `noindex`); chặn `/login`, khu `(crm)` (`/khach-hang`, `/lo-dat`, …). **Không** `Sitemap:` khi cờ index tắt |
| `app/sitemap.ts` | Khi cờ tắt: rỗng. Khi bật: URL public ổn định + **lô đã đăng** `/mua-ban-nha-dat-huyen-nam-sach/[slug]` (+ hub `/xa/…` khi có) |
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
| Sản phẩm | URL `/mua-ban-nha-dat-huyen-nam-sach` → custom **ViewProductList**; `/…/[slug]` → chuẩn **ViewContent** (`content_ids` = slug) |
| Dev | Tắt khi `next dev` (`NODE_ENV !== production`) |

Trong Events Manager: Test events / số sự kiện `ViewContent` = khách xem chi tiết 1 lô; `ViewProductList` = khách vào danh sách. Có thể tạo conversion URL chứa `/mua-ban-nha-dat-huyen-nam-sach` trên `PageView` nếu muốn gom cả hai.

---

## Không làm trên web công khai

- Nhét toàn bộ CRM / dữ liệu khách lên route public.
- `noindex` nhầm trang marketing cần xếp hạng (ngoại trừ giai đoạn tạm đóng index — §11).
- Duplicate: cùng nội dung ở nhiều URL mà không canonical.
- Client-only shell trống rồi mới hydrate nội dung chính.

---

## Checklist PR (trang public)

- [x] `title` + `description` riêng, tiếng Việt
- [x] `canonical` đúng
- [x] OG (+ Twitter) đủ field cơ bản
- [x] `h1` một cái; ảnh có `alt`
- [x] Nội dung chính có trong HTML SSR/RSC
- [x] Cập nhật `sitemap` nếu URL mới
- [x] `robots` không chặn nhầm trang cần index
- [ ] Kiểm tra nhanh trên mobile viewport
- [x] Lô: title / excerpt / canonical / OG bìa / JSON-LD trung thực theo §7
- [x] Sitemap chỉ lô đã đăng; lô gỡ → 404 `noindex`
- [x] Ảnh lô/bài: `alt` có địa chỉ; sitemap `images`; JSON-LD `ImageObject` — §10
- [x] Hub lô: `pnpm qa:public-hubs` (path, robots, sitemap, canonical ≠ `/du-an`) — xem `public-content.md` §17 Slice E

---

## Việc làm nền (một lần / khi thiếu)

1. `app/robots.ts` + `app/sitemap.ts` nếu chưa có.
2. Ảnh OG mặc + metadata gốc trong layout public (không ghi đè CRM).
3. Tách metadata CRM (có thể `noindex` toàn `(crm)` layout).

CRM layout: khuyến nghị `robots: { index: false, follow: false }` để tránh index trang nội bộ.

---

## 7. Công thức SEO lô đã đăng (`/mua-ban-nha-dat-huyen-nam-sach/[slug]`)

Áp dụng khi admin **Đăng web**. Khách và Google chỉ thấy field public (title, slug, excerpt, cover, `priceLabel`, vị trí). Không index lô nháp / đã gỡ.

Path gốc: `/mua-ban-nha-dat-huyen-nam-sach`. Hub địa bàn: [`public-content.md`](./domains/public-content.md) §17.

Contract: `publicGuestListingSchema` + `listingSearchDescription` trong `packages/shared`. Field `metaDescription` **tuỳ chọn** — overlay soạn bài có thể điền sau; trống thì dùng excerpt.

| Hạng mục | Công thức | Không làm |
|----------|-----------|-----------|
| **URL** | `https://anhungland.com/mua-ban-nha-dat-huyen-nam-sach/{slug}` — slug = title + phần địa chỉ **chưa** có trong title (không dấu, unique, **không cắt 80 ký tự**). Ổn định sau khi tạo. Tin cũ: commit `[apply-lot-slugs]` (301 URL cũ) | Query tracking làm canonical; đổi slug khi chỉ sửa copy; cắt giữa từ (`hai-duon`) |
| **Title** | `seoTitle` (GPT) + template `\| An Hưng Land`. Không nhồi brand trong field. Cùng địa danh/diện tích với H1, không bắt buộc trùng chữ | Nhồi «đất nền Đồng Nai giá rẻ…»; title chỉ mã lô không có xã/huyện; `title` HTML khác hẳn H1 (thiếu địa danh) |
| **Meta description** | `metaDescription` nếu có, không thì **excerpt** public, cắt ~160 ký tự | Copy giống nhau mọi lô; mô tả CRM / hoa hồng |
| **Canonical** | Đúng URL tuyệt đối ở trên | Hai URL một lô |
| **H1** | `title` (GPT h1) — **một** H1. Cùng địa danh chính với seoTitle; không lặp «tại X tại X» | Nhiều H1; H1 không có thôn/xã |
| **Copy** | Excerpt + mô tả **riêng** từng lô (SSR) | Lặp đoạn khuôn + keyword |
| **OG / Twitter** | title + description như trên; `og:image` = ảnh bìa; thiếu bìa → `/og-default.png`; `summary_large_image` | Ảnh PII / ảnh nội bộ CRM |
| **Ảnh / Google Images** | `alt` = `listingHeadline` (title + phần địa chỉ **chưa** có trong tên); gallery SSR đủ URL; sitemap `image:loc`; JSON-LD `ImageObject`. Xem §10 | `alt` rỗng / nhồi keyword; chặn Googlebot tải CDN; sitemap `/og-default.png` |
| **JSON-LD** | `RealEstateListing` (`name` = H1) + `Offer` (`itemOffered` Place/House, `floorSize` khi parse được) + `BreadcrumbList` (hub xã). `Offer.price` **chỉ** khi `priceLabel` parse được (vd. `2,85 tỷ`). `Liên hệ` / `3 tỷ xxx` → không bịa số | AggregateRating giả; giá map CRM; `name` lặp địa chỉ |
| **Link nội bộ** | Breadcrumb Trang chủ → Nhà đất đang bán → **xã** (`/xa/…`) → lô; block sản phẩm khác | Orphan URL; crumb nhồi cả chuỗi thôn + huyện + tỉnh |
| **Sitemap** | Chỉ lô `isPublished` (+ hub xã/cấp4 có lô). Mỗi URL lô kèm `image:image` (bìa + gallery CDN). Gỡ web → bỏ khỏi sitemap, URL cũ 404 `noindex` | Nháp, Tạm dừng, Đã cọc / Đã bán; ảnh brand fallback |
| **robots** | Cho phép path catalog mới; chặn `/login` + CRM | `Disallow` path catalog |

**Giá trên SERP:** cùng `priceLabel` khách thấy. Chính sách làm mờ (3,2 tỷ → `3 tỷ xxx`) thì meta/OG/JSON-LD cũng mờ — không lộ số CRM.

**Danh sách `/mua-ban-nha-dat-huyen-nam-sach`:** title/H1 `Nhà đất đang bán`; canonical đúng path; OG + `ItemList` các URL đã đăng.

---

## 8. ISR + revalidate on-demand

Lô / bài ít đổi (giá làm mờ, copy ổn định lâu). **Không** revalidate ngắn theo phút.

| Hạng mục | Quy ước |
|----------|---------|
| **Chiến lược** | ISR: `revalidate = false` (hoặc số rất lớn) + **on-demand** khi admin Lưu/Đăng/Gỡ/Xuất bản |
| **Nguồn sự thật** | PostgreSQL; HTML guest = bản build/cache từ API public |
| **Trigger** | Nest sau ghi DB thành công → `POST` Next `/api/revalidate` với `REVALIDATE_SECRET` **qua loopback** `PUBLIC_WEB_ORIGIN` (mặc định `http://127.0.0.1:5001`). Không gọi `https://anhungland.com/api/…` — nginx `/api/` đi Nest. |
| **Path lô** | `/mua-ban-nha-dat-huyen-nam-sach/[slug]`, list + hub `/xa/…`, `/sitemap.xml`, `/` (khi đăng/gỡ đổi trạng thái) |
| **Path bài** | `/{category}/[slug]`, list chuyên mục, `/`, sitemap |
| **Gỡ / về nháp** | Revalidate + lần generate sau → 404; bỏ khỏi sitemap |
| **HTML** | Nội dung chính (title, H1, bodyHtml đã sanitize) trong response đầu — không chỉ client fetch |
| **CRM** | `noindex`; không đưa vào sitemap |
| **Env** | Cùng `REVALIDATE_SECRET` trên Nest (`apps/api/.env`) và Next (`apps/web/.env`); `PUBLIC_WEB_ORIGIN` trên Nest |

Roadmap tick-list: [`docs/domains/public-content.md`](./domains/public-content.md) §16.

---

## 9. Công thức SEO bài viết (khi có trang guest)

Áp dụng khi admin **Xuất bản**. Nháp không index.

| Hạng mục | Công thức |
|----------|-----------|
| **URL** | `https://anhungland.com/{category}/{slug}` (category = enum: `tin-tuc`, `du-an`, …) |
| **Title / H1** | `title` bài + template `\| An Hưng Land`. Bài dự án có thể nháp từ GPT (`/dashboard/bai-viet` §14.4) — admin đọc lại trước Xuất bản |
| **Meta description** | `metaDescription` hoặc excerpt (~160) từ body |
| **OG** | cover + title; thiếu cover → không Xuất bản (UI) |
| **JSON-LD** | `Article` / `BlogPosting`: headline, `ImageObject` (bìa + ảnh body), datePublished, dateModified, author |
| **Sitemap** | Chỉ `PUBLISHED` + `image:image` (bìa + `img` trong body). Không `/og-default.png` |
| **List chuyên mục** | title/H1 = nhãn category; canonical `/{category}`; `ItemList` các URL bài đã xuất bản |
| **404** | Slug giả / nháp / gỡ → `(public)/not-found.tsx` `noindex`, không kế thừa canonical trang chủ |

Slice API + route guest: domain doc §16 Phase 5–7.

---

## 10. SEO hình ảnh (Google Images + OG)

Ảnh lô / bài đã có ngữ cảnh mạnh (tên, xã/huyện, excerpt, giá công bố). Gắn đúng tín hiệu thì Google Images và link chia sẻ dùng được.

**Lúc tạo lô:** file điện thoại (`IMG_4521.jpg`) **không** đủ cho SEO. Server **convert WebP** (`sharp`) rồi đặt object key CDN theo **tên lô + địa chỉ** (`…-anh-n.webp`, cùng slug trang khách). Cạnh dài tối đa 2560px. Tài liệu mật (sổ đỏ) **không** convert.

**Kho ảnh cũ:** JPEG/PNG trên CDN — `pnpm images:seo-copy` copy sang `…-anh-n.webp` rồi trỏ DB. Ảnh chat / avatar JPEG migrate: `APPLY=1 pnpm images:webp-replace` (VPS: commit `[seo-webp-replace]`) — ghi `.webp`, cập nhật DB, **rồi mới** xóa nguồn. Tài liệu mật (sổ đỏ) **không** convert.

| Cách | Khi nào | Lệnh / hành vi |
|------|---------|----------------|
| Dry-run | Xem sẽ chuyển những gì | `pnpm images:seo-copy` (mặc định **mọi lô CRM**) |
| Apply | Chạy thật trên VPS | `APPLY=1 pnpm images:seo-copy` |
| Lô nhỏ | Tránh chạy hết một lần | `APPLY=1 LIMIT=30 pnpm images:seo-copy` |
| Chỉ lô đã Đăng web | Thu hẹp | `APPLY=1 SCOPE=published pnpm images:seo-copy` |
| Toàn bộ CRM `/lo-dat` | Mọi Lodat; copy ảnh chat-gắn-lô sang SEO (giữ chat gốc); xong thì revalidate sitemap | `APPLY=1 SCOPE=all pnpm images:seo-copy` |
| Ảnh dự án còn UUID (không gắn lô) | Tên file = **tên dự án** (`Address.detail`); không đụng `lodats/` hay chat | `APPLY=1 pnpm images:seo-copy-addresses` (VPS: commit `[seo-copy-orphan-addr]`) |
| Khi Đăng web | Tự copy ảnh lô/dự án còn tên xấu; ảnh chat gắn lô → copy SEO, giữ chat | `setPublished` — không chặn đăng nếu lỗi |
| Ảnh bài CMS (`public-web/`) | Bìa + ảnh TipTap: lúc upload convert WebP. Kho JPEG cũ: `APPLY=1 pnpm images:webp-public-media` (VPS: commit `[seo-webp-posts]`) |
| Ảnh chat / avatar JPEG migrate | Cùng stem `.webp`, cập nhật mọi `objectKey`, xóa JPEG/PNG khi DB hết ref | `APPLY=1 pnpm images:webp-replace` (VPS: `[seo-webp-replace]`) |

Ảnh đã đúng `{slug}-anh-n` thì script bỏ qua (idempotent). Snapshot giao dịch đổi sang key mới rồi mới xóa nguồn.

| Hạng mục | Công thức | Không làm |
|----------|-----------|-----------|
| **Tên file / CDN** | Ảnh lô: `lodats/{id}/{slug-ten-dia-chi}-anh-{n}.webp`. Ảnh dự án: `addresses/{id}/{ten-du-an}-anh-n.webp`. Bytes = WebP. Ảnh chat: `customers/chat/….webp` (migrate JPEG → replace script). Ảnh chat gắn lô: **copy** sang key SEO WebP | UUID / `IMG_1234` / JPEG public cho ảnh lô mới; nhồi keyword |
| **Alt** | Ảnh lô: `listingHeadline` — `{title}` + phần địa chỉ chưa có trong tên (không lặp «tại X tại X»); nhiều ảnh → thêm `— ảnh 2`. Ảnh dự án (`/addresses/`): **tên dự án** (`placeLabel` / `Address.detail`). Bài: `title`. Thumbnail gallery: `alt=""` | `alt` rỗng trên ảnh chính; «đất nền giá rẻ bán nhanh…»; PII / hoa hồng |
| **HTML** | Mọi URL gallery nằm trong HTML lần tải đầu (SSR). Ảnh nằm cạnh H1 + địa chỉ + mô tả | Chỉ đổi `src` bằng JS nên bot chỉ thấy 1 ảnh; CSS `background-image` cho ảnh lô |
| **Sitemap** | Trong `sitemap.xml`, mỗi URL lô/bài published có `image:image` → `image:loc` tuyệt đối (CDN). Bìa + gallery; bài = bìa + `img` trong body | `/og-default.png`; nháp; `data:` URI |
| **JSON-LD** | `ImageObject`: `contentUrl`, `caption` (= alt), `description` (= meta/excerpt). Ảnh bìa `representativeOfPage` | Bịa EXIF / license; caption khác nội dung trang |
| **OG** | `og:image` = ảnh bìa CDN; thiếu → `/og-default.png` (không đưa fallback này vào image sitemap) | Ảnh chat / nội bộ CRM |
| **CDN** | `cdn.anhungland.com` phải **crawl được**. Search Console: xác minh cả property ảnh (CDN) nếu khác apex | `robots` / WAF chặn Googlebot ảnh; hotlink protection chặn bot |
| **Bảo ảnh** | Ưu tiên ngữ cảnh + CDN public. Watermark nhẹ nếu cần sau — không chặn chuột phải / không `noindex` ảnh | Chặn download làm Google không lấy được file |

Google **bỏ** `image:caption` / `image:title` / `image:geo_location` trong sitemap — caption và địa điểm lấy từ HTML + schema trên trang. Tên file trên CDN vẫn là tín hiệu phụ (URL path).

---

## 11. Tạm đóng index (đến khi site ổn)

Web công khai đang **chưa** mời Google/Bing xếp hạng. HTML vẫn crawl được; meta là `noindex, follow` để bot đọc tín hiệu và **không** đưa URL vào kết quả tìm kiếm. **Không** `Disallow: /` — nếu chặn crawl thì bot không thấy `noindex`, trang đã index có thể kẹt lâu hơn. **Không** chặn Googlebot trên `cdn.anhungland.com`.

| Hạng mục | Khi cờ tắt (mặc định) | Khi bật |
|----------|----------------------|---------|
| Meta `robots` | `noindex, follow` mọi trang `(public)` | `index, follow` trang hữu ích |
| `robots.txt` | Allow `/`; **không** dòng `Sitemap:` | Allow `/` + `Sitemap: https://anhungland.com/sitemap.xml` |
| `sitemap.xml` | Rỗng | URL lô/bài/hub đã đăng như §3 / §7 / §9 |
| 404 / CRM / login | `noindex, nofollow` (không đổi) | không đổi |

**Bật index sau khi hoàn thiện cơ bản** (cần rebuild Next, không chỉ restart PM2):

1. Trên VPS, thêm vào `apps/web/.env.production`: `PUBLIC_SEO_INDEX=1`
2. **Không** ghi sẵn `=1` trong `scripts/remote_deploy.sh` (file `.env.production` trên server đã tồn tại).
3. Deploy / rebuild web (`pnpm --filter @crmanhung/web build` trên VPS qua Actions).
4. Kiểm tra HTML có `index, follow`; `/robots.txt` có `Sitemap:`; `/sitemap.xml` có URL lô.

Cờ cũng nhận `NEXT_PUBLIC_SEO_INDEX=1` / `true`. Tắt = bỏ dòng hoặc đặt khác `1`/`true`.

