---
name: web-public-seo
description: SEO standards for CRMAnHung public web (anhungland.com, no login). Use when editing apps/web (public) routes, landing, metadata, sitemap, robots, or Open Graph.
---

# Web công khai — SEO

Đọc đầy đủ: [`docs/PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) · IA nội dung: [`docs/PUBLIC-WEB.md`](../../../docs/PUBLIC-WEB.md).

## Phạm vi

- **Có:** route `(public)/`, landing, trang khách không login trên `anhungland.com`
- **Không:** màn CRM sau login (ưu tiên UX/auth, thường `noindex`)

**Tạm đóng index:** mặc định `noindex, follow` + sitemap rỗng. Chỉ bật khi owner bảo index: `PUBLIC_SEO_INDEX=1` trong `apps/web/.env.production` rồi rebuild — [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §11. Không `Disallow: /`. Không chặn Googlebot trên CDN.

## Khi sửa trang public — bắt buộc

1. `metadata` / `generateMetadata`: **title**, **description**, **canonical**, **openGraph** (và Twitter nếu có ảnh)
2. Một `<h1>`; ảnh có `alt`; URL sạch
3. Nội dung chính SSR/RSC — không để bot chỉ thấy shell trống
4. URL mới → cập nhật `sitemap.ts` (chỉ phát URL khi `PUBLIC_SEO_INDEX` bật); giữ `robots.ts` chặn khu CRM + `/login`; **không** `Disallow: /`
5. **Lô `/mua-ban-nha-dat-huyen-nam-sach/[slug]`:** làm đúng công thức [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §7 (excerpt → meta; cover → OG; sitemap chỉ `isPublished`; JSON-LD không bịa giá). Hub địa bàn: domain `public-content` §17.
6. **Ảnh:** lúc **tạo/upload lô** CDN key `{slug-ten-dia-chi}-anh-n`. Ảnh chat gắn lô: **copy** sang key SEO, **giữ** `customers/chat/`. Ảnh dự án: `{ten-du-an}-anh-n`. Kho cũ: `pnpm images:seo-copy` / `images:seo-copy-addresses` — [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §10. Trang khách: `alt`; sitemap `images`; JSON-LD `ImageObject`. Gallery SSR đủ URL. Không chặn Googlebot trên CDN.

## Cấm

- Metadata copy-paste giống nhau mọi trang
- Đưa dữ liệu CRM / PII lên public
- Client-only nội dung chính (`useEffect` mới fetch chữ marketing)

## Stack

Next.js App Router — dùng `metadata` API, `next/image`, `app/robots.ts`, `app/sitemap.ts`.

Meta Pixel Facebook: mã cơ sở trong `<head>` `app/layout.tsx`. Catalog lô → `ViewProductList`; chi tiết lô → `ViewContent`. Chi tiết [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §6.

## Sau khi làm

Checklist PR trong `docs/PUBLIC-SEO.md`. Owner không cần hiểu kỹ thuật — agent tự áp dụng.
