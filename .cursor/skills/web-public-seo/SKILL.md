---
name: web-public-seo
description: SEO standards for CRMAnHung public web (anhungland.com, no login). Use when editing apps/web (public) routes, landing, metadata, sitemap, robots, or Open Graph.
---

# Web công khai — SEO

Đọc đầy đủ: [`docs/PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) · IA nội dung: [`docs/PUBLIC-WEB.md`](../../../docs/PUBLIC-WEB.md).

## Phạm vi

- **Có:** route `(public)/`, landing, trang khách không login trên `anhungland.com`
- **Không:** màn CRM sau login (ưu tiên UX/auth, thường `noindex`)

**Index:** production `anhungland.com` đang `PUBLIC_SEO_INDEX=1` (`index, follow` + sitemap). Local mặc định `noindex`. Tắt: `PUBLIC_SEO_INDEX=0` trên VPS rồi rebuild — [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §11. Không `Disallow: /`. Không chặn Googlebot trên CDN.

## Khi sửa trang public — bắt buộc

1. `metadata` / `generateMetadata`: **title**, **description**, **canonical**, **openGraph** (và Twitter nếu có ảnh)
2. Một `<h1>`; ảnh có `alt`; URL sạch
3. Nội dung chính SSR/RSC — không để bot chỉ thấy shell trống
4. URL mới → cập nhật `sitemap.ts` (chỉ phát URL khi `PUBLIC_SEO_INDEX` bật); giữ `robots.ts` chặn khu CRM + `/login`; **không** `Disallow: /`
5. **Lô `/mua-ban-nha-dat-huyen-nam-sach/[slug]`:** làm đúng công thức [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §7 (excerpt → meta; cover → OG; sitemap chỉ `isPublished`; JSON-LD không bịa giá). Hub địa bàn: domain `public-content` §17.
6. **Ảnh:** lúc **tạo/sửa lô** (upload + Lưu title/địa chỉ) CDN key `{slug-ten-dia-chi}-anh-n.webp` (server convert WebP) **và** sibling `….og.png` 1200×630 cho `og:image` (Zalo; gallery vẫn WebP). **Đăng web không làm lại SEO ảnh.** Pilot vài lô: commit `[og-png-test]`; full: `[og-png]` / `pnpm images:og-jpg` (`APPLY=1`). **Bài CMS** (modal Soạn bài): `{slug-tieu-de}-anh-n.webp` dưới `public-web/`; bài cũ UUID → `pnpm images:seo-copy-posts`. `alt` guest = tiêu đề — không thêm ô Alt/Title. Ảnh chat **mới từ extension** → WebP lúc ingest (`customers/chat/`). Avatar khách **mới từ extension** → WebP (`customers/avatars/`). JPEG/PNG chat+avatar cũ: `pnpm images:webp-replace` (ghi WebP, cập nhật DB, rồi xóa nguồn). Ảnh chat gắn lô: **copy** sang key SEO WebP. Ảnh dự án: `{ten-du-an}-anh-n.webp`. Kho JPEG/PNG lô cũ: `pnpm images:seo-copy`. Trang khách: `alt`; sitemap `images`; JSON-LD `ImageObject`. Gallery SSR đủ URL. Không chặn Googlebot trên CDN.

## Cấm

- Metadata copy-paste giống nhau mọi trang
- Đưa dữ liệu CRM / PII lên public
- Client-only nội dung chính (`useEffect` mới fetch chữ marketing)

## Stack

Next.js App Router — dùng `metadata` API, `next/image`, `app/robots.ts`, `app/sitemap.ts`.

Meta Pixel Facebook: mã cơ sở trong `<head>` `app/layout.tsx`. Catalog lô → `ViewProductList`; chi tiết lô → `ViewContent`. GA4 (`G-W3L76S9YTD`) cùng `<head>` + `Ga4RouteTracker` khi đổi route. Chi tiết [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §6.

## Sau khi làm

Checklist PR trong `docs/PUBLIC-SEO.md`. Owner không cần hiểu kỹ thuật — agent tự áp dụng.
