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
| `app/sitemap.ts` | Liệt kê URL public ổn định; cập nhật khi thêm trang |
| HTTPS | Chỉ `https://anhungland.com` (www → apex hoặc ngược lại — một hướng, khớp canonical) |
| `lang` | `<html lang="vi">` (đã có ở root layout) |

### 4. Hiệu năng (ảnh hưởng SEO gián tiếp)

- LCP: ảnh hero / font không chặn quá mức; preload có chủ đích.
- Không nhồi script bên thứ ba trên above-the-fold nếu không cần.
- Tránh layout shift lớn (CLS) do ảnh/font không kích thước.

### 5. Chia sẻ & mạng xã hội

- Có ảnh OG mặc định brand (ví dụ `/og-default.png`) và ảnh riêng cho trang quan trọng.
- Kiểm tra bằng Facebook Sharing Debugger / Twitter Card Validator khi gần ship trang mới.

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

---

## Việc làm nền (một lần / khi thiếu)

1. `app/robots.ts` + `app/sitemap.ts` nếu chưa có.
2. Ảnh OG mặc + metadata gốc trong layout public (không ghi đè CRM).
3. Tách metadata CRM (có thể `noindex` toàn `(crm)` layout).

CRM layout: khuyến nghị `robots: { index: false, follow: false }` để tránh index trang nội bộ.
