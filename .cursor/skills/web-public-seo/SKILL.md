---
name: web-public-seo
description: SEO standards for CRMAnHung public web (anhungland.com, no login). Use when editing apps/web (public) routes, landing, metadata, sitemap, robots, or Open Graph.
---

# Web công khai — SEO

Đọc đầy đủ: [`docs/PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) · IA nội dung: [`docs/PUBLIC-WEB.md`](../../../docs/PUBLIC-WEB.md).

## Phạm vi

- **Có:** route `(public)/`, landing, trang khách không login trên `anhungland.com`
- **Không:** màn CRM sau login (ưu tiên UX/auth, thường `noindex`)

## Khi sửa trang public — bắt buộc

1. `metadata` / `generateMetadata`: **title**, **description**, **canonical**, **openGraph** (và Twitter nếu có ảnh)
2. Một `<h1>`; ảnh có `alt`; URL sạch
3. Nội dung chính SSR/RSC — không để bot chỉ thấy shell trống
4. URL mới → cập nhật `sitemap.ts`; giữ `robots.ts` chặn khu CRM + `/login`

## Cấm

- Metadata copy-paste giống nhau mọi trang
- Đưa dữ liệu CRM / PII lên public
- Client-only nội dung chính (`useEffect` mới fetch chữ marketing)

## Stack

Next.js App Router — dùng `metadata` API, `next/image`, `app/robots.ts`, `app/sitemap.ts`.

Meta Pixel Facebook: mã cơ sở trong `<head>` `app/layout.tsx`. `/san-pham` → `ViewProductList`; `/san-pham/[slug]` → `ViewContent`. Chi tiết [`PUBLIC-SEO.md`](../../../docs/PUBLIC-SEO.md) §6.

## Sau khi làm

Checklist PR trong `docs/PUBLIC-SEO.md`. Owner không cần hiểu kỹ thuật — agent tự áp dụng.
