# Web công khai (trang khách) — An Hưng Land

- **Slug:** `public-web`
- **Status:** Ready for mock (IA khách) — **đăng nội dung:** [`domains/public-content.md`](./domains/public-content.md) (Draft)
- **URL:** `https://anhungland.com` — **không** cần đăng nhập
- **SEO:** bắt buộc theo [`PUBLIC-SEO.md`](./PUBLIC-SEO.md) · skill `web-public-seo`
- **CRM:** sau `/login` — khu nhân viên; **admin đăng web** = domain `public-content`, không phải registry khách

---

## Brand thật (đã có)

| Hạng mục | Giá trị |
|----------|---------|
| Tên | An Hưng Land / AnHung |
| Hotline chính | 0977.656.280 |
| Địa chỉ | BT6.8 KĐT Tây Nam Sách |
| Gam màu logo | Đỏ dịu `#B91C22` + vàng `#C9A227` (bớt rực so với bảng hiệu) |
| Logo FE | `apps/web/public/brand/anhung-logo.svg` |

Nguồn: bảng hiệu VPGD BĐS An Hưng Land.

## 1. Mục đích

Trang khách thể hiện **thương hiệu An Hưng Land**, cho phép ai cũng xem **sản phẩm** (chia sẻ MXH được), và đọc thêm nội dung phụ (dự án, kiến thức, kinh nghiệm).

Đăng nhập chỉ để nhân viên / admin vào **CRM nội bộ**.

---

## 2. Ưu tiên nội dung (đã chốt)

| Ưu tiên | Khối | Vai trò |
|---------|------|---------|
| **Chính** | Hình ảnh thương hiệu | Hero / nhận diện — tín hiệu brand mạnh trên viewport đầu |
| **Chính** | Danh sách sản phẩm | Tin/lô/bất động sản đang giới thiệu; **link share** MXH (FB, Zalo…) |
| **Phụ** | Bài đăng về dự án | Tin / cập nhật dự án |
| **Phụ** | Kiến thức BĐS, pháp lý, luật | Giáo dục / uy tín chuyên môn |
| **Phụ** | Kinh nghiệm mua bán, trao đổi | Góc nhìn thực tế / chia sẻ |

**Không** nhồi CRM, dữ liệu khách nội bộ, hay form nội bộ lên web công khai.

---

## 3. Gợi ý IA / route (FE)

| Route (gợi ý) | Nội dung | Ưu tiên |
|---------------|----------|---------|
| `/` | Brand hero + nổi bật sản phẩm + lối vào các mục phụ | Chính |
| `/san-pham` (+ `/san-pham/[slug]`) | Danh sách + chi tiết sản phẩm; OG/share | Chính |
| `/du-an` (+ `/du-an/[slug]`) | Bài / thông tin dự án | Phụ |
| `/kien-thuc` (+ bài chi tiết) | Pháp lý, luật, kiến thức BĐS | Phụ |
| `/kinh-nghiem` (+ bài chi tiết) | Kinh nghiệm mua bán / trao đổi | Phụ |
| `/login` | Cổng vào CRM — `noindex` | — |

Tên path có thể chỉnh khi làm mock; giữ **một** canonical / trang (SEO).

---

## 4. Viewport đầu (`/`)

Một composition (không dashboard):

1. **Brand** (tên / logo — hero-level)
2. Một headline ngắn
3. Một câu hỗ trợ
4. CTA nhóm nhỏ (vd. xem sản phẩm / liên hệ) — **không** bắt login để xem
5. **Hình ảnh thương hiệu** chiếm mặt phẳng visual chính

Danh sách sản phẩm: ngay dưới fold hoặc section chính tiếp theo — không để stats / lịch / badge lộn xộn trên hero.

---

## 5. Sản phẩm & chia sẻ MXH

- Mỗi sản phẩm có URL ổn định (`/san-pham/[slug]`).
- Metadata + Open Graph đủ để share Facebook / Zalo / Messenger hiện ảnh + title + mô tả.
- Trang chi tiết: ảnh, giá (nếu công bố), diện tích, vị trí, mô tả — đủ để khách quyết định xem tiếp / liên hệ.
- Nút chia sẻ (copy link / share) trên FE; **không** cần BE để mock UI.
- Meta Pixel Facebook (`391165622297911`) trong `<head>` layout gốc — xem [`PUBLIC-SEO.md`](./PUBLIC-SEO.md) §6.

---

## 6. Nội dung phụ

- Mỗi cụm (dự án / kiến thức / kinh nghiệm): **một** mục đích, một headline, list + trang chi tiết.
- Có thể dùng chung layout “bài viết” (title, ảnh cover, body, ngày).
- Trên `/`: chỉ teaser (vài item) + link “xem thêm” — không chiếm chỗ brand + sản phẩm.

---

## 7. Actors

| Ai | Được | Không |
|----|------|--------|
| Khách / công chúng | Xem tin, bài, lô **đã admin đăng**; share | Vào CRM; xem nháp; sửa |
| STAFF | Như khách trên public + CRM của mình | Đăng / gỡ web |
| ADMIN | Như STAFF + **đăng / gỡ** lô và bài lên web | Lộ PII khách lên public |

Chi tiết quyền + công tắc Đăng web: [`domains/public-content.md`](./domains/public-content.md).

---

## 8. Mock FE (chưa BE)

- Ảnh brand + 4–8 sản phẩm giả + vài bài phụ.
- Chi tiết sản phẩm có nút share (UI).
- `NEXT_PUBLIC_USE_MOCK` / data cứng trong `features/public/`.
- API / CMS thật: phase sau (ngoài scope khi chỉ làm FE).

---

## 9. Open questions

**Đã chốt (2026-08-26):** khách trên `/` thấy tin tức, bài đăng, lô cần bán. **Admin** mới được public dữ liệu đó. Không catalogue marketing tách khỏi CRM — lô web = lô CRM được chọn đăng.

Còn lại (mặc định đề xuất trong [`public-content.md`](./domains/public-content.md) §11):

- Chỉ ADMIN bấm Đăng web? Công tắc tường minh (không auto Mở bán)?
- Giá: hiện số hoặc «Liên hệ» từng lô?
- Liên hệ: hotline + Zalo công ty; chưa form SĐT?
