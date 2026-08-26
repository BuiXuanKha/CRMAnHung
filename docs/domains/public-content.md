# Domain: Nội dung web công khai (Khách / Admin đăng)

- **Slug:** `public-content`
- **Status:** Draft — chủ chốt hướng: khách xem tin + bài + lô bán; **admin mới được public**. Còn vài luật dưới §11.
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

Đề xuất quyền (chờ §11): **chỉ ADMIN** bấm Đăng web — trang khách là thương hiệu công ty, không phải sàn từng NV.

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
| `category` | `tin-tuc` · `du-an` · `kien-thuc` · `kinh-nghiem` |
| `status` | `DRAFT` (chỉ admin) · `PUBLISHED` (khách thấy) |
| `slug` | URL ổn định, unique |

Tin tức = chuyên mục `tin-tuc`. Bài đăng = ba chuyên mục còn lại. **Một** màn soạn, lọc theo chuyên mục.

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

Chưa đặc tả §12 từng control — chờ chủ xác nhận §11 rồi viết máy tính → mobile.

| Màn | Route (gợi ý) | Việc |
|-----|----------------|------|
| Trang chủ khách | `/` | Đã có mock — sau nối data đã public |
| List / chi tiết lô khách | `/san-pham`, `/san-pham/[slug]` | Đã có mock |
| List / chi tiết bài khách | `/du-an`, `/kien-thuc`, `/kinh-nghiem` (+ `[slug]`) | List stub; **thiếu** trang chi tiết `[slug]` |
| Hub admin đăng web | `/quan-tri/web` | Chỉ ADMIN; menu **Web công khai** |
| Admin — lô đăng bán | `/quan-tri/web/lo-dat` | Tìm lô CRM, Đăng / Gỡ, sửa copy public |
| Admin — bài viết | `/quan-tri/web/bai-viet` | List nháp/đã đăng; tạo/sửa; Xuất bản |
| Lối tắt trên lô CRM | `/lo-dat/[id]` (ADMIN) | Hangtag / nút **Đăng web** — quy tắc nút viết sau |

**Không** nhét vào `/quan-tri/khach-hang` (registry xóa cứng — việc khác).

Menu header CRM: mục **Web công khai** chỉ hiện với ADMIN (cạnh Quản trị khách).

---

## 7. Contract / API dự kiến

Prefix `/api/v1`. **Chưa** khóa Zod — sau khi §11 chốt.

| Method | Path | Auth | Việc |
|--------|------|------|------|
| GET | `/public/listings` | Không | Lô đã đăng (trang khách) |
| GET | `/public/listings/:slug` | Không | Chi tiết lô |
| GET | `/public/posts` | Không | Bài `PUBLISHED` |
| GET | `/public/posts/:slug` | Không | Chi tiết bài |
| GET/PATCH | `/admin/listings…` | JWT ADMIN | Đăng / gỡ / sửa copy |
| GET/POST/PATCH | `/admin/posts…` | JWT ADMIN | CRUD bài |

Public GET: không JWT; không trả field cấm §3.3.

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

## 11. Open questions — chủ xác nhận

Mặc định đề xuất (bác thì nói số):

1. **Ai bấm Đăng web?** Chỉ ADMIN. STAFF không đăng, không sửa copy public.
2. **Lô lên web thế nào?** Công tắc tường minh — **không** auto mọi lô Mở bán.
3. **Tự gỡ?** Tạm dừng / Đã cọc / Đã bán → gỡ web. Admin đăng lại khi lại Mở bán.
4. **Giá?** Admin chọn từng lô: hiện số (lấy từ map) hoặc chữ **Liên hệ**.
5. **Hai NV cùng LK12?** Chỉ một listing public / một lô kho.
6. **Tin vs bài?** Một màn Bài viết, bốn chuyên mục (`tin-tuc` + ba mục IA).
7. **Liên hệ khách?** Giữ hotline + Zalo công ty trên trang lô. **Chưa** form để lại SĐT (tránh trộn lead CRM).
8. **Mô tả public?** Ô riêng (admin viết cho khách). Không lấy nguyên `note` nội bộ lô.

Xong 1–8 → Status **Ready for mock** → §12 màn admin (máy tính rồi mobile) → contract → mock UI.
