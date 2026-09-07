# Sổ theo dõi lỗi — CRM An Hưng Land

File này là sổ theo dõi lỗi của **toàn bộ project**. Không xóa và không tự ý sửa nội dung các bug đã ghi.

## Quy tắc audit

1. Audit theo từng module/chức năng. Không audit toàn bộ hệ thống trong một lần.
2. **Source code là nguồn sự thật.** Đọc code trước. Docs chỉ dùng để đối chiếu sau khi đã hiểu code.
3. Trong giai đoạn audit: chỉ ghi nhận. Không sửa code, không refactor, không migration, không commit/push thay đổi code nghiệp vụ.
4. Mỗi bug có ID tăng dần: `BUG-001`, `BUG-002`, …
5. Lần audit module mới: đọc bug cũ để tránh ghi trùng; chỉ **bổ sung** bug mới; giữ nguyên lịch sử.
6. Không kết luận khi chưa đủ bằng chứng. Ghi `NEEDS VERIFICATION` thay vì khẳng định đó là BUG.
7. Không tự sửa bug sau khi phát hiện. Owner quyết định bug nào được fix.

## Kiểm thử trình duyệt

Khi cần xác minh chức năng thực tế trên UI:

1. Chỉ dùng tài khoản kiểm thử do owner cung cấp (ngoài git). **Không** ghi mật khẩu vào file này hay bất kỳ file nào trong repo.
2. Tài khoản được phép: `Admin` (quản trị), `kha` (user). Không dùng tài khoản khác.
3. Chỉ đọc / điều hướng / quan sát. Mọi thao tác **tạo, sửa, hoặc xóa dữ liệu thực tế** phải báo owner trước và **không tự thực hiện**.
4. Bug phát hiện qua trình duyệt ghi thêm các trường dưới đây (ngoài mẫu chuẩn).

## Trạng thái sổ

| Trường | Giá trị |
|--------|---------|
| ID tiếp theo | `BUG-084` |
| Tổng bug đã ghi | 83 |
| OPEN | 44 |
| NEEDS VERIFICATION | 0 |
| FIXED / CLOSED | 39 |
| Lần audit gần nhất | 2026-09-03 — Browser audit (public + CRM Admin/kha, chỉ đọc) |

## Cách ghi một bug

Mỗi mục bug tối thiểu gồm:

- **ID** — `BUG-NNN`
- **Severity** — `CRITICAL` / `HIGH` / `MEDIUM` / `LOW`
- **Module**
- **File**
- **Function**
- **Vị trí code** — nếu xác định được (hàm, dòng, nhánh)
- **Problem**
- **Root cause**
- **Impact**
- **Evidence** — dẫn code / hành vi quan sát được; không suy đoán
- **Status** — mặc định `OPEN` (hoặc `NEEDS VERIFICATION` nếu chưa đủ bằng chứng)

Nếu phát hiện qua trình duyệt, **bắt buộc** thêm:

- **Test account** — `Admin` hoặc `kha`
- **Thao tác đã thực hiện**
- **Kết quả thực tế**
- **Kết quả mong đợi**
- **Cách tái hiện**

Mẫu:

```md
### BUG-NNN — <tiêu đề ngắn>

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/api/src/modules/customers/customers.service.ts`
- **Function:** `update`
- **Vị trí code:**
- **Problem:**
- **Root cause:**
- **Impact:**
- **Evidence:**
- **Status:** OPEN
```

Mẫu (phát hiện qua trình duyệt):

```md
### BUG-NNN — <tiêu đề ngắn>

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/web/src/features/customers/...`
- **Function:**
- **Vị trí code:**
- **Problem:**
- **Root cause:**
- **Impact:**
- **Evidence:**
- **Test account:** kha
- **Thao tác đã thực hiện:**
- **Kết quả thực tế:**
- **Kết quả mong đợi:**
- **Cách tái hiện:**
- **Status:** OPEN
```

## Nhật ký audit

| Ngày | Module | Bug mới | Ghi chú |
|------|--------|---------|---------|
| 2026-09-03 | — | — | Khởi tạo `docs/audit/BUGS.md`. Chưa audit. Chờ owner giao module đầu tiên. |
| 2026-09-03 | — | — | Bổ sung quy tắc kiểm thử trình duyệt (tài khoản Admin / kha; cấm tự tạo-sửa-xóa dữ liệu; mẫu bug UI). Mật khẩu không lưu trong repo. |
| 2026-09-03 | User / Login / Auth / Role / Permission | BUG-001 … BUG-012 | Đọc source API + web. Không sửa code. Không login production (Cloudflare 1010 chặn non-browser; login sẽ tạo refresh token). |
| 2026-09-03 | Person / Customer / SĐT / Facebook / chủ đất | BUG-013 … BUG-022 | Source: Customer, CustomerPhone, CustomerFacebook, LodatCustomerMap, merge, extension ingest, web list. Không sửa code. Không login (tránh tạo refresh; CF 1010). |
| 2026-09-03 | Lô đất / map chủ / giá-DT-MT-hướng / trạng thái / public listing | BUG-023 … BUG-034 | Source: `lodats.service`/`dto`/`schema.prisma`, `packages/shared/src/lodats.ts`, `apps/web/src/features/lodats`, `transactions.service` (đồng bộ map), `public-content.service` (Đăng web ∩ Mở bán), `customers-view` lodatCount. Không sửa code. Không login (CF 1010; không tạo/sửa/xóa dữ liệu thật). |
| 2026-09-03 | Share lô public / cookie / thống kê / authz API | BUG-035 … BUG-040 | Source: `lot-shares.service` + public/admin controllers, `public-listings` share-link, `lodats` share-link, middleware cookie, `packages/shared/src/lot-shares.ts`, web `features/lot-shares` + `ProductShareButton`. Không có Share nội bộ CRM (cấp quyền lô giữa NV). Không sửa code. Không login. Không ghi trùng BUG-003. |
| 2026-09-03 | Messenger ingest / tin đã lưu / UID–thread–Person | BUG-041 … BUG-046 | Source: `from-extension.service`/`parse`, Prisma `CustomerMessenger*`, `GET /customers/:id/messages`, web `ChatThread` rail list, `apps/extension` stub. Đối chiếu scanner cũ `MESSAGE_MAX_COUNT=500`. Không sửa code. Không ghi trùng BUG-013 / 016 / 021. |
| 2026-09-03 | Dashboard / địa chỉ / kho lô / GD / sổ đỏ / CMS bài / lọc-phân trang còn lại | BUG-047 … BUG-058 | Source: `public-content` + `staff-lots`/`api.ts` dashboard, `addresses`/`admin-units`, `transactions`, `title-services`, `customers-filters` ngân sách, `users` hotline, Prisma `ProjectLot`. Không sửa code. Không commit/push. Không login (CF 1010; không tạo/sửa/xóa dữ liệu thật). Không ghi trùng BUG-009 / 016 / 023–025 / 030 / 032 / 037. |
| 2026-09-03 | Liên kết toàn hệ thống (cross-module flows) | BUG-059 … BUG-065 | Trace FE→API→DB→module liên quan. Source: `changeOwner` ∩ TX, xóa ảnh lô/địa chỉ ∩ snapshot/R2/`countPublicImageKeyRefs`, overlay listing ∩ `lodats.update`, `Customer.isHidden` ∩ TX/sổ đỏ/chat, `users.remove` FK, ingest FB UID ∩ `EmployeeFacebookProfile`. Không sửa code. Không commit/push. Không login. Không ghi trùng BUG-001 / 003 / 016 / 021 / 023–028 / 032 / 034 / 036 / 046 / 049. |
| 2026-09-03 | SEO / URL public (slug → API → Next → metadata/sitemap/robots/OG/JSON-LD) | BUG-066 … BUG-080 | Source: `toPublicSlug`/`uniqueSlug`/`PublicLotSlugRedirect`, `public-content.service`, hub `buildHubSlugMaps`, `sitemap.ts`/`robots.ts`, `listing-seo`/`post-seo`/`listing-hub-seo`, revalidate, guest `api.ts` nuốt lỗi, `og-default.png` không có trong `apps/web/public`. Không sửa code. Không commit/push. Không login (CF 1010). Không ghi trùng BUG-023 / 024 / 056 / 062 (chỉ hệ quả SEO riêng). |
| 2026-09-03 | Browser audit — public live HTML | BUG-081 … BUG-082 | `https://anhungland.com` UA Chrome: title trang chủ lặp brand; `GET /dashbroad` 200 prerender (không 307). Xác nhận live BUG-071 (chuyên mục trống vẫn 200+index+sitemap). `og-default.png` production 200 (BUG-075 là thiếu file trong git). Không ghi trùng 071/075. Chưa xong CRM login UI (agent trình duyệt đang chạy). Không sửa code. Không commit/push. |
| 2026-09-03 | Browser audit — CRM Admin + kha | BUG-083 | UI: login/validation, list khách/lô/GD/sổ, fake ID 404, kha bị chặn bài-viết/thống-kê/user/địa-chỉ. kha mở được stub `/quan-tri/khach-hang` (không redirect). Không ghi: kha `/dashboard`→`/dashboard/lo-dat` (đúng Đăng web); 404 public đã có link Trang chủ. Lỡ bấm «Chia sẻ» lô (createOrGet). Không sửa/xóa. Không commit/push. |
| 2026-09-04 | auth fix | BUG-001 FIXED | `JwtStrategy` load User + `sessionVersion`; revoke refresh khi đổi role / khóa / reset MK. |
| 2026-09-04 | auth / shares | BUG-002 … BUG-005 FIXED | Username lowercase; share slug ownership; login timing + MaxLength mật khẩu. Dừng tại BUG-005 theo owner. |
| 2026-09-04 | auth policy | password 6–18 | Owner chốt mật khẩu 6–18 ký tự (login/create/reset + shared + UI). |
| 2026-09-04 | lot-shares | BUG-003 CLOSED | Owner: publish rồi ai cũng share được với hotline của mình — không phải bug; revert ownership check trên slug. |
| 2026-09-04 | auth fix | BUG-006 FIXED | Reuse refresh đã revoke → hủy toàn bộ session + sessionVersion. |
| 2026-09-04 | auth / web | BUG-007 FIXED | Refresh HttpOnly cookie; access memory-only; không localStorage. |
| 2026-09-04 | authz | BUG-008 FIXED | STAFF ownership fail → 404 (không lộ ID bản ghi NV khác). |
| 2026-09-04 | addresses | BUG-009 FIXED | includeHidden chỉ ADMIN; STAFF không đọc địa chỉ/đơn vị đã ẩn. |
| 2026-09-04 | docs | conflict markers | Gỡ sót marker merge trên `BUGS.md` journal (password 6–18 + BUG-003). |
| 2026-09-04 | users | BUG-010 CLOSED | Owner: race Admin cuối không xảy ra với An Hưng Land — won't fix. |
| 2026-09-04 | users / auth | BUG-011 FIXED | Create/reset: 6–18 + bắt buộc chữ và số; login không đổi. |
| 2026-09-04 | web authz | BUG-012 FIXED | Middleware CRM theo cookie role; STAFF không vào route Admin (kèm BUG-083). |
| 2026-09-04 | customers | BUG-013 note | DB prod: trùng UID khác page = đúng; 4 case buinam cùng page + E2EE khác thread (legacy) — để xử lý sau. |
| 2026-09-04 | customers | BUG-014 deferred | Owner: để sau. Acknowledge trùng SĐT lúc tạo vẫn rename+unhide. |
| 2026-09-04 | customers | BUG-015 FIXED | PATCH/DELETE theo `phoneId` (không wipe số phụ); modal quản lý SĐT; FAB/gọi: 1 số → tel, ≥2 → picker. |
| 2026-09-05 | customers / permission | BUG-017 FIXED | Owner: Admin không gộp; chỉ NV gộp khách của mình (`source/target.employeeId === user.id`). |
| 2026-09-05 | customers | BUG-016 defer | Owner: nghiêm trọng — bàn chi tiết / chốt thiết kế sau; **chưa code**. Giữ Person đích, chuyển hết quan hệ rồi mới xóa nguồn (không tạo Person mới). |
| 2026-09-05 | customers | BUG-018 FIXED | Unique `(employeeId, phone)` + `(customerId, phone)`; normalize `0`+9; P2002 → 409. Không unique toàn hệ. |
| 2026-09-05 | customers | BUG-019 FIXED | List keyword: + `facebookName` / `customerUid`; SĐT qua `digitsFromPhoneRaw`. Không tìm `threadId` (owner). |
| 2026-09-05 | lodats | BUG-020 FIXED | Unique 1 chủ active/lô (ensure index); Admin **không** đổi chủ — chỉ NV giữ luồng. |
| 2026-09-05 | lodats | BUG-028 FIXED | Owner: Admin không đổi chủ (cùng PR BUG-020) — hết gắn Person xuyên NV qua change-owner. |
| 2026-09-05 | customers / extension | BUG-021 FIXED | Ingest tự khôi phục khách ẩn + `autoRestoredAt`; hangtag «Tự khôi phục» (CRM cũ). |
| 2026-09-05 | customers | BUG-022 FIXED | Owner: bỏ `Customer.note` (drop cột); modal thêm SĐT không còn ô ghi chú; budget chỉ qua care. |
| 2026-09-05 | lodats | BUG-030 FIXED | API `@Min(0)` + service reject DT/MT âm — khớp Zod web. |
| 2026-09-05 | lodats / web | BUG-031 FIXED | Owner: mặc định lọc Mở bán; thêm «Tất cả trạng thái» thật (`includePaused`). |
| 2026-09-05 | lodats / customers | BUG-032 FIXED | Owner: badge số lô STAFF chỉ đếm lô mình tạo (vd. Anh Nam 3 lô → Kha 2, Dũng 1). |
| 2026-09-05 | lodats / db | BUG-033 CLOSED | Owner: không sao — không sửa CHECK XOR; API đã chặn lúc tạo. |
| 2026-09-05 | lodats | BUG-034 FIXED | Owner: lỗi copy ảnh chat → xóa lô vừa tạo (rollback); không để lô mồ côi / retry trùng. |
| 2026-09-05 | lot-shares / web | BUG-035 FIXED | Owner: chỉ ghi cookie `?share=` khi resolve thành công; mã rác/404 không đè last-click. |
| 2026-09-05 | lot-shares | BUG-036 CLOSED | Owner: không phải lỗi — link share sống lâu; không thu hồi/tắt; sau chỉ đổi trạng thái mở bán/đã bán. |
| 2026-09-05 | lot-shares | BUG-037 FIXED | Owner: POST /public/page-views chỉ cộng NV khi cookie httpOnly khớp mã; body một mình không đủ. |
| 2026-09-05 | lot-shares | BUG-038 CLOSED | Owner: link sống mãi — cộng visit thế nào cũng được; không sửa visit. |
| 2026-09-05 | lot-shares | BUG-036 CLOSED | Owner: link share sống mãi; không thu hồi. |
| 2026-09-05 | public-content | BUG-024 CLOSED | Owner: bỏ chức năng Gỡ Đăng web; API từ chối `isPublished: false`; ẩn khách theo Mở bán/Đã bán. |
| 2026-09-05 | users / lot-shares | BUG-039 FIXED | Owner: Admin chỉ được đổi SĐT NV, không xoá; `findActiveShare` cùng đòi phone như resolve. |
| 2026-09-05 | lot-shares | BUG-040 FIXED | Owner: resolve public chỉ hotline; cookie theo mã share; không lộ employeeId/visitCount. |
| 2026-09-05 | customers / messenger | BUG-041 deferred | Owner: tạm bỏ — extension không lấy được giờ tin; nội dung chat trên CRM ít giá trị; không sửa giờ này. |
| 2026-09-06 | customers / messenger | BUG-042 FIXED | Owner: `MAX_MESSAGES` 200 → 500 khớp extension; docs ingest cập nhật. |
| 2026-09-06 | customers / extension | BUG-043 note | Owner: **chưa sửa extension**. Tin không mid phần lớn do `collectOrphanBubbleMessages` (`orphan::`). Khi làm đợt extension sẽ bàn (cấm gửi + có thể siết API). DB `kha`: 899/18617. Ghi `apps/extension/README.md`. |
| 2026-09-06 | customers / messenger | BUG-044 FIXED | Owner: giữ tin `mid.$` / `@msgr.`; xóa tin không ID. API `from-extension` bỏ qua bubble không mid; migrate xóa hàng cũ. |
| 2026-09-06 | customers | BUG-045 CLOSED | Owner: không sửa — tự đổi `fullName` bằng bút trên list. |
| 2026-09-06 | customers / messenger | BUG-046 CLOSED | Owner: không sửa — chat chỉ tham khảo, không hiện ở chi tiết khách. |
| 2026-09-06 | public-content | BUG-047 FIXED | Owner: lô không của Admin — gỡ `/dashboard/lo-dat` + nút Đăng lô; API soạn/đăng lô chỉ STAFF. |
| 2026-09-06 | addresses / ProjectLot | BUG-048 FIXED | Owner: copy modal CRM cũ «Import lô đất Excel». Admin import vào dự án trống → `ProjectLot`. |
| 2026-09-06 | transactions | BUG-049 FIXED | Owner: Admin không tạo GD. `POST /transactions` 403; NV tạo từ lô mình. |
| 2026-09-06 | title-services | BUG-050 FIXED | Owner: Admin không tạo sổ đỏ. `POST /title-services` 403; NV tạo từ khách mình. |
| 2026-09-06 | audit | CHOT 051–083 | File `docs/audit/CHOT-BUG-051-083.md` — xác minh code main + giải thích NV/Admin để owner chốt. Chưa sửa OPEN. |
## Bản đồ module (quan sát cấu trúc, chưa audit)

Danh sách dưới đây chỉ phản ánh **thư mục/code hiện có**. Không phải kết luận audit.

| Module (code) | API | Web | Ghi chú |
|---------------|-----|-----|---------|
| auth | `apps/api/src/modules/auth` | `apps/web/src/features/auth` | Đăng nhập / JWT |
| users | `apps/api/src/modules/users` | `apps/web/src/features/users` | Quản trị user, hotline |
| customers | `apps/api/src/modules/customers` | `apps/web/src/features/customers` | Khách hàng, care, phone, extension ingest |
| addresses | `apps/api/src/modules/addresses` | `apps/web/src/features/addresses` | Địa chỉ, đơn vị hành chính — audit 2026-09-03 (còn lại) |
| lodats | `apps/api/src/modules/lodats` | `apps/web/src/features/lodats` | Lô đất — audit trước; kho `ProjectLot` ghi BUG-048 |
| transactions | `apps/api/src/modules/transactions` | `apps/web/src/features/transactions` | Giao dịch — audit 2026-09-03 |
| title-services | `apps/api/src/modules/title-services` | `apps/web/src/features/title-services` | Dịch vụ sổ đỏ — audit 2026-09-03 |
| lot-shares | `apps/api/src/modules/lot-shares` | `apps/web/src/features/lot-shares` | Share lô, thống kê xem |
| public-content | `apps/api/src/modules/public-content` | `apps/web/src/features/public-content` | CMS bài / listing / dashboard — audit 2026-09-03 (còn lại) |
| public web | controllers public trong API | `apps/web/src/features/public` | Catalog khách (list ∩ Mở bán); slug chi tiết = BUG-023; SEO/URL = BUG-066…080 |
| settings | — | `apps/web/src/features/settings` | Hotline + sổ địa chỉ + Import lô đất Excel (Admin) |
| health | `apps/api/src/modules/health` | — | Health check |
| storage | `apps/api/src/storage` | — | Cloudflare R2 |
| extension | — | `apps/extension` | Chrome MV3 |
| shared | — | `packages/shared` | Zod / types dùng chung |
| prisma | `apps/api/src/prisma` + schema | — | PostgreSQL |

## Tóm tắt bug

| ID | Severity | Module | Problem | Status |
|----|----------|--------|---------|--------|
| BUG-001 | HIGH | auth | Access JWT không gắn trạng thái user trên DB (disable / xóa / hạ role / reset MK). | FIXED |
| BUG-002 | HIGH | users / auth | Username unique phân biệt hoa-thường; login tìm không phân biệt. | FIXED |
| BUG-003 | HIGH | lot-shares | STAFF tạo share-link theo slug không kiểm tra quyền sở hữu lô. | CLOSED |
| BUG-004 | MEDIUM | auth | Login lộ username đang active qua thời gian (timing). | FIXED |
| BUG-005 | MEDIUM | auth | Login không giới hạn độ dài mật khẩu; bcrypt + body 32MB có thể DoS. | FIXED |
| BUG-006 | MEDIUM | auth | Refresh rotation không phát hiện reuse token đã revoke. | FIXED |
| BUG-007 | MEDIUM | auth / web | Access + refresh token lưu `localStorage` (mọi XSS = lấy session). | FIXED |
| BUG-008 | MEDIUM | customers / lodats | STAFF nhận 403 (thay vì 404) khi ID thuộc NV khác — lộ tồn tại bản ghi. | FIXED |
| BUG-009 | MEDIUM | addresses | `includeHidden` không khóa ADMIN; STAFF đọc địa chỉ / đơn vị đã ẩn. | FIXED |
| BUG-010 | MEDIUM | users | Kiểm tra Admin cuối cùng không atomic — race có thể hết Admin. | CLOSED |
| BUG-011 | LOW | users / auth | Mật khẩu tối thiểu 6 ký tự, không độ phức tạp. | FIXED || BUG-012 | LOW | web authz | Chặn route/role CRM chỉ ở client; Guest/STAFF vẫn tải JS trang admin. | FIXED |
| BUG-013 | HIGH | customers / extension | Cùng NV+page+UID vẫn có thể 2 Person (E2EE khác thread; prod: 4 case buinam). | OPEN |
| BUG-014 | HIGH | customers | Trùng SĐT lúc tạo: bấm OK ghi đè `fullName` và mở lại khách cũ. | OPEN |
| BUG-015 | HIGH | customers | Sửa SĐT xóa mọi số phụ (khách migrate nhiều số). | FIXED |
| BUG-016 | HIGH | customers | Gộp Facebook: mất SĐT nguồn, party SetNull, xóa map trùng lô; TitleService Restrict → merge vỡ. | OPEN |
| BUG-017 | HIGH | customers / permission | Admin gộp Facebook giữa hai `employeeId` khác nhau — chuyển hồ sơ sang NV khác. | FIXED |
| BUG-018 | HIGH | customers | SĐT không unique trên DB; không chuẩn hóa — race / format lệch tạo Person trùng. | FIXED |
| BUG-019 | MEDIUM | customers | Tìm kiếm không khớp tên/UID Facebook; keyword SĐT không bỏ khoảng trắng. | FIXED |
| BUG-020 | MEDIUM | lodats / ChuDat | `LodatCustomerMap` không ràng buộc 1 chủ active / lô; list lấy 1 map theo `updatedAt`. | FIXED |
| BUG-021 | MEDIUM | customers / extension | Ingest extension cập nhật khách `isHidden` nhưng không khôi phục — chat mới bị ẩn. | FIXED |
| BUG-022 | MEDIUM | customers | Contract `updateCustomer` có `note`/budget; API DTO không nhận — không sửa được `Customer.note`. | FIXED |
| BUG-023 | HIGH | lodats / public-content | `GET /public/listings/:slug` không kiểm tra Mở bán — lô Tạm dừng vẫn mở được bằng URL. | OPEN |
| BUG-024 | HIGH | lodats / public-content | Gỡ Đăng web cũng đi qua `requireOpenLodat` — lô Tạm dừng không gỡ được listing. | CLOSED |
| BUG-025 | HIGH | lodats / transactions | Xóa GD mở ép map `DANG_BAN`; tạo/sửa/hoàn tất GD không đụng trạng thái rao bán. | OPEN |
| BUG-026 | HIGH | lodats | API ép `DAT_COC`/`DA_BAN` → `TAM_DUNG`; Lưu/công tắc ghi đè status thật trên map. | OPEN |
| BUG-027 | MEDIUM | lodats / customers | Ẩn khách không đóng map — lô vẫn hiện chủ đã xoá; không API gỡ chủ/xóa lô. | OPEN |
| BUG-028 | MEDIUM | lodats | Admin đổi chủ không bắt khách thuộc NV giữ luồng — gán nhầm Person sang lô NV khác. | FIXED |
| BUG-029 | MEDIUM | lodats | Unique SQL 1 luồng/NV/kho không khớp Prisma/`create` (chỉ map active); không đóng luồng. | OPEN |
| BUG-030 | MEDIUM | lodats | API nhận DT/MT âm; Zod/FE `nonnegative` — lệch frontend/backend. | FIXED |
| BUG-031 | MEDIUM | lodats / web | Dropdown «Tất cả trạng thái» không gửi `includePaused`; API mặc định chỉ `DANG_BAN`. | FIXED |
| BUG-032 | MEDIUM | lodats / customers | `lodatCount` đếm mọi map active; STAFF `listForCustomer` chỉ lô mình tạo. | FIXED |
| BUG-033 | LOW | lodats / db | Không CHECK XOR `addressId`/`projectLotId` — hàng lô không hợp lệ vẫn lưu được. | CLOSED |
| BUG-034 | MEDIUM | lodats | `create()` commit lô trước copy ảnh chat; lỗi copy → 500 nhưng lô đã tồn tại (retry trùng dân). | OPEN |
| BUG-032 | MEDIUM | lodats / customers | `lodatCount` đếm mọi map active; STAFF `listForCustomer` chỉ lô mình tạo. | OPEN |
| BUG-033 | LOW | lodats / db | Không CHECK XOR `addressId`/`projectLotId` — hàng lô không hợp lệ vẫn lưu được. | OPEN |
| BUG-034 | MEDIUM | lodats | `create()` commit lô trước copy ảnh chat; lỗi copy → 500 nhưng lô đã tồn tại (retry trùng dân). | FIXED |
| BUG-035 | HIGH | lot-shares | Middleware ghi cookie `?share=` đúng format dù resolve 404 — ghi đè last-click; `employeeId` rỗng reset hạn 30 ngày. | OPEN |
| BUG-034 | MEDIUM | lodats | `create()` commit lô trước copy ảnh chat; lỗi copy → 500 nhưng lô đã tồn tại (retry trùng dân). | OPEN |
| BUG-035 | HIGH | lot-shares | Middleware ghi cookie `?share=` đúng format dù resolve 404 — ghi đè last-click; `employeeId` rỗng reset hạn 30 ngày. | FIXED |
| BUG-036 | HIGH | lot-shares | Không API xóa/sửa/xoay mã share; gỡ publish / disable NV chỉ ẩn resolve; publish lại mã cũ còn hiệu lực. | OPEN |
| BUG-036 | HIGH | lot-shares | Không API xóa/sửa/xoay mã share; gỡ publish / disable NV chỉ ẩn resolve; publish lại mã cũ còn hiệu lực. | CLOSED |
| BUG-037 | MEDIUM | lot-shares | `POST /public/page-views` tin `shareCode` client — thao túng thống kê không cần cookie. | OPEN |
| BUG-037 | MEDIUM | lot-shares | `POST /public/page-views` tin `shareCode` client — thao túng thống kê không cần cookie. | FIXED |
| BUG-038 | MEDIUM | lot-shares | `POST …/visit` tăng `visitCount` không check `isActive`; listing gỡ vẫn +1 rồi 404. | OPEN |
| BUG-038 | MEDIUM | lot-shares | `POST …/visit` tăng `visitCount` không check `isActive`; listing gỡ vẫn +1 rồi 404. | CLOSED |
| BUG-039 | MEDIUM | lot-shares | `resolve` đòi SĐT; `findActiveShare` (đếm view) không — NV mất SĐT vẫn nhận thống kê, khách không thấy liên hệ. | FIXED |
| BUG-040 | LOW | lot-shares | `GET /public/lot-shares/:code` trả `employeeId` + `visitCount` (không cần để hiện SĐT). | FIXED |
| BUG-041 | HIGH | customers / messenger | `sortOrder` = chỉ số batch lần quét (≤200); quét lại cửa sổ khác làm loạn thứ tự tin. | OPEN (deferred) |
| BUG-042 | HIGH | customers / messenger | API cắt im lặng còn 200 tin; scanner cũ giữ 500 — mất tin không báo. | FIXED |
| BUG-043 | HIGH | customers / messenger | Không unique `externalMessageId`; khóa fallback gộp/trùng tin (đặc biệt tin chỉ ảnh). Extension gửi bubble không mid (`orphan::`) — **để khi làm extension**. | OPEN |
| BUG-044 | MEDIUM | customers / messenger | Trùng khóa yếu: body dài hơn ghi đè; ảnh chỉ thêm khi số URL tăng. | FIXED |
| BUG-045 | MEDIUM | customers / messenger | Scan lại có tên Facebook không cập nhật `Customer.fullName` (chỉ `facebookName`). | CLOSED |
| BUG-046 | MEDIUM | customers / messenger | `GET …/messages` không phân trang; `sentAt` không ghi; chi tiết khách không hiện chat. | CLOSED |
| BUG-047 | HIGH | public-content / dashboard | Tổng quan + `/dashboard/lo-dat` cắt 200 lô Mở bán; nút «Đăng lô» chỉ 8 listing gần nhất. | FIXED |
| BUG-048 | HIGH | addresses / lodats | Không API/UI thêm–sửa–xoá `ProjectLot` (kho); domain bắt Admin quản kho. | FIXED |
| BUG-049 | HIGH | transactions / permission | Admin tạo GD trên lô NV: `createdByEmployeeId` = Admin; unique GD mở chặn NV. | FIXED |
| BUG-050 | HIGH | title-services / permission | Admin tạo sổ đỏ trên khách NV: `createdByEmployeeId` = Admin; NV không thấy hồ sơ. | FIXED |
| BUG-051 | MEDIUM | transactions | List GD không phân trang; `total` = số hàng load; Admin UI không lọc NV. | OPEN |
| BUG-052 | MEDIUM | title-services | List sổ đỏ `take: 500`, `total: items.length` — cắt im lặng. | FIXED |
| BUG-053 | MEDIUM | addresses | List địa chỉ `take: 500`, `total: items.length` — picker/sổ thiếu địa chỉ cũ. | FIXED |
| BUG-054 | MEDIUM | transactions / title-services | `nextCode()` đọc max rồi +1, không khóa — race trùng `code` unique → 500. | OPEN |
| BUG-055 | MEDIUM | customers | Lọc tài chính theo khoảng vẫn khớp khách «Chưa xác định» (min/max null). | FIXED |
| BUG-056 | MEDIUM | public-content | Không PATCH nội dung bài; sửa = `POST` bài mới (slug-2) — dễ hai bài published. | OPEN |
| BUG-057 | MEDIUM | addresses | Đổi `PROJECT` → `REGULAR` không kiểm kho `ProjectLot` — picker kho chết, lô cũ còn. | OPEN |
| BUG-058 | MEDIUM | transactions / lodats | Form tạo GD (không `?lodatId`) picker tối đa 200 lô — lô cũ không chọn được. | FIXED |
| BUG-059 | HIGH | lodats / transactions | Đổi chủ khi GD mở: TX vẫn trỏ map cũ; unique khóa lô; xóa GD sửa map inactive. | OPEN |
| BUG-060 | HIGH | lodats / transactions | Xóa ảnh lô không đếm `TransactionSnapshotImage` — xóa R2, ảnh GD gãy. | OPEN |
| BUG-061 | HIGH | addresses / lodats / public / transactions | Xóa ảnh dự án luôn xóa R2, không đếm ref — gãy gallery lô, web khách, snapshot GD. | CLOSED (by design) |
| BUG-062 | MEDIUM | lodats / public-content | Sửa tiêu đề/địa chỉ lô CRM không ghi overlay listing; catalog lẫn copy cũ + DT/ảnh mới. | OPEN |
| BUG-063 | MEDIUM | customers / lodats / transactions / title-services / messenger | Ẩn Person không lan: map/GD/sổ đỏ/chat API vẫn dùng khách đã xóa mềm. | OPEN |
| BUG-064 | MEDIUM | users / FK | Xóa User không đếm care note / tiến độ sổ đỏ / view file — Prisma Restrict 500. | OPEN |
| BUG-065 | MEDIUM | customers / messenger / users | Ingest tin `employeeFacebookUid` không khớp profile NV; không API gắn UID NV. | OPEN |
| BUG-066 | HIGH | public-content / slug | Slug lô từ editor/GPT lưu raw — không `toPublicSlug` (dấu, hoa, khoảng, `/`). | OPEN |
| BUG-067 | HIGH | public-content / slug | `uniqueSlug` không chừa `PublicLotSlugRedirect.fromSlug` — listing mới chiếm URL đang 301. | OPEN |
| BUG-068 | HIGH | public-content / hub | Hub `/xa/…` tính lúc đọc, đổi khi tập lô đổi; không bảng 301. | OPEN |
| BUG-069 | HIGH | public-content / hub | Hub slug chi tiết (mọi `isPublished`) ≠ catalog/sitemap (chỉ Mở bán) → link nội bộ 404. | OPEN |
| BUG-070 | HIGH | public-content / ISR | Revalidate không gồm `/xa/…`; Tạm dừng / sửa địa chỉ không gọi revalidate catalog/sitemap. | OPEN |
| BUG-071 | MEDIUM | public-content / sitemap | Sitemap luôn emit 6 URL chuyên mục bài (kể cả 0 bài); trang vẫn `index`. | OPEN |
| BUG-072 | HIGH | public web / sitemap | Guest fetch nuốt lỗi API → sitemap/catalog rỗng; chi tiết slug thành 404 giả. | OPEN |
| BUG-073 | MEDIUM | public-content / redirect | 301 lot slug không kiểm `isPublished` / Mở bán — trỏ tới 404 hoặc BUG-023. | OPEN |
| BUG-074 | MEDIUM | public-content / redirect | Xóa lô cascade listing, không xóa `PublicLotSlugRedirect` — 301 mồ côi. | OPEN |
| BUG-075 | MEDIUM | public web / OG | `/og-default.png` không có trong `apps/web/public` — OG/Twitter/JSON-LD fallback 404. | OPEN |
| BUG-076 | MEDIUM | public web / canonical | `[category]` không hợp lệ: metadata noindex nhưng không gỡ canonical trang chủ. | OPEN |
| BUG-077 | MEDIUM | public-content / hub | Hai địa chỉ khác nhau `toPublicSlug` trùng → một hub URL, trộn listing. | OPEN |
| BUG-078 | MEDIUM | public-content / metadata | `title` / `seoTitle` không unique — hai lô/bài trùng document title. | OPEN |
| BUG-079 | LOW | public web | `getProductBySlug` mock đè gallery/mô tả listing thật nếu trùng slug demo. | OPEN |
| BUG-080 | LOW | public-content / slug | Slug lô `toPublicSlug(..., 0)` không cắt độ dài; title+location → URL cực dài. | OPEN |
| BUG-081 | MEDIUM | public web / metadata | `<title>` trang chủ lặp «An Hưng Land» hai lần (live). | OPEN |
| BUG-082 | MEDIUM | public web / CRM | `/dashbroad` (alias gõ sai) trả HTTP 200 cache, không redirect `/dashboard`. | OPEN |
| BUG-083 | MEDIUM | web authz | STAFF mở `/quan-tri/khach-hang` thấy stub «Registry ADMIN»; không redirect. | FIXED |

## Danh sách bug

### BUG-001 — Access JWT không phản ánh user hiện tại trên DB

- **Severity:** HIGH
- **Module:** auth / users
- **File:** `apps/api/src/modules/auth/jwt.strategy.ts`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/users/users.service.ts`, `apps/api/src/common/guards/roles.guard.ts`
- **Function:** `JwtStrategy.validate`, `UsersService.update` / `resetPassword` / `remove`, `RolesGuard.canActivate`
- **Vị trí code:** `JwtStrategy.validate` chỉ copy `sub` / `username` / `role` từ payload, không `findUnique` User. `RolesGuard` và `assertCanAccess*` tin `request.user.role` từ JWT. `update` chỉ `revokeRefreshTokens` khi `isActive === false`; đổi `role` không revoke. `resetPassword` / `remove` revoke refresh nhưng không làm access JWT hết hạn.
- **Problem:** Access token (mặc định `JWT_ACCESS_EXPIRES_IN` = `15m`) vẫn dùng được sau khi Admin khóa, xóa, hạ STAFF, hoặc reset mật khẩu. User bị hạ ADMIN→STAFF vẫn gọi endpoint `@Roles('ADMIN')` và thấy toàn bộ khách/lô vì service so `user.role === 'ADMIN'` trên JWT. `/auth/me` và `refresh` mới kiểm tra `isActive`.
- **Root cause:** Passport JWT không load user từ Postgres; role nằm trong token; không có denylist access token; đổi role không thu hồi refresh.
- **Impact:** Cửa sổ tối đa ~15 phút (hoặc TTL prod) sau khi thu hồi quyền. Session cũ sau reset MK vẫn gọi API. Disable user không đá phiên đang mở cho đến khi access hết hạn hoặc reload gọi `/auth/me`.
- **Evidence:** `jwt.strategy.ts` `validate()` return payload. `users.service.ts` `update()` revoke refresh chỉ trong nhánh `dto.isActive === false`. `auth.service.ts` `me()` mới check `isActive`. Các controller customers/lodats/transactions/title-services không check `isActive`.
- **Status:** FIXED (2026-09-04) — `JwtStrategy.validate` load User từ DB (`isActive` + role hiện tại); claim `sv` khớp `User.sessionVersion`; bump version + revoke refresh khi khóa / đổi role / reset MK.
- **Fix:** `jwt.strategy.ts`, `auth.service.ts`, `users.service.ts`, migration `20260904100000_user_session_version`.

### BUG-002 — Username unique case-sensitive, login case-insensitive

- **Severity:** HIGH
- **Module:** users / auth
- **File:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/auth/auth.service.ts`, `apps/api/src/modules/users/users.service.ts`, `apps/api/src/modules/users/dto/user-admin.dto.ts`
- **Function:** `AuthService.login`, `UsersService.create`
- **Vị trí code:** `User.username String @unique` (Postgres mặc định phân biệt hoa/thường). `login` dùng `findFirst({ username: { equals: trim, mode: 'insensitive' } })` không `orderBy`. `create` `trim()` username, không lowercase.
- **Problem:** Có thể tạo hai user `Admin` và `admin`. Login không biết bản ghi nào được chọn; mật khẩu đúng của user A có thể 401 nếu `findFirst` trúng user B.
- **Root cause:** Unique constraint và lookup không cùng quy tắc so khớp.
- **Impact:** Trùng tài khoản; đăng nhập nhầm/thất bại; Admin tạo user với username khác hoa-thường của user đã có.
- **Evidence:** Schema `@unique` trên `String`. `AuthService.login` `mode: 'insensitive'`. `CreateUserDto` cho phép `[a-zA-Z0-9._-]`.
- **Status:** FIXED (2026-09-04) — username luôn lowercase khi create/update/login; migration lower existing; login `findUnique` theo username đã chuẩn hóa.
- **Fix:** `auth.service.ts`, `users.service.ts`, migration `20260904101000_user_username_lowercase`.

### BUG-003 — STAFF tạo share-link theo slug không cần sở hữu lô

- **Severity:** HIGH
- **Module:** lot-shares / permission
- **File:** `apps/api/src/modules/lot-shares/lot-shares.service.ts`, `apps/api/src/modules/public-content/public-listings.controller.ts`
- **Function:** `LotSharesService.createOrGetShareLinkBySlug`, `PublicListingsController.createShareLink`
- **Vị trí code:** `POST /public/listings/:slug/share-link` — `@Roles('ADMIN', 'STAFF')`. `createOrGetShareLinkBySlug` chỉ load listing theo slug + `isPublished`, không so `createdByEmployeeId`. Khác với `createOrGetShareLink(lodatId)` có check ownership.
- **Problem:** Nhân viên bất kỳ (JWT STAFF) gọi trực tiếp API với slug lô đã publish của NV khác sẽ nhận `shareCode` gắn `employeeId` của mình. Guest mở `?share=` thấy SĐT/tên của NV gọi API, không phải chủ lô.
- **Root cause:** Hai đường tạo share không cùng rule; đường slug bỏ ownership.
- **Impact:** Lấy lead / thống kê view của lô người khác; vượt UI (UI có thể chỉ hiện nút trên lô của mình).
- **Evidence:** `createOrGetShareLink` (khoảng dòng 35–37) so role/owner; `createOrGetShareLinkBySlug` (51–60) không so. Controller `public-listings.controller.ts` `createShareLink`.
- **Status:** CLOSED (by design, 2026-09-04) — Owner: listing đã **publish** thì mọi NV login được tạo `shareCode` riêng; khách mở link share của B thấy bài + **hotline của B** (không phải chủ lô A). Đã revert check ownership trên đường slug (fix nhầm lúc coi là bug).
- **Note:** Đường CRM theo `lodatId` vẫn check sở hữu (share từ hồ sơ lô của mình) — khác use-case trang công khai.

### BUG-004 — Login enumeration username đang hoạt động (timing)

- **Severity:** MEDIUM
- **Module:** auth
- **File:** `apps/api/src/modules/auth/auth.service.ts`
- **Function:** `AuthService.login`
- **Vị trí code:** Nếu `!user || !user.isActive` throw ngay, **không** `bcrypt.compare`. Chỉ user active mới chạy bcrypt.
- **Problem:** Thông báo lỗi giống nhau (“Tên đăng nhập hoặc mật khẩu không đúng”) nhưng thời gian phản hồi khác: user không tồn tại / đã khóa = nhanh; username đúng và đang hoạt động + sai MK = chậm (bcrypt cost 12).
- **Root cause:** Early return trước dummy hash compare.
- **Impact:** Đo thời gian (kèm brute-force username) suy ra tài khoản live. `@Throttle` login 10/60s làm chậm nhưng không xóa kênh timing.
- **Evidence:** `auth.service.ts` dòng 62–68; `BCRYPT_ROUNDS = 12` ở users.service (cùng bcryptjs).
- **Status:** FIXED (2026-09-04) — luôn `bcrypt.compare` với hash thật hoặc dummy hash khi user thiếu/inactive.
- **Fix:** `auth.service.ts` `login`.

### BUG-005 — Login không MaxLength mật khẩu; bcrypt + body 32MB

- **Severity:** MEDIUM
- **Module:** auth
- **File:** `apps/api/src/modules/auth/dto/auth.dto.ts`, `apps/api/src/main.ts`
- **Function:** `LoginDto`, `bootstrap` `useBodyParser`
- **Vị trí code:** `LoginDto.password` chỉ `@IsString() @MinLength(1)`. `CreateUserDto` / `ResetUserPasswordDto` có `@MaxLength(128)`. `main.ts` JSON limit `'32mb'`.
- **Problem:** `POST /auth/login` nhận mật khẩu cực lớn rồi `bcrypt.compare`. CPU tăng mạnh; kết hợp throttle 10/phút/IP vẫn có thể làm nặng worker.
- **Root cause:** DTO login không cùng bound với create/reset; body parser quá rộng cho endpoint auth.
- **Impact:** DoS CPU API.
- **Evidence:** `auth.dto.ts` `LoginDto`; `main.ts` `bodyParser: json limit 32mb`; `auth.service.ts` `bcrypt.compare(dto.password, user.passwordHash)`.
- **Status:** FIXED (2026-09-04) — `LoginDto.password` giới hạn độ dài; username `@MaxLength(40)`. Policy mật khẩu hệ thống: **6–18** ký tự (2026-09-04, theo owner).
- **Fix:** `auth.dto.ts`; sau đó đồng bộ create/reset/shared/UI → max **18**.

### BUG-006 — Refresh rotation không phát hiện reuse

- **Severity:** MEDIUM
- **Module:** auth
- **File:** `apps/api/src/modules/auth/auth.service.ts`
- **Function:** `AuthService.refresh`
- **Vị trí code:** Token hết hạn/revoked → `UnauthorizedException`. Không revoke các refresh còn lại của cùng user khi token đã `revokedAt` bị gửi lại.
- **Problem:** Sau khi refresh, token cũ bị `revokedAt`. Kẻ cầm bản sao token cũ bị 401 nhưng phiên mới (token vừa rotate) vẫn sống. Best practice rotation: reuse token đã revoke ⇒ hủy cả family.
- **Root cause:** Chỉ check revoked rồi throw; không `revokeRefreshTokens(userId)`.
- **Impact:** Refresh token lộ (log, XSS, backup) vẫn dùng được đến khi hết hạn 7 ngày nếu attacker refresh trước victim; reuse sau rotate không giết session mới.
- **Evidence:** `refresh()` dòng 84–96: `if (!stored || stored.revokedAt || expired) throw`; không nhánh reuse.
- **Status:** FIXED (2026-09-04) — reuse refresh đã `revokedAt` → revoke mọi refresh còn lại + bump `sessionVersion` (hủy luôn access JWT).
- **Fix:** `auth.service.ts` `refresh` / `revokeAllSessions`.

### BUG-007 — Access/refresh token trong localStorage

- **Severity:** MEDIUM
- **Module:** auth / web / extension
- **File:** `apps/web/src/shared/api/client.ts`, `apps/web/src/features/auth/auth-context.tsx`, `apps/extension/src/background/service-worker.ts`
- **Function:** `setTokens` / `getAccessToken` / `getRefreshToken`
- **Vị trí code:** `localStorage` keys `crmanhung_access_token`, `crmanhung_refresh_token`. Extension: `chrome.storage.local` `crmanhung_ext_*`. User object thêm `sessionStorage` `crmanhung_session_user`.
- **Problem:** Mọi XSS trên origin CRM đọc được cả cặp token (refresh 7 ngày). Không dùng cookie HttpOnly.
- **Root cause:** Bearer token do JS lưu, không cookie + CSRF token.
- **Impact:** Một lỗ XSS = chiếm session STAFF/ADMIN đến khi refresh hết hạn hoặc Admin disable (và vẫn còn cửa sổ access — BUG-001).
- **Evidence:** `client.ts` `ACCESS_KEY` / `REFRESH_KEY`. `auth-context.tsx` `setTokens` sau login.
- **Status:** FIXED (2026-09-04) — Refresh → cookie HttpOnly `crmanhung_refresh` (path `/api/v1/auth`); access chỉ memory; xóa legacy localStorage; web `credentials: 'include'`. Extension vẫn Bearer + `chrome.storage`.
- **Fix:** `auth-cookies.ts`, `auth.controller.ts`, `client.ts`, `auth-context.tsx`, Next rewrite `/api/v1`.

### BUG-008 — STAFF phân biệt 403/404 trên bản ghi của NV khác

- **Severity:** MEDIUM
- **Module:** customers / lodats / transactions / title-services
- **File:** `apps/api/src/modules/customers/customers.service.ts`, `apps/api/src/modules/customers/customers-view.ts`, `apps/api/src/modules/lodats/lodats.service.ts`, `apps/api/src/modules/transactions/transactions.service.ts`, `apps/api/src/modules/title-services/title-services.service.ts`
- **Function:** `getById` / `assertCanAccess*`
- **Vị trí code:** Không tìm thấy → `NotFoundException`. Tìm thấy nhưng `employeeId !== user.id` và không phải ADMIN → `ForbiddenException`. `LotSharesService.createOrGetShareLink` dùng 404 cho cả hai trường hợp — không nhất quán.
- **Problem:** STAFF gọi `GET /customers/:id` (hoặc lô/GD/sổ đỏ) với ID đoán được: 404 = không có, 403 = có nhưng của người khác. Không đọc được nội dung, nhưng liệt kê được ID tồn tại.
- **Root cause:** Check tồn tại rồi mới check quyền, map sang 403.
- **Impact:** Dò ID khách/lô của NV khác. Không vượt quyền đọc field.
- **Evidence:** `customers.service.ts` `getById`: `if (!row) NotFound` rồi `assertCanAccess` → `ForbiddenException('Không có quyền xem khách này')`. Lodats `getById` cùng pattern.
- **Status:** FIXED (2026-09-04) — ownership fail → `NotFoundException` (giống ID không tồn tại) trên customers / lodats / transactions / title-services / public-content lodat access.
- **Fix:** `customers-view.ts` `assertCanAccess`; `lodats` / `transactions` / `title-services` / `public-content` assert helpers.

### BUG-009 — STAFF đọc địa chỉ / đơn vị hành chính đã ẩn

- **Severity:** MEDIUM
- **Module:** addresses / permission
- **File:** `apps/api/src/modules/addresses/addresses.controller.ts`, `apps/api/src/modules/addresses/admin-units.controller.ts`
- **Function:** `AddressesController.list`, `AdminUnitsController.listProvinces` / `listDistricts` / `listWards`
- **Vị trí code:** GET không `@Roles('ADMIN')`. Query `includeHidden=1|true` được `includeHiddenFlag` bật cho mọi user đã login. POST/PATCH/DELETE địa chỉ mới `@Roles('ADMIN')`.
- **Problem:** UI quản lý địa chỉ chỉ Admin; STAFF vẫn `GET /addresses?includeHidden=true` và `GET /admin-units/provinces?includeHidden=true`.
- **Root cause:** Đọc (kể cả bản ẩn) không phân quyền; chỉ ghi là ADMIN.
- **Impact:** Nhân viên thấy địa chỉ Admin đã ẩn (có thể dùng khi tạo lô). Không sửa/xóa được qua API ghi.
- **Evidence:** `addresses.controller.ts` `list` không RolesGuard; `includeHiddenFlag`. `admin-units.controller.ts` GET không guard, POST có `@Roles('ADMIN')`. Web `address-book-page.tsx` redirect STAFF — chỉ UI.
- **Status:** FIXED (2026-09-04) — `includeHidden` chỉ hiệu lực khi `role === ADMIN`; STAFF luôn nhận list không ẩn.
- **Fix:** `addresses.controller.ts`, `admin-units.controller.ts`.

### BUG-010 — Bảo vệ Admin cuối cùng không atomic

- **Severity:** MEDIUM
- **Module:** users
- **File:** `apps/api/src/modules/users/users.service.ts`
- **Function:** `update`, `remove`
- **Vị trí code:** `count` Admin active rồi `update`/`delete` ngoài transaction/lock.
- **Problem:** Hai request song song hạ quyền hoặc khóa hai Admin cuối (count đều = 2) đều pass, hệ thống còn 0 Admin active.
- **Root cause:** TOCTOU; không `SERIALIZABLE` / row lock.
- **Impact:** Mất hết Admin; không còn ai vào `/users`. Cần hai Admin + hai request trùng thời điểm.
- **Evidence:** `update()` khối `adminCount <= 1` rồi `prisma.user.update` riêng. `remove()` cùng pattern.
- **Status:** CLOSED (won't fix, 2026-09-04) — Owner: với An Hưng Land không xảy ra được; bỏ qua, không sửa.

### BUG-011 — Chính sách mật khẩu yếu

- **Severity:** LOW
- **Module:** users / auth
- **File:** `apps/api/src/modules/users/dto/user-admin.dto.ts`, `packages/shared/src/auth.ts`
- **Function:** `CreateUserDto`, `ResetUserPasswordDto`, `userPasswordSchema`
- **Vị trí code:** `@MinLength(6)` / `z.string().min(6)` — không chữ hoa, số, ký tự đặc biệt. Login không thêm rule (chỉ khác rỗng).
- **Problem:** Admin có thể đặt MK 6 ký tự dễ đoán. bcrypt 12 không bù policy yếu.
- **Root cause:** Contract cố ý min 6.
- **Impact:** Brute-force / credential stuffing dễ hơn; login throttle 10/phút/IP hạn chế một phần.
- **Evidence:** `user-admin.dto.ts` password min 6 max **18** (owner 2026-09-04); `auth.ts` `userPasswordSchema`. Vẫn không bắt chữ hoa/số/ký tự đặc biệt.
- **Status:** FIXED (2026-09-04) — Create/reset: giữ 6–18; bắt buộc ≥1 chữ cái + ≥1 chữ số (`userPasswordSchema` + DTO `Matches` + UI). Login không thêm rule. Không bắt ký tự đặc biệt / chữ hoa (vừa đủ cho CRM nội bộ).

### BUG-012 — Phân quyền CRM trên UI chỉ chạy client

- **Severity:** LOW
- **Module:** web authz
- **File:** `apps/web/src/shared/ui/layout.tsx`, `apps/web/src/features/users/user-admin-page.tsx`, `apps/web/src/features/public-content/components/dashboard-shell.tsx`, `apps/web/app/(crm)/layout.tsx`
- **Function:** `AppShell`, `UserAdminPage`, `DashboardShell`
- **Vị trí code:** `(crm)/layout.tsx` không đọc cookie/JWT phía server. `AppShell` `useEffect` redirect `/login` nếu không có user. Trang người dùng redirect STAFF về `/khach-hang`. Menu Admin ẩn theo `user.role` từ `/auth/me` + `sessionStorage`.
- **Problem:** Guest/STAFF vẫn tải JS/HTML các route `/quan-tri/nguoi-dung`, `/dashboard/bai-viet`. Sửa `sessionStorage` `crmanhung_session_user.role` có thể hiện menu Admin. **API vẫn 403** (`UsersController` `@Roles('ADMIN')`).
- **Root cause:** Không có middleware Next chặn CRM theo session; JWT không cookie nên server component không thấy user.
- **Impact:** Không lộ danh sách user qua API. Lộ cấu trúc UI admin. Khớp nguyên tắc “ẩn nút không phải bảo mật” — ghi nhận lệch frontend vs backend.
- **Evidence:** `layout.tsx` (crm) chỉ `AppShell`. `user-admin-page.tsx` check `user.role !== ADMIN` rồi `router.replace`. `GET /users` `@Roles('ADMIN')` + `RolesGuard` trên controller.
- **Status:** FIXED (2026-09-04) — Cookie HttpOnly `crmanhung_web_role` (path `/`) set lúc login/refresh/`me`; Next middleware điều phối: guest → `/login`, STAFF khỏi `/quan-tri`/`/cai-dat`/dashboard admin → `/khach-hang` hoặc `/dashboard/lo-dat`. API vẫn là tường thật. Client redirect giữ lớp phụ.

### BUG-013 — Cùng người Facebook tạo được nhiều Customer

- **Severity:** HIGH
- **Module:** customers / extension
- **File:** `apps/api/src/modules/customers/from-extension.service.ts`, `apps/api/src/modules/customers/from-extension-parse.ts`, `apps/api/prisma/schema.prisma`
- **Function:** `FromExtensionService.findExisting` / `createCustomer`, `parseScan`
- **Vị trí code:** `CustomerFacebook.customerUid` / `threadId` chỉ `@@index`, không unique. `findExisting` scoped `employeeId`: ưu tiên `threadId`, sau đó `customerUid`, `orderBy createdAt desc`. `parseScan`: non-e2ee `customerUid = rawUid || threadId`; e2ee chỉ `rawUid`. `touchExisting` ghi `threadId: fields.threadId || fb.threadId` (đè thread cũ).
- **Problem:** Một người thật có thể thành nhiều Person: (1) quét e2ee và Messenger thường (UID vs threadId-as-UID); (2) threadId đổi, lần sau không khớp thread cũ và UID trống; (3) hai ingest song song không unique; (4) cùng UID hai NV = hai Customer (cố ý theo NV). Scan thread mới cùng UID đè `threadId` rồi append tin — trộn hội thoại.
- **Root cause:** Không unique theo NV+page+UID/thread; heuristic UID = threadId; lookup không gộp e2ee/non-e2ee.
- **Impact:** Trùng hồ sơ, chat/chăm sóc/lô tách đôi; gộp tay dễ mất dữ liệu (BUG-016).
- **Evidence:** Code như trên. **Đối chiếu Postgres production 2026-09-04 (chỉ đọc):** ~1384 FB; đếm thô trùng UID cùng NV = 51 nhóm — trong đó **47 khác `employeeFacebookUid` (khác page) = đúng nghiệp vụ** (vd. Lê Tuấn Doanh: Page Bùi Xuân Khả vs Em Hà). **Còn 4 nhóm thật sự cùng NV + cùng UID + cùng page:** toàn **`buinam`**, nguồn `messenger_e2ee`, **khác `threadId`**, tạo 2026-05-29, đã có trong `migrate.legacy_id_map` (copy CRM cũ). `kha` = 0 case cùng-page. Trùng cùng `threadId` = 0. Owner: chưa rõ vì sao chỉ buinam; **note lại, xử lý sau** (chưa sửa code).
- **Status:** OPEN (deferred — 2026-09-04; scope còn lại ≈ 4 Person-pair `buinam` E2EE)

### BUG-014 — Trùng SĐT lúc tạo: OK ghi đè tên khách cũ

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/api/src/modules/customers/customers-phone.ts`, `apps/web/src/features/customers/customer-list-page.tsx`, `apps/web/src/features/customers/components/phone-duplicate-modal.tsx`
- **Function:** `acknowledgePhoneDuplicate`, `submitDuplicate`
- **Vị trí code:** `POST /customers` trùng SĐT → 409. UI mode `create`: confirm gọi `PATCH .../acknowledge-phone-duplicate` với `fullName` vừa gõ. API `update` `fullName`, `isHidden: false`, `autoRestoredAt: null`. Không tạo Customer mới.
- **Problem:** Hai người dùng chung một số (gia đình), hoặc NV gõ nhầm SĐT đã có: bấm OK **đổi tên** khách cũ thành tên mới và khôi phục nếu đang ẩn. Không có bước “giữ tên cũ / chỉ mở hồ sơ”.
- **Root cause:** Acknowledge = rename + unhide, tái sử dụng như “không tạo trùng”.
- **Impact:** Ghi đè danh tính Person; khách ẩn bị hiện lại với tên sai.
- **Evidence:** `customers-phone.ts` `acknowledgePhoneDuplicate`. `customer-list-page.tsx` `dup.mode === 'create'` → `acknowledgePhoneDuplicate(dup.existing.id, { fullName: dup.fullName \|\| existing })`. Modal: “bấm OK để cập nhật tên”.
- **Status:** OPEN (deferred — 2026-09-04; owner: để sau)

### BUG-015 — Sửa SĐT xóa mọi số phụ

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/api/src/modules/customers/customers-phone.ts`
- **Function:** `replaceCustomerPhone`
- **Vị trí code:** Sau khi đổi `phones[0]`, nếu `existing.phones.length > 1` thì `deleteMany` mọi `CustomerPhone` khác của khách.
- **Problem:** CRM cũ `tblPersonPhone` copy nhiều số / khách (`migrate-phones-from-legacy.ts`). UI/API hiện coi như 1 SĐT. PATCH `/customers/:id/phones` (menu Sửa SĐT) **xóa vĩnh viễn** các số còn lại.
- **Root cause:** Mô hình “một số” ép lên dữ liệu nhiều số; không merge/giữ số phụ.
- **Impact:** Mất SĐT sau migrate. Không hoàn tác.
- **Evidence:** `replaceCustomerPhone` khối `if (existing.phones.length > 1) deleteMany`. `addCustomerPhone` từ chối nếu đã có số. Schema `CustomerPhone` không unique, cho phép nhiều dòng.
- **Status:** FIXED (2026-09-04) — `replaceCustomerPhone` → `updateCustomerPhone` / `deleteCustomerPhone` theo `phoneId` (`PATCH|DELETE /customers/:id/phones/:phoneId`); không `deleteMany` số phụ. UI: modal quản lý danh sách SĐT (thêm/sửa/xoá). FAB chi tiết khách + FAB chủ lô + icon gọi mobile: 1 số → `tel:` thẳng; ≥2 → modal chọn số.
### BUG-016 — Gộp Facebook không chuyển hết quan hệ Person

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/api/src/modules/customers/customers-phone.ts`, `apps/api/prisma/schema.prisma`
- **Function:** `mergeFacebookIntoPhoneHolder`
- **Vị trí code:** Transaction: chuyển `CustomerFacebook.customerId`, `CustomerCareNote`, một phần `LodatCustomerMap`; `delete` Customer nguồn. Không chuyển `CustomerPhone` nguồn (Cascade xóa). `TransactionParty.customerId` `onDelete: SetNull`. `TitleService.customerId` `onDelete: Restrict`. Map trùng `lodatId` với đích: `deleteMany` map nguồn (mất giá/lịch sử nguồn trên lô đó).
- **Problem:** Gộp FB → hồ sơ có SĐT: (1) SĐT trên hồ sơ FB bị mất; (2) party giao dịch mất liên kết Person; (3) nguồn có hồ sơ sổ đỏ → Prisma Restrict, merge fail 500, không gộp được; (4) hai map cùng lô thì xóa map nguồn.
- **Root cause:** Merge chỉ chuyển FB + care + map còn lại; không xử lý TitleService / phone / party; xóa map overlap.
- **Impact:** Mất dữ liệu hoặc không gộp được khi Person đã có sổ đỏ/GD. Hai Person vẫn tồn tại nếu Restrict.
- **Evidence:** `mergeFacebookIntoPhoneHolder` dòng 383–411. Schema TitleService Restrict; TransactionParty SetNull; CustomerPhone Cascade.
- **Status:** OPEN — **DEFERRED (owner 2026-09-05):** bàn kỹ / chốt thiết kế sau; **không sửa code** cho đến khi owner chốt. Ghi chú bàn: merge đúng nghĩa = gắn FB + quan hệ vào Person đích (có SĐT), rồi mới xóa Person nguồn rỗng — không tạo Person mới. Cần chốt trước khi code: (1) SĐT nguồn trùng đích; (2) map trùng lô + GD; (3) BUG-017 đã chốt FIXED riêng: Admin không gộp; chỉ NV gộp khách mình.

### BUG-017 — Admin gộp Facebook xuyên nhân viên

- **Severity:** HIGH
- **Module:** customers / permission
- **File:** `apps/api/src/modules/customers/customers-phone.ts`
- **Function:** `mergeFacebookIntoPhoneHolder`
- **Vị trí code:** `assertCanAccess` nguồn và đích. ADMIN luôn pass dù `source.employeeId !== target.employeeId`. Không so hai NV. STAFF chỉ gộp trong hồ sơ mình.
- **Problem:** `POST /customers/merge-facebook-into-phone-holder` với JWT Admin: chuyển Facebook (chat, UID) sang Customer của NV khác rồi xóa Person nguồn.
- **Root cause:** Ownership merge = quyền xem cả hai, không = cùng sales.
- **Impact:** Hồ sơ/chat/lead gán nhầm NV; Person nguồn biến mất.
- **Evidence:** `assertCanAccess` ADMIN return sớm. Không có `source.employeeId === target.employeeId`.
- **Status:** FIXED (2026-09-05) — Owner chốt: Admin không gộp (không có khách). Chỉ NV gộp khách của mình. `mergeFacebookIntoPhoneHolder`: Forbidden nếu ADMIN; bắt `source.employeeId === target.employeeId === user.id`. `mergeAllowed` trên trùng SĐT = false với Admin. UI không mở chế độ gộp cho Admin.

### BUG-018 — SĐT không unique trên DB, không chuẩn hóa

- **Severity:** HIGH
- **Module:** customers
- **File:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/customers/customers-phone.ts`, `apps/api/scripts/migrate-phones-from-legacy.ts`
- **Function:** `findByPhoneForEmployee`, `createManualCustomer`, migrate phones
- **Vị trí code:** `CustomerPhone.phone` chỉ `@@index`, không `@@unique([customerId, phone])` hay unique theo NV. Duplicate check `phones: { some: { phone } }` exact sau trim/DTO digits. Create: check rồi `create` ngoài unique constraint. Migrate: `String(row.Phone).trim()` không `replace(/\D/g)` / không ép `0xxxxxxxxx`.
- **Problem:** (1) Hai POST tạo cùng lúc cùng NV + cùng số → hai Person. (2) Số migrate `"0912 345 678"` / `+84…` không khớp số mới `0912345678` → tạo Person thứ hai. (3) Cùng số hai NV = hai Customer (migrate ghi rõ giữ nguyên — đúng theo NV, nhưng không có registry chống trùng toàn hệ).
- **Root cause:** Unique chỉ trong code; format SĐT không một chuẩn.
- **Impact:** Trùng Person; tìm/gộp SĐT miss.
- **Evidence:** Schema `CustomerPhone`. `createManualCustomer` 113–131. `migrate-phones-from-legacy.ts` comment “Duplicate numbers across employees are kept as-is” + trim only.
- **Status:** FIXED (2026-09-05) — Owner: unique theo NV, không unique toàn hệ. `CustomerPhone.employeeId` + `@@unique([employeeId, phone])` + `@@unique([customerId, phone])`. Mọi ghi SĐT qua `digitsFromPhoneRaw` → `0`+9; DTO + service + migrate legacy. Race `P2002` → `409 PHONE_DUPLICATE`. Migration backfill/normalize idempotent.

### BUG-019 — Tìm Person bỏ Facebook UID/tên; SĐT có khoảng không khớp

- **Severity:** MEDIUM
- **Module:** customers
- **File:** `apps/api/src/modules/customers/customers.service.ts`, `apps/web/src/features/customers/components/filter-bar.tsx`
- **Function:** `CustomersService.list`
- **Vị trí code:** Keyword `OR`: `fullName`, `note` (cột dư tblPerson.Note), `phones.phone contains` raw, `careNotes`. Không `facebook.facebookName` / `customerUid` / `threadId`. Keyword không `replace(/\D/g)` trước khi so SĐT.
- **Problem:** Placeholder UI “Tìm tên, SĐT…” — gõ nick Facebook hoặc UID không ra. Gõ `0912 345 678` không `contains` `0912345678`.
- **Root cause:** Search list không cover kênh Facebook; không normalize phone.
- **Impact:** NV tạo thêm Person vì tưởng chưa có; miss khách FB-only.
- **Evidence:** `customers.service.ts` `list` khối keyword. `filter-bar.tsx` placeholder.
- **Status:** FIXED (2026-09-05) — Owner: tìm `facebookName` + `customerUid`; **không** `threadId`. SĐT: thêm nhánh `digitsFromPhoneRaw(keyword)`. Placeholder list cập nhật.

### BUG-020 — Không ràng buộc một chủ active trên một lô

- **Severity:** MEDIUM
- **Module:** lodats / mapping chủ đất
- **File:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/lodats/lodats.service.ts`
- **Function:** `LIST_INCLUDE.maps`, `changeOwner`
- **Vị trí code:** `LodatCustomerMap` `@@index([lodatId, isActive])` không unique. Include list: `maps where isActive take 1 orderBy updatedAt desc`. `changeOwner` `updateMany` active=false rồi `create` active — hai request song song → hai map active.
- **Problem:** “Chủ hiện tại” trên list/chi tiết có thể không phải map duy nhất; Person A/B cùng lúc isActive trên một lô. Merge xóa map overlap giả định tối đa một quan hệ nguồn/lô.
- **Root cause:** Thiếu unique partial index `lodatId WHERE isActive`.
- **Impact:** Sai chủ đất hiển thị; GD lấy `findFirst` active `orderBy updatedAt` — có thể lệch Person.
- **Evidence:** Schema `LodatCustomerMap`. `LIST_INCLUDE` take 1. `transactions.service.ts` `findFirst` `{ lodatId, isActive: true }`.
- **Status:** FIXED (2026-09-05) — Unique partial `LodatCustomerMap_lodatId_active_uidx` (đã có từ 20260824; migration ensure + dedupe). `changeOwner` bắt `P2002`. **Owner:** Admin **không** đổi chủ — chỉ NV giữ luồng (`canChangeOwner`); API `403` nếu ADMIN.

### BUG-021 — Extension cập nhật khách đã ẩn, không khôi phục

- **Severity:** MEDIUM
- **Module:** customers / extension
- **File:** `apps/api/src/modules/customers/from-extension.service.ts`
- **Function:** `findExisting`, `touchExisting`, `appendMessages`
- **Vị trí code:** `findExisting` không lọc `isHidden`. `touchExisting` / `appendMessages` không set `isHidden: false`. List mặc định `isHidden: false`.
- **Problem:** Khách xóa mềm vẫn nhận tin/ảnh scan mới; NV không thấy trên list trừ `@` / `@@`. Không `autoRestoredAt`.
- **Root cause:** Ingest không đụng cờ ẩn.
- **Impact:** Mất lead trên UI; dữ liệu vẫn ghi.
- **Evidence:** `findExisting` where chỉ `employeeId` + facebook thread/uid. `customers.service.ts` list `isHidden: false` mặc định.
- **Status:** FIXED (2026-09-05) — Giống CRM cũ: `touchExisting` nếu `isHidden` → `isHidden: false` + `autoRestoredAt`. List/chi tiết hangtag «Tự khôi phục» (`amber`) khi `autoRestoredAt`. Ẩn/khôi phục tay xoá `autoRestoredAt`.

### BUG-022 — Lệch contract/API: không sửa được `Customer.note`

- **Severity:** MEDIUM
- **Module:** customers
- **File:** `packages/shared/src/customers.ts`, `apps/api/src/modules/customers/dto/update-customer.dto.ts`, `apps/api/src/modules/customers/customers.service.ts`
- **Function:** `UpdateCustomerDto`, `CustomersService.update`
- **Vị trí code:** Shared `updateCustomerSchema` có `note`, `budgetMinVnd`, `budgetMaxVnd`. Nest `UpdateCustomerDto` chỉ `fullName`, `status`, `isPinned`, `isHidden`. `update()` không gán `note`. `forbidNonWhitelisted` → PATCH `note` = 400. Tạo khách có `note`; chi tiết UI không hiện `Customer.note` (chỉ care).
- **Problem:** Cột copy từ `tblPerson.Note` không sửa được qua API update; budget khách chỉ qua care-notes. Frontend/shared và backend lệch.
- **Root cause:** DTO Nest không implement đủ contract shared.
- **Impact:** Ghi chú Person cũ kẹt; client theo shared gửi `note` thì lỗi.
- **Evidence:** `update-customer.dto.ts` vs `updateCustomerSchema`. `customers.service.ts` `data` không có `note`.
- **Status:** FIXED (2026-09-05) — Owner: bỏ hẳn `Customer.note` (drop cột Prisma + migration). Modal thêm SĐT bỏ ô ghi chú. Contract create/update không còn `note`/budget trên khách; ghi chú + tài chính chỉ qua care-notes. Ô tìm không khớp cột dư. Migrate legacy không copy `tblPerson.Note`.

### BUG-023 — Chi tiết public theo slug không ẩn lô đã Tạm dừng

- **Severity:** HIGH
- **Module:** lodats / public-content
- **File:** `apps/api/src/modules/public-content/public-content.service.ts`
- **Function:** `getPublishedBySlug`, `loadPublishedCatalog`, `isOpenSale`
- **Vị trí code:** `getPublishedBySlug` chỉ `if (!row?.isPublished) 404`. `loadPublishedCatalog` lọc `rows.filter(isOpenSale)` (`maps[0].status === 'DANG_BAN'`). `updateSaleStatus` / `update` map không đụng `PublicLotListing.isPublished`.
- **Problem:** Domain `public-content.md`: khách thấy lô khi **Đăng web ∩ Mở bán**; `GET /public/listings/:slug` phải 404 nếu không Mở bán. List catalog đúng filter; mở URL slug vẫn trả listing đã Tạm dừng / `DAT_COC` (nếu `isPublished` còn true).
- **Root cause:** Chi tiết slug không gọi `isOpenSale`. Tạm dừng lô cố ý không auto-gỡ Đăng web, nhưng guest API chi tiết không áp cùng rule với list.
- **Impact:** Lô tạm dừng / không còn rao vẫn xem được trên web công khai nếu biết slug (SEO, share cũ, bookmark). List `/public/listings` thì ẩn.
- **Evidence:** `getPublishedBySlug` vs `loadPublishedCatalog`. `lodats.service.ts` `updateSaleStatus` chỉ `lodatCustomerMap.status` + `lodat.updatedAt`. `docs/domains/public-content.md` §3.1 / API GET slug.
- **Status:** OPEN

### BUG-024 — Không gỡ Đăng web được khi lô đã Tạm dừng

- **Severity:** HIGH
- **Module:** lodats / public-content
- **File:** `apps/api/src/modules/public-content/public-content.service.ts`
- **Function:** `setPublished`, `requireOpenLodat`
- **Vị trí code:** `setPublished` luôn `requireOpenLodat` trước khi `isPublished` true hay false. `requireOpenLodat` ném `BadRequestException('Chỉ đăng lô đang Mở bán.')` nếu `!isOpenSale`.
- **Problem:** Domain: Gỡ web = tắt `isPublished` tường minh; Tạm dừng không tự gỡ. NV tạm dừng rồi muốn Gỡ listing thì API từ chối vì lô không còn `DANG_BAN`. Phải bật lại Mở bán rồi mới gỡ được.
- **Root cause:** Cùng guard «chỉ lô đang mở bán» dùng cho cả Đăng và Gỡ.
- **Impact:** Không thu hồi trang công khai đã publish khi lô đang Tạm dừng, cộng BUG-023 (slug vẫn sống).
- **Evidence:** `setPublished(user, id, isPublished)` dòng đầu `requireOpenLodat`. `requireOpenLodat` + `isOpenSale`. Domain «Gỡ tường minh trên dashboard».
- **Status:** CLOSED (2026-09-05) — Owner: bỏ chức năng Gỡ Đăng web. API `setPublished(false)` → BadRequest; UI không còn nút Gỡ web. Khách thấy lô theo Đăng web ∩ Mở bán.

### BUG-025 — Xóa giao dịch mở ép map về Mở bán; tạo/sửa/hoàn tất GD không đổi trạng thái lô

- **Severity:** HIGH
- **Module:** lodats / transactions
- **File:** `apps/api/src/modules/transactions/transactions.service.ts`
- **Function:** `create`, `update`, `remove`
- **Vị trí code:** `create` / `update` không `lodatCustomerMap.update` status. `remove`: nếu GD còn `DA_COC`/`DA_CONG_CHUNG` thì `lodatCustomerMap.update({ status: 'DANG_BAN' })` theo `row.lodatCustomerMapId` lúc tạo GD.
- **Problem:** Tạo cọc / công chứng / hoàn tất không đổi `LodatCustomerMap.status` — lô vẫn `DANG_BAN` trên `/lo-dat` và (nếu đã Đăng web) trên catalog. Xóa GD mở thì ghi đè status map thành `DANG_BAN` kể cả NV đã Tạm dừng. Nếu đã `changeOwner`, FK map của GD là map **cũ** (`isActive: false`) — `remove` sửa lịch sử, không đụng chủ hiện tại.
- **Root cause:** Logic «mở bán lại khi xóa GD» còn sót; không đối xứng với create/complete; không kiểm tra map còn active / status hiện tại.
- **Impact:** Lô đang cọc/đã bán vẫn hiện Mở bán. Xóa GD có thể tự bật lại rao bán. Đổi chủ + xóa GD làm lệch lịch sử map cũ.
- **Evidence:** `transactions.service.ts` `create` data không có map status. `update` `transaction.update` chỉ cột GD. `remove` khối `OPEN_STATUSES` → `status: 'DANG_BAN'`. Domain lodats §3: đã cọc/đã bán thuộc GD, không phải công tắc list — nhưng `remove` vẫn ghi công tắc.
- **Status:** OPEN

### BUG-026 — Ép `DAT_COC`/`DA_BAN` thành Tạm dừng rồi Lưu/công tắc ghi đè DB

- **Severity:** HIGH
- **Module:** lodats
- **File:** `apps/api/src/modules/lodats/lodats.service.ts`, `apps/web/src/features/lodats/lodat-edit-page.tsx`, `apps/web/src/features/lodats/lodat-list-page.tsx`
- **Function:** `mapRow`, `update`, `updateSaleStatus`
- **Vị trí code:** `mapRow`: `rawStatus` khác `DANG_BAN`/`TAM_DUNG` → `'TAM_DUNG'`. Contract `lodatListingStatusSchema` chỉ hai giá trị. Form sửa gửi `input.status = mapForm.status` (đã bị ép). `update` ghi `mapData.status = dto.status`. Công tắc list `updateLodatSaleStatus` cũng chỉ hai enum.
- **Problem:** Schema/migrate giữ `DAT_COC`/`DA_BAN` trên map. API list/chi tiết báo `TAM_DUNG`. Lịch sử chủ (`ownerHistory.status`) vẫn raw. Bấm Lưu trên `/sua` hoặc công tắc Mở bán ghi đè status migrate thành `TAM_DUNG`/`DANG_BAN` — mất `DAT_COC`/`DA_BAN`.
- **Root cause:** Tầng list cố ý thu hẹp enum; form/công tắc round-trip status đã thu hẹp xuống DB.
- **Impact:** Copy CRM cũ: một lần sửa lô / gạt công tắc xóa trạng thái đã cọc/đã bán trên map. Filter mặc định (chỉ `DANG_BAN`) vốn ẩn các map này; sau khi Lưu chúng thành Tạm dừng thật và hiện khi `@`.
- **Evidence:** `mapRow` nhánh coerce. `lodat-edit-page.tsx` `handleSubmit` `input.status`. `UpdateLodatDto` `@IsIn(['DANG_BAN','TAM_DUNG'])`. Schema comment `DANG_BAN | TAM_DUNG | DAT_COC | DA_BAN`. `lodat-edit-owner-history.tsx` vẫn nhãn Đã cọc/Đã bán từ `ownerHistory`.
- **Status:** OPEN

### BUG-027 — Ẩn khách (xóa mềm) không tách lô; không API xóa lô / đóng luồng

- **Severity:** MEDIUM
- **Module:** lodats / customers
- **File:** `apps/api/src/modules/customers/customers.service.ts`, `apps/api/src/modules/lodats/lodats.service.ts`, `apps/api/src/modules/lodats/lodats.controller.ts`
- **Function:** `CustomersService.update` (`isHidden`), `LodatsService.create` / `changeOwner` / `list` / `getById`
- **Vị trí code:** UI «Xóa khách» = `isHidden: true`. Map `onDelete: Cascade` chỉ khi **hard-delete** Customer (merge). `create`/`changeOwner` từ chối khách ẩn; `list`/`getById`/`mapRow` không lọc `customer.isHidden`. Controller không có `DELETE /lodats/:id`. Không có API `isActive: false` nếu không tạo map mới (`changeOwner` luôn create).
- **Problem:** Khách «Đã xoá» vẫn là chủ active trên `/lo-dat` (`customerHint`, chi tiết owner). Không gỡ chủ trừ đổi sang khách khác. Domain §0.1 «gỡ chủ lô dự án = đóng luồng» không có endpoint. Hard-delete lô: Prisma `Transaction` Restrict; `LodatImage`/`LodatCustomerMap`/`PublicLotListing` Cascade — không đi được từ API.
- **Root cause:** Soft-hide Person không đụng `LodatCustomerMap`. Thiếu thao tác đóng luồng.
- **Impact:** Rao bán dưới tên khách đã xóa. NV không xóa được lô tạo nhầm. Lô dự án không đóng luồng để NV khác/kho sạch.
- **Evidence:** `customer-list-page.tsx` delete → `isHidden: true`. `LodatCustomerMap` customer Cascade. `lodats.controller.ts` chỉ DELETE ảnh. `changeOwner` luôn `create` map active.
- **Status:** OPEN

### BUG-028 — Admin đổi chủ có thể gắn khách của NV khác vào luồng lô

- **Severity:** MEDIUM
- **Module:** lodats
- **File:** `apps/api/src/modules/lodats/lodats.service.ts`, `apps/web/src/features/lodats/components/change-owner-modal.tsx`
- **Function:** `changeOwner`
- **Vị trí code:** `if (user.role !== 'ADMIN' && customer.employeeId !== user.id)` — Admin bỏ qua. Không so `customer.employeeId === row.createdByEmployeeId`. Modal `listCustomers` Admin thấy mọi khách.
- **Problem:** Domain §0.3: đổi chủ trong **luồng NV đang giữ** (người tạo `Lodat`). Admin được quyền tương tự — không nói gắn Person của NV B vào lô NV A. STAFF `list`/`getById` theo `createdByEmployeeId`: NV A thấy chủ là khách NV B; NV B không thấy lô trên `/lo-dat`. `listForCustomer` STAFF cũng lọc người tạo lô (BUG-032).
- **Root cause:** Authz Admin = mọi khách hệ thống, không giới hạn hồ sơ của creator lô.
- **Impact:** Gán nhầm chủ đất xuyên NV; panel khách của B có badge lô (count) nhưng list lô trống nếu B không tạo `Lodat`.
- **Evidence:** `changeOwner` sau `assertCanAccess` (lô). Check khách chỉ `user.role !== 'ADMIN'`. `ownershipWhere` STAFF = `createdByEmployeeId: user.id`.
- **Status:** FIXED (2026-09-05) — Owner: Admin **không** đổi chủ lô. `changeOwner` Forbidden nếu ADMIN; `canChangeOwner` chỉ NV `createdByEmployeeId === user.id`. Khách phải thuộc NV đó. (Đóng luôn rủi ro gắn Person xuyên NV.)

### BUG-029 — Unique 1 luồng/NV/lô kho lệch Prisma và `create()`; không đóng được luồng

- **Severity:** MEDIUM
- **Module:** lodats
- **File:** `apps/api/prisma/migrations/20260824120000_project_lot_and_lodat_align/migration.sql`, `apps/api/prisma/schema.prisma`, `apps/api/src/modules/lodats/lodats.service.ts`
- **Function:** `create`, `getById`
- **Vị trí code:** SQL `UNIQUE (projectLotId, createdByEmployeeId) WHERE projectLotId IS NOT NULL` (mọi Lodat, kể cả hết map active). Prisma `model Lodat` không `@@unique`. `create` chỉ `findFirst` lodat cùng kho+NV **còn map isActive**. `getById` 404 nếu `maps.length === 0` (include chỉ active). Service không bắt `P2002`.
- **Problem:** Hai `POST /lodats` song song cùng `projectLotId` → một cái unique violation 500. Lodat tồn tại nhưng không còn map active (merge xóa map — BUG-016; hoặc SQL) → list ẩn, getById 404 «chưa gắn chủ», `create` không thấy active rồi đụng unique. Domain đóng luồng rồi gắn lại không làm được qua API.
- **Root cause:** Unique không partial theo map active; schema Prisma lệch migration; `create` check khác DB.
- **Impact:** NV kẹt không tạo lại luồng kho. `prisma db push` có thể **drop** unique vì schema không khai. Race tạo lô dự án.
- **Evidence:** Migration `Lodat_projectLotId_createdByEmployeeId_uidx`. `schema.prisma` Lodat indexes không unique. `create` `maps: { some: { isActive: true } }`. Không `catch` P2002 trong `lodats.service.ts`.
- **Status:** OPEN

### BUG-030 — API cho phép diện tích / mặt tiền âm; contract Zod thì không

- **Severity:** MEDIUM
- **Module:** lodats
- **File:** `apps/api/src/modules/lodats/dto/lodat.dto.ts`, `packages/shared/src/lodats.ts`, `apps/api/src/modules/lodats/lodats.service.ts`
- **Function:** `CreateLodatDto` / `UpdateLodatDto`, `parseOptionalNumber`
- **Vị trí code:** DTO `@IsNumber()` không `@Min(0)`. `parseOptionalNumber` chỉ `Number.isFinite`. Shared `createLodatSchema` / `updateLodatSchema` `z.number().nonnegative()`. API `ValidationPipe` class-validator, không parse Zod. `priceVnd` DTO không `@IsNumber` — `parsePrice` strip non-digit (chuỗi rác → số).
- **Problem:** Web `createLodat`/`updateLodat` chặn âm qua Zod. Gọi API trực tiếp (hoặc client khác) lưu `areaM2: -10`, `frontageM: -1`. Giá âm: `parsePrice` bỏ dấu trừ → dương hoặc null, không phải âm — lệch DT.
- **Root cause:** Nest DTO không mirror Zod.
- **Impact:** Lô dân thông số không hợp lệ; lọc khoảng DT (`gte: 1`) bỏ qua số âm/0.
- **Evidence:** `lodat.dto.ts` area/frontage. `packages/shared/src/lodats.ts` nonnegative. `main.ts` ValidationPipe không Zod.
- **Status:** FIXED (2026-09-05) — `CreateLodatDto` / `UpdateLodatDto`: `@Min(0)` trên `areaM2` / `frontageM`. `parseOptionalNumber` reject `n < 0`. Khớp Zod web `nonnegative`.

### BUG-031 — Nhãn «Tất cả trạng thái» vẫn ẩn lô Tạm dừng

- **Severity:** MEDIUM
- **Module:** lodats / web
- **File:** `apps/web/src/features/lodats/display.ts`, `apps/web/src/features/lodats/lodat-list-page.tsx`, `apps/api/src/modules/lodats/lodats.service.ts`
- **Function:** `STATUS_FILTER_OPTIONS`, `list`
- **Vị trí code:** Dropdown `value: ''` label «Tất cả trạng thái». `listQuery.status` undefined khi `status === ''`. API: không `pausedOnly`, không `status`, không `includePaused` → filter `maps.status = DANG_BAN`. Hiện tạm dừng phải gõ `@` / `@@` (`parseSearchKeyword`) hoặc chọn đúng «Tạm dừng».
- **Problem:** Domain mặc định ẩn tạm dừng là đúng; nhãn dropdown nói «tất cả» nhưng hành vi = chỉ Mở bán. User tin đã xem đủ lô.
- **Root cause:** UI status rỗng ≠ `includePaused: true`.
- **Impact:** Lô Tạm dừng / map `DAT_COC` (không `DANG_BAN`) biến mất khỏi list dù filter «Tất cả».
- **Evidence:** `STATUS_FILTER_OPTIONS`. `lodats.service.ts` `list` nhánh `else if (!query.includePaused)`. `parseSearchKeyword` `@`/`@@`.
- **Status:** FIXED (2026-09-05) — Owner: hành vi mặc định chỉ Mở bán là đúng ý. UI mặc định chọn **Mở bán**; thêm lựa chọn **Tất cả trạng thái** gửi `includePaused=true`. Reset lọc về Mở bán.

### BUG-032 — Số lô trên khách đếm mọi map; STAFF xem list lô khách thì chỉ lô mình tạo

- **Severity:** MEDIUM
- **Module:** lodats / customers
- **File:** `apps/api/src/modules/customers/customers-view.ts`, `apps/api/src/modules/lodats/lodats.service.ts`
- **Function:** `loadLodatCounts`, `listForCustomer`
- **Vị trí code:** `groupBy` map `isActive: true` theo `customerId` — không lọc `Lodat.createdByEmployeeId`. `listForCustomer` `ownershipWhere` STAFF = lô mình tạo + map active của khách. `take: 100` không phân trang.
- **Problem:** Badge/lọc «có lô» trên `/khach-hang` có thể > 0 trong khi panel/chi tiết khách STAFF `items: []` (lô do NV khác tạo, Admin đổi chủ — BUG-028). Admin `listForCustomer` thấy đủ.
- **Root cause:** Hai truy vấn khác tiêu chí ownership.
- **Impact:** NV tưởng khách có lô nhưng không mở được; hoặc ngược lại sau đổi chủ xuyên NV.
- **Evidence:** `loadLodatCounts`. `listForCustomer` comment «STAFF chỉ lô mình tạo». `customers.service.ts` `listLodats` → `listForCustomer`.
- **Status:** FIXED (2026-09-05) — `loadLodatCounts(user)`: STAFF lọc `lodat.createdByEmployeeId = user.id` (khớp `listForCustomer`); ADMIN đếm mọi map active. Badge Kha/Dũng = số lô mình tạo trên khách đó.

### BUG-033 — Database không ràng buộc XOR đất dân / lô kho

- **Severity:** LOW
- **Module:** lodats / db
- **File:** `apps/api/prisma/schema.prisma`
- **Function:** `model Lodat`
- **Vị trí code:** `addressId` và `projectLotId` đều optional; không CHECK. `create()` XOR ở app. `update()` lô dân đổi `addressId`; lô dự án bỏ qua specs, không chuyển loại. Không unique/check «đúng một trong hai».
- **Problem:** Script/SQL/migrate lỗi có thể ghi cả hai FK, hoặc cả hai null (`addressFilter=empty` nhắm case này). `mapRow` ưu tiên project nếu `projectLotId` truthy — địa chỉ dân trên cùng hàng bị bỏ.
- **Root cause:** Luật §0.4 chỉ enforce ở service.
- **Impact:** Hàng lô không hợp lệ; JOIN specs/địa chỉ sai loại. API bình thường không tạo được (XOR).
- **Evidence:** `schema.prisma` Lodat. `create` `isProject === Boolean(dto.addressId)`. Không CHECK trong `apps/api/prisma/migrations` cho Lodat XOR.
- **Status:** CLOSED (2026-09-05) — Owner: không sao, không sửa. API tạo lô đã chặn cả hai / cả trống; DB staging hiện không có hàng lệch.

### BUG-034 — Tạo lô dân commit trước khi copy ảnh chat; lỗi copy để lại lô mồ côi / retry trùng

- **Severity:** MEDIUM
- **Module:** lodats
- **File:** `apps/api/src/modules/lodats/lodats.service.ts`
- **Function:** `create`
- **Vị trí code:** `prisma.lodat.create` (kèm map) xong mới `copyPublicImageToSeoLotKey` + `lodatImage.createMany`. Không `$transaction` với copy R2. Ném lỗi → HTTP 500, hàng Lodat+map đã có. Lô dân không unique theo địa chỉ+NV. Ảnh file máy upload **sau** `createLodat` phía web (đã bắt lỗi riêng).
- **Problem:** Copy R2/SEO fail: client báo không tạo được nhưng lô đã gắn chủ. Bấm tạo lại → thêm lô dân trùng cùng khách/địa chỉ/tiêu đề. Ảnh chat có thể thiếu một phần nếu fail giữa vòng `for`.
- **Root cause:** Side-effect storage ngoài transaction DB.
- **Impact:** Duplicate lô dân; chủ/giá nhân bản; list rối. Lô dự án unique SQL (BUG-029) thì retry = 500.
- **Evidence:** `create` sau `select: { id: true }` khối `if (!isProject && dto.chatImageIds?.length)`. `lodat-create-page.tsx` upload file sau `createLodat` (nhánh khác, có toast).
- **Status:** FIXED (2026-09-05) — Owner: copy ảnh chat trong `try`; lỗi → `lodat.delete` + best-effort xóa object R2 đã copy, rồi rethrow. NV thấy lỗi = không còn lô; bấm tạo lại không trùng.

### BUG-035 — Cookie last-click ghi khi mã share không resolve được

- **Severity:** HIGH
- **Module:** lot-shares
- **File:** `apps/web/middleware.ts`, `packages/shared/src/lot-shares.ts`
- **Function:** `middleware`, `nextPublicShareCookie`, `lookupShareEmployee`
- **Vị trí code:** Middleware: `normalizeShareCode` thành công → `lookupShareEmployee` (GET Nest resolve). Lookup fail (`employeeId: ''`) vẫn `nextPublicShareCookie` + `cookies.set` nếu `maxAge > 0`. Comment: ghi cookie khi đúng format kể cả lookup chậm. `sameStaff` chỉ true khi `existing.employeeId === employeeId` và còn hạn — `employeeId` rỗng không bao giờ `sameStaff`.
- **Problem:** `?share=XXXXX` đúng alphabet 4–12 ký tự nhưng không có hàng / NV `isActive=false` / listing gỡ publish → resolve 404. Cookie httpOnly vẫn ghi 30 ngày, **ghi đè** mã NV trước. Lần sau lookup được NV thật: cookie đang `employeeId=''` ≠ id thật → domain «cùng NV không reset 30 ngày» bị phá. Trang layout không resolve được → liên hệ hotline; `ShareAttributedViewTracker` không có code → cộng **Truy cập trực tiếp**.
- **Root cause:** Cố tình persist format-valid code trước khi biết mã còn sống; không tách timeout vs 404.
- **Impact:** Link giả / NV đã khóa / lô gỡ web cướp attribution 30 ngày. Đối thủ gửi khách URL `?share=` rác để xóa cookie NV.
- **Evidence:** `middleware.ts` `lookedUp?.employeeId ?? ''` rồi luôn set cookie. `lot-shares.ts` `nextPublicShareCookie`. `resolveShareCode` 404 khi `!isPublished` / `!isActive`. Domain `public-content.md` §18 last-click.
- **Status:** FIXED (2026-09-05) — Owner: middleware chỉ set cookie + share header khi `lookupShareEmployee` thành công. Resolve fail → `NextResponse.next()` giữ cookie last-click cũ.

### BUG-036 — Không thu hồi được share; disable/gỡ web chỉ ẩn resolve; mã cũ sống lại

- **Severity:** HIGH
- **Module:** lot-shares
- **File:** `apps/api/src/modules/lot-shares/lot-shares.service.ts`, `apps/api/src/modules/lot-shares/public-lot-shares.controller.ts`, `apps/api/src/modules/lot-shares/admin-lot-shares.controller.ts`, `apps/api/prisma/schema.prisma`
- **Function:** `createOrGetShareLinkForListing`, `resolveShareCode`, `UsersService.remove` / `update` (`isActive`)
- **Vị trí code:** Không `PATCH`/`DELETE` `PublicLotShare`. `create` unique `(employeeId, publicListingId)` → lần sau trả **cùng** `shareCode`. `resolve`/`findActiveShare` chặn `!isPublished` / `!isActive`. Hàng DB giữ nguyên. `User` delete `onDelete: Cascade` share — nhưng `remove` user **cấm** nếu còn lodat/khách/GD (NV đang share thì thường không xóa được). Disable không xóa share.
- **Problem:** Không xóa share của mình hay của người khác. Lộ mã: không xoay. Gỡ Đăng web: guest resolve 404 (mọi NV trên listing); **bật lại publish** → mọi mã cũ dùng được ngay. Disable NV: resolve 404, cookie/mã còn; bật lại `isActive` → share lại hiệu lực. Đổi `role` không đụng bảng share.
- **Root cause:** Share = get-or-create; không vòng đời revoke. Trạng thái hiệu lực suy ra từ User/listing, không có cờ trên `PublicLotShare`.
- **Impact:** Không «xóa share thì mất quyền» vì không có xóa. Quyền liên hệ/thống kê của mã chỉ tạm tắt. UI không có màn sửa/xóa share (ẩn hết) — backend cũng không có; không phải FE ẩn nhưng BE vẫn xóa được.
- **Evidence:** Chỉ `POST` share-link + `GET/POST` public code + `GET` admin stats. Schema `PublicLotShare` không `revokedAt`. `createOrGetShareLinkForListing` `findUnique` employee+listing.
- **Status:** CLOSED (2026-09-05) — Owner: không phải lỗi. Không thu hồi/tắt link; share sống lâu dài. Sau này phát triển thêm; hiệu lực theo trạng thái mở bán/đã bán (không revoke mã).
- **Status:** CLOSED (2026-09-05) — Owner: không phải lỗi. Link share sống lâu; không thu hồi. Hiệu lực theo trạng thái mở bán/đã bán.

### BUG-037 — Cộng lượt xem public không chứng thực cookie share

- **Severity:** MEDIUM
- **Module:** lot-shares
- **File:** `apps/api/src/modules/lot-shares/lot-shares.service.ts`, `apps/api/src/modules/lot-shares/public-page-views.controller.ts`
- **Function:** `recordPublicPageView`, `recordAttributedPageView`
- **Vị trí code:** `@Public() POST /public/page-views` body `shareCode` tùy chọn. Không đọc cookie. `findActiveShare` theo mã. Có `Authorization: Bearer …` (kể cả token giả — guard `@Public` bỏ JWT) thì **không đếm**. Cookie `crmanhung_share` httpOnly — client JS gửi code từ SSR/`attribution`, không bắt buộc khớp cookie server.
- **Problem:** `curl` + mã share (nằm trên URL công khai) tăng `attributedViewCount` của NV. Body rỗng tăng `directViewCount`. Throttler 120/phút. Tracker FE bỏ qua khi có JWT; API không bắt origin/cookie.
- **Root cause:** Đếm view tin client; tách khỏi cookie last-click.
- **Impact:** Thống kê `/dashboard/thong-ke` (ADMIN) không đáng tin. Không mở CRM data của NV khác — chỉ số.
- **Evidence:** `recordPublicPageView(body?.shareCode, hasBearerToken)`. `ShareAttributedViewTracker` `POST /public/page-views`. Không chỗ nào verify cookie vs body.
- **Status:** FIXED (2026-09-05) — Owner: `recordPublicPageView` / `recordAttributedPageView` chỉ cộng NV khi cookie `crmanhung_share` còn hạn và khớp body/path (nếu gửi). Không cookie / lệch mã → Truy cập trực tiếp.

### BUG-038 — `POST /public/lot-shares/:code/visit` tăng đếm không cùng rule resolve

- **Severity:** MEDIUM
- **Module:** lot-shares
- **File:** `apps/api/src/modules/lot-shares/lot-shares.service.ts`, `apps/api/src/modules/lot-shares/public-lot-shares.controller.ts`
- **Function:** `recordVisit`
- **Vị trí code:** `publicLotShare.update` `visitCount + 1` theo `shareCode` trước. Sau đó nếu `!isPublished` mới 404 — **đã cộng**. Không đọc `employee.isActive`. Web `recordPublicLotShareVisit` **không được gọi** (chỉ khai trong `api.ts`).
- **Problem:** Endpoint public. NV disable / listing unpublished vẫn tăng `visitCount` (unpublished: +1 rồi lỗi). `GET :code` (còn hiệu lực) trả `visitCount` đã bị thổi.
- **Root cause:** Update-then-check; không `findActiveShare`.
- **Impact:** Số visit trên resolve sai. FE hiện không gọi — vẫn gọi được trực tiếp (UI ẩn ≠ bảo mật).
- **Evidence:** `recordVisit` try `update` rồi `if (!row.publicListing.isPublished)`. Grep `recordPublicLotShareVisit` chỉ `api.ts`.
- **Status:** CLOSED (2026-09-05) — Owner: link share sống mãi; cộng visit thế nào cũng được — không sửa. (Gỡ Đăng web đã bỏ sản phẩm.)

### BUG-039 — Mất SĐT: khách không resolve share nhưng view vẫn cộng cho NV

- **Severity:** MEDIUM
- **Module:** lot-shares
- **File:** `apps/api/src/modules/lot-shares/lot-shares.service.ts`
- **Function:** `resolveShareCode`, `findActiveShare`, `createOrGetShareLinkForListing`
- **Vị trí code:** Tạo share: `isActive` + `phone.trim()`. `resolveShareCode`: 404 nếu không phone / không active / không publish. `findActiveShare`: chỉ `isPublished` + `employee.isActive` — **không** phone.
- **Problem:** Admin xóa SĐT user sau khi đã có `PublicLotShare`. Guest GET resolve 404 (hotline). `POST /public/page-views` với mã cũ vẫn `incrementEmployeeView`. Middleware lookup fail → BUG-035 cookie. Tracker layout không attribution → có thể đếm direct thay vì NV tùy client gửi mã hay không.
- **Root cause:** Hai hàm «share còn sống» khác điều kiện.
- **Impact:** Liên hệ và thống kê lệch. Tạo share mới cũng 400 «chưa có SĐT» trong khi hàng cũ còn.
- **Evidence:** `resolveShareCode` khối `if (!phone)`. `findActiveShare` select không `phone`.
- **Status:** FIXED (2026-09-05) — Owner: Admin **chỉ được đổi** SĐT nhân viên, **không được xoá**. `UpdateUserDto` / `users.service.update` từ chối null/rỗng; form Admin hint + bắt buộc 10 số. `findActiveShare` cùng đòi `employee.phone` như `resolveShareCode` (phòng NV legacy đã trống SĐT).

### BUG-040 — Resolve public trả `employeeId` và `visitCount`

- **Severity:** LOW
- **Module:** lot-shares
- **File:** `apps/api/src/modules/lot-shares/lot-shares.service.ts`, `packages/shared/src/lot-shares.ts`
- **Function:** `resolveShareCode`
- **Vị trí code:** `@Public() GET /public/lot-shares/:code` trả `employeeId`, `visitCount`, `employee.fullName/phone/avatarUrl`, `listingSlug`. Middleware chỉ cần `employeeId`. UI liên hệ cần tên/SĐT/avatar.
- **Problem:** Guest biết mã (URL share) đọc được id nội bộ User và số visit. Không mở `/lodats` hay CRM (JWT + ownership riêng). Không sửa/xóa share (không API).
- **Root cause:** Cùng DTO cho middleware + guest contact.
- **Impact:** Lộ id nhân viên + thống kê visit từng mã. Brute-force mã 5 ký tự (~32^5) + 120 req/phút không thực tế.
- **Evidence:** `publicLotShareResolveSchema`. `middleware.ts` `body.employeeId`.
- **Status:** FIXED (2026-09-05) — Owner: trình duyệt chỉ cần mã share; resolve public chỉ trả hotline (tên/SĐT/avatar + slug); bỏ `employeeId`/`visitCount`. Cookie last-click theo mã share; middleware chỉ kiểm tra resolve 200.

### BUG-041 — Thứ tự tin theo chỉ số lần quét, không theo thời gian

- **Severity:** HIGH
- **Module:** customers / messenger
- **File:** `apps/api/src/modules/customers/from-extension.service.ts`, `apps/api/src/modules/customers/customers.service.ts`, `apps/web/src/features/customers/components/chat-thread.tsx`
- **Function:** `appendMessages`, `listMessages`
- **Vị trí code:** Tin khớp: `sortOrder: i` với `i` = vị trí trong `chatMessages` lần này (`slice(0, 200)`). Tin **không** có trong payload giữ `sortOrder` cũ. `create` cũng `sortOrder: i`. Cột `sentAt` / `direction` không gán. `listMessages` `orderBy: [{ sortOrder: 'asc' }, { id: 'asc' }]`. UI `#index+1` theo mảng đã sort.
- **Problem:** Quét lại cùng hội thoại nhưng cửa sổ DOM khác (200 tin mới vs 200 tin cũ, hoặc cuộn thêm): tin trùng bị gán index 0…n của cửa sổ mới; tin cũ ngoài cửa sổ vẫn 0…n → **trùng sortOrder**, timeline xen kẽ. CRM không nhận timestamp từ payload (`extensionChatMessageSchema` không có `sentAt`).
- **Root cause:** `sortOrder` = thứ tự batch, không phải thứ tự hội thoại ổn định; không merge theo `sentAt` / mid.
- **Impact:** Cột phụ «Nội dung chat» sai thứ tự sau import lại. Ảnh lô lấy từ chat theo thứ tự tin cũng lệch.
- **Evidence:** `appendMessages` `found.sortOrder !== i` → update `sortOrder: i`. Schema `sentAt DateTime?` không có trong `create`/`update` ingest. `listMessages` không `sentAt`.
- **Status:** OPEN (deferred — 2026-09-05; owner: tạm bỏ — extension không lấy giờ tin; nội dung chat trên CRM ít giá trị; **không sửa code** cho đến khi owner mở lại)

### BUG-042 — Cắt 200 tin im lặng; lệch scanner cũ 500

- **Severity:** HIGH
- **Module:** customers / messenger
- **File:** `apps/api/src/modules/customers/from-extension-parse.ts`, `apps/api/src/modules/customers/from-extension.service.ts`
- **Function:** `appendMessages`
- **Vị trí code:** `MAX_MESSAGES = 200`; `incoming = (fields.messages ?? []).slice(0, MAX_MESSAGES)`. Không field `messagesDropped`. `fromExtensionResultSchema` chỉ `messagesAppended` / `messagesUpdated`. Scanner CRM cũ `MESSAGE_MAX_COUNT = 500` (`AnhunglandExtension/content-inbox.js`). Docs `customers.md` §13.14 ghi tối đa 200/lần.
- **Problem:** Payload 201–500 tin: phần sau **bỏ không báo**. Extension mới trong repo này **stub** (chưa quét); nếu NV còn dùng scanner cũ 500 tin → CRM mất tin. Cùng cuộc chat import nhiều lần từng cửa sổ 200 tin thì dồn vào một `CustomerFacebook` nhưng sort loạn (BUG-041).
- **Root cause:** Truncate cứng; không phân trang ingest; không báo client.
- **Impact:** Thiếu lịch sử. NV tưởng đã lưu đủ vì `ok: true`.
- **Evidence:** `from-extension-parse.ts` `MAX_MESSAGES`. `appendMessages` `slice(0, MAX_MESSAGES)`. Extension `apps/extension/src/content/content.ts` chỉ marker stub.
- **Status:** FIXED (2026-09-06) — Owner: nâng `MAX_MESSAGES` 200 → **500** khớp extension `MESSAGE_MAX_COUNT`; cập nhật `docs/domains/customers.md`.

### BUG-043 — Tin nhắn không unique; khóa dedupe yếu tạo trùng hoặc gộp nhầm

- **Severity:** HIGH
- **Module:** customers / messenger
- **File:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/customers/from-extension-parse.ts`, `apps/api/src/modules/customers/from-extension.service.ts`
- **Function:** `messageStorageKey`, `appendMessages`
- **Vị trí code:** `CustomerMessengerMessage.externalMessageId` / `dedupeKey` chỉ index theo facebook+sortOrder, **không unique**. `messageStorageKey`: `mid.` / `@msgr.` → `mid:id`; else `dedupeKey`; else `` `${id\|\|'no-id'}::${sender}::${text}` ``. `find` `byKey` rồi `byStable` chỉ khi hàng cũ đã có `externalMessageId` ổn định. Hai `appendMessages` song song không transaction.
- **Problem:** (1) Lần 1 chưa có mid (fallback `no-id::customer::`) rồi lần 2 có `mid.…` → **tạo hàng mới** (byStable miss). (2) Nhiều tin chỉ ảnh, cùng sender, text rỗng, không mid/dedupe → **một khóa** — gộp thành một tin. (3) Race hai POST → hai hàng cùng mid. Mapping Person đã ghi BUG-013; đây là **trùng/gộp tin**.
- **Root cause:** Không `@@unique([customerFacebookId, externalMessageId])`; fallback không đủ phân biệt bubble.
- **Impact:** Lịch sử nhân bản hoặc mất bubble ảnh. `messageCount` phình.
- **Evidence:** Schema `CustomerMessengerMessage`. `messageStorageKey`. `appendMessages` không `P2002`/unique. `isStableMessengerMessageId`. DB `kha` (2026-09-06): 18.617 tin; 899 không `mid.$`/`@msgr.` — **toàn** `dedupeKey` `orphan::` (hàm `collectOrphanBubbleMessages` trong `apps/extension/content-inbox.js`). `extensionChatMessageSchema.id` optional.
- **Status:** OPEN — **DEFERRED phần extension (owner 2026-09-06):** chưa sửa scanner. **API (BUG-044):** không ghi tin thiếu `mid.$` / `@msgr.`; migrate xóa hàng cũ. Unique `(facebook, mid)` trên DB vẫn chưa. Ghi chú: `apps/extension/README.md`, `apps/extension/docs/tech/extension-overview.md` §11.1.

### BUG-044 — Khớp nhầm rồi ghi đè nội dung / bỏ ảnh

- **Severity:** MEDIUM
- **Module:** customers / messenger
- **File:** `apps/api/src/modules/customers/from-extension.service.ts`
- **Function:** `appendMessages`, `ingestExtraImages`
- **Vị trí code:** `betterText` = body mới khác rỗng và (placeholder→thật **hoặc** `nextBody.length > prevBody.length`). `ingestExtraImages`: chỉ thêm khi `imageUrls.length > found.images.length`; không thay URL/index đã lưu. Fetch ảnh fail → `ingestMessengerChatImage` trả `null` (bỏ ảnh).
- **Problem:** Hai tin khác nhau dính cùng khóa yếu (BUG-043): lần sau text dài hơn **xóa** text ngắn. Cùng tin: lần 1 1 ảnh fail, lần 2 1 URL khác → length không tăng → **không lưu ảnh**. Không xóa tin thừa khi import lại (cố ý) nhưng cũng không sửa ảnh sai.
- **Root cause:** Merge tin = heuristic độ dài + đếm ảnh, không so mid/nội dung khác.
- **Impact:** Sai lời thoại; thiếu ảnh chat / ảnh lô reuse chat.
- **Evidence:** `betterText` trong `appendMessages`. `ingestExtraImages` `if (imageUrls.length <= found.images.length) return 0`. `ingestMessengerChatImage` `return null` khi host/fetch fail.
- **Status:** FIXED (2026-09-06) — Owner: giữ tin có `mid.$` / `@msgr.`; **xóa** tin không ID bong bóng. `from-extension` chỉ ingest bubble ổn định; migration `20260906120000_drop_messenger_without_bubble_id` xóa hàng cũ (ảnh cascade). Extension vẫn gửi `orphan::` (BUG-043) nhưng API không ghi. Heuristic đè chữ/ảnh trên **cùng mid** giữ nguyên (nâng `[Ảnh]` → chữ thật).

### BUG-045 — Import lại không cập nhật tên khách (`fullName`)

- **Severity:** MEDIUM
- **Module:** customers / messenger
- **File:** `apps/api/src/modules/customers/from-extension.service.ts`
- **Function:** `touchExisting`, `createCustomer`
- **Vị trí code:** Tạo mới: `fullName: fullNameSeed(fields)` (tên FB / `Khách {uid}`). Lần sau: `customerFacebook.update` `facebookName: fields.customerName \|\| fb.facebookName`; `customer.update` chỉ `updatedAt`. Không gán `fullName`. Domain: không sửa tên FB tay; tên do extension khi scan.
- **Problem:** Lần đầu thiếu `customerName` → list hiện `Khách {threadId}`. Quét lại có tên Messenger: cột tên Person **không đổi**; `facebookName` trên FB có. UI list dùng `fullName`.
- **Root cause:** `touchExisting` không đụng `Customer.fullName`.
- **Impact:** Mapping đúng Person nhưng nhãn sai; NV tưởng khách khác.
- **Evidence:** `touchExisting` vs `createCustomer` `fullNameSeed`. `toListItem` `fullName`.
- **Status:** CLOSED (won't fix, 2026-09-06) — Owner: không sửa scan; tự đổi tên CRM bằng bút trên `/khach-hang`.

### BUG-046 — API tin nhắn một phát không phân trang; không thời điểm; chi tiết khách không có chat

- **Severity:** MEDIUM
- **Module:** customers / messenger
- **File:** `apps/api/src/modules/customers/customers.service.ts`, `packages/shared/src/customers.ts`, `apps/web/src/features/customers/customer-detail-page.tsx`, `apps/web/src/features/customers/components/chat-thread.tsx`
- **Function:** `listMessages`
- **Vị trí code:** `findMany` mọi tin của `CustomerFacebook`, không `take`/`cursor`. Contract `customerMessengerMessageSchema` không `sentAt`. Chi tiết `/khach-hang/[id]` không gọi `GET …/messages` (chỉ list rail khi `messageCount > 0`).
- **Problem:** Sau migrate/trùng tin, payload lớn một request. UI không hiện giờ gửi (cột DB `sentAt` trống — BUG-041). Mở hồ sơ chi tiết không xem được lịch sử (phải về list + cột phụ).
- **Root cause:** API list đầy đủ; màn chi tiết không gắn thread.
- **Impact:** Chậm/timeout; NV không thấy chat lúc đang ở chi tiết khách.
- **Evidence:** `listMessages` không limit. `customer-detail-page.tsx` không `listCustomerMessages`. `customer-list-page.tsx` rail `ChatThread`.
- **Status:** CLOSED (won't fix, 2026-09-06) — Owner: nội dung chat chỉ tham khảo, không cần hiện ở chi tiết khách; không sửa phân trang/`sentAt`/UI chi tiết.

### BUG-047 — Dashboard / Đăng web cắt 200 lô Mở bán; nút «Đăng lô» chỉ 8 listing gần nhất

- **Severity:** HIGH
- **Module:** public-content / dashboard
- **File:** `apps/web/src/features/public-content/api.ts`, `apps/web/src/features/public-content/staff-lots.ts`, `apps/web/src/features/public-content/public-web-dashboard.tsx`
- **Function:** `loadOpenPlots`, `getPublicWebDashboard`, `listStaffOpenLots`, `buildPublicWebDashboard`
- **Vị trí code:** `loadOpenPlots` → `listLodats({ status: DANG_BAN, limit: LODAT_LIST_MAX_PAGE_SIZE })` (`200`, không lặp `offset`). `publishedLotCount` / `pendingLotCount` = đếm `staffOpen` (giao `plots` đã cắt ∩ overlay). `recentLots: lots.slice(0, 8)` từ `GET /admin/public-web/lots`. Dialog «Đăng lô» = `(data?.recentLots ?? []).filter(!isPublished)`. `/dashboard/lo-dat` dùng cùng `loadOpenPlots`.
- **Problem:** (1) Công ty / Admin > 200 lô đang Mở bán: thẻ «Lô đang hiện / Chờ đăng» thiếu; list `/dashboard/lo-dat` không hiện lô ngoài 200 `updatedAt` mới nhất — không soạn/đăng được. (2) Nút Tổng quan «Đăng lô» không lấy lô Mở bán chưa có hàng `PublicLotListing`; chỉ unpublished nằm trong 8 listing `updatedAt` mới nhất. Nếu 8 hàng đó đều đã đăng → dialog «Không còn lô chờ đăng» dù `pendingLotCount` > 0. (3) Lô Tạm dừng vẫn `isPublished` (BUG-023) không vào `staffOpen` (chỉ `DANG_BAN`) nên thẻ «Lô đang hiện» thấp hơn catalog slug.
- **Root cause:** Dashboard ghép client: cap list lô CRM + slice overlay; không COUNT/full join Mở bán × listing.
- **Impact:** Admin tưởng hết lô chờ đăng / số liệu sai; lô Mở bán cũ không lên web; lệch với `GET /public/listings` (không cắt 200).
- **Evidence:** `LODAT_LIST_MAX_PAGE_SIZE = 200`. `buildPublicWebDashboard` đếm `staffOpen` không đếm `lots.filter(isPublished)`. `PublishLotDialog` `pendingLots` từ `recentLots`. Domain `public-content.md` §12: Chờ đăng = «Mở bán CRM, chưa Đăng web».
- **Status:** FIXED (2026-09-06) — Owner: lô không của Admin; không đăng/sửa/tạo. Gỡ `/dashboard/lo-dat` khỏi Admin (redirect `/dashboard`); Tổng quan bỏ nút **Đăng lô** (bảng lô chỉ xem). API `PATCH …/draft|published` + GPT lô chỉ **STAFF**. List NV `/dashboard/lo-dat` giữ nguyên (cap 200 chưa đụng — hiện 71 lô Mở bán).

### BUG-048 — Không có API/UI quản lý kho lô (`ProjectLot`)

- **Severity:** HIGH
- **Module:** addresses / lodats
- **File:** `apps/api/prisma/schema.prisma` (`model ProjectLot`), `apps/api/src/modules/lodats/lodats.service.ts` (`listProjectLots`), `apps/api/scripts/migrate-project-lots-from-legacy.ts`
- **Function:** (không có `create`/`update`/`hide` ProjectLot trên Nest)
- **Vị trí code:** Grep runtime `projectLot.create` chỉ script migrate. `GET /lodats/project-lots` đọc kho `isHidden: false`. Sổ địa chỉ (`addresses.service` / `addresses-manage-dialog.tsx`) CRUD `Address` + ảnh dự án + Tỉnh/Huyện/Xã — không hàng kho.
- **Problem:** Domain `lodats.md` §0.4 / `addresses.md` §3: Admin thêm / sửa / xoá / import Excel kho (số lô, DT, MT, hướng) trên địa chỉ `PROJECT`. CRM mới chỉ copy legacy. Dự án mới: NV picker «Không có lô kho»; không sửa DT kho (JOIN mọi `Lodat` trỏ sang).
- **Root cause:** Schema có `ProjectLot`; vertical slice quản kho chưa làm (chỉ migrate + picker).
- **Impact:** Không mở bán lô dự án mới đúng nghiệp vụ kho; sửa thông số kho không được; phụ thuộc script ngoài UI.
- **Evidence:** `listProjectLots` read-only. Domain Admin «import/sửa kho dự án». Không controller `project-lots` CUD.
- **Status:** FIXED (2026-09-06) — Admin **Cài đặt → Import lô đất Excel** (copy modal CRM cũ): chọn dự án chưa có lô, Excel 5 cột, xem trước, `POST /addresses/:id/lodats/import` ghi `ProjectLot` (không `Lodat`, không gắn khách). Dropdown `GET /addresses?kind=PROJECT&withoutLodats=1`. Sửa/xoá từng dòng kho không nằm trong modal cũ — không làm trong PR này.

### BUG-049 — Admin tạo giao dịch trên lô NV thì GD thuộc Admin; unique GD mở chặn NV

- **Severity:** HIGH
- **Module:** transactions / permission
- **File:** `apps/api/src/modules/transactions/transactions.service.ts`
- **Function:** `create`, `ownershipWhere`, `assertCanAccessLodat`
- **Vị trí code:** `assertCanAccessLodat`: ADMIN luôn pass. `create` gán `createdByEmployeeId: user.id`. `list` STAFF = `{ createdByEmployeeId: user.id }`. Unique SQL `Transaction_lodatId_open_uidx` / `findOpenId` theo `lodatId` toàn cục (mọi NV). UI: Admin mở lô bất kỳ → `/giao-dich/tao?lodatId=`.
- **Problem:** Domain: STAFF list/sửa GD mình tạo; tạo từ lô mình. Admin tạo GD trên luồng NV A → hàng `createdBy` = Admin. NV A không thấy trên `/giao-dich`; tạo GD trên cùng lô → 409 `OPEN_TRANSACTION_EXISTS` (hoặc unique). Lịch sử trên chi tiết lô (`listLodatTransactionHistory`) vẫn hiện GD (lọc `lodatId`, không lọc người tạo) — FE/BE lệch theo màn.
- **Root cause:** Ownership GD = người bấm Tạo, không = `Lodat.createdByEmployeeId`. Unique mở theo lô, không theo NV.
- **Impact:** NV mất quyền ghi nhận deal trên lô mình; thống kê STAFF thiếu doanh thu; Admin tưởng NV đã có GD.
- **Evidence:** `create` `createdByEmployeeId: user.id`. `ownershipWhere` STAFF. Migration `Transaction_lodatId_open_uidx`. `lodat-transaction-history.ts` `where: { lodatId }`. Domain `transactions.md` §2.
- **Status:** FIXED (2026-09-06) — Owner: Admin không tạo GD. `POST /transactions` 403; UI `/giao-dich/tao` + nút **Giao dịch** trên lô chặn Admin. Admin vẫn xem/sửa/xóa GD có sẵn. Unique 1 GD mở / lô giữ nguyên.

### BUG-050 — Admin tạo hồ sơ sổ đỏ trên khách NV thì hồ sơ thuộc Admin

- **Severity:** HIGH
- **Module:** title-services / permission
- **File:** `apps/api/src/modules/title-services/title-services.service.ts`, `apps/web/src/features/title-services/title-service-create-page.tsx`
- **Function:** `create`, `ownershipWhere`, `assertCustomerAccess`
- **Vị trí code:** `assertCustomerAccess` cho phép Admin mọi khách. `createdByEmployeeId: user.id`. List STAFF = hồ sơ mình tạo — **không** theo `Customer.employeeId`. Form `/khach-hang/[id]/dich-vu-so-do` Admin mở được khách NV.
- **Problem:** Domain §2/§5: STAFF tạo từ khách thuộc mình; list = `createdByEmployeeId`; «trùng lúc tạo vì khách phải của NV». Admin tạo hộ → NV giữ Person không thấy `/dich-vu-so-do`; Admin lọc NV kia cũng không thấy (người tạo là Admin). Merge khách vs Restrict TitleService đã BUG-016.
- **Root cause:** Không gán `createdByEmployeeId = customer.employeeId`; không chặn Admin tạo hộ.
- **Impact:** Hồ sơ sổ đỏ «mất» trên list NV; phí/tiến độ/file không theo Person.
- **Evidence:** `create` + `ownershipWhere`. Domain `title-services.md` §2 «Không: tạo cho khách NV khác» (cột STAFF); Admin không được mô tả tạo hộ.
- **Status:** FIXED (2026-09-06) — Owner: Admin không tạo sổ đỏ. `POST /title-services` 403; UI menu khách **Dịch vụ sổ đỏ** + `/khach-hang/[id]/dich-vu-so-do` chặn Admin. Admin vẫn xem/sửa/xóa hồ sơ có sẵn.

### BUG-051 — List giao dịch không phân trang; Admin không lọc theo NV trên UI

- **Severity:** MEDIUM
- **Module:** transactions
- **File:** `apps/api/src/modules/transactions/transactions.service.ts`, `apps/web/src/features/transactions/transaction-list-page.tsx`, `apps/web/src/features/transactions/api.ts`
- **Function:** `list`
- **Vị trí code:** `findMany` mọi hàng khớp filter, không `take`/`skip`. `total: items.length`. `statsFromItems(items)` trên API; FE tính lại trên `applyExtraFilters` (lọc cột client). Query DTO có `createdByEmployeeId`; list page không gửi, không có dropdown NV (khác sổ đỏ).
- **Problem:** Toàn bộ GD (+ parties/snapshot) một request — timeout/OOM khi copy/tăng data. `total` không phải COUNT. Extra filter «Chưa có lô/người bán» chạy trên payload đã load, không trên DB. Domain §2: Admin lọc theo NV — UI không làm, thẻ doanh thu luôn cộng mọi NV (trừ extra filter).
- **Root cause:** List «load hết»; FE extra filter sau; thiếu control `createdByEmployeeId`.
- **Impact:** Sai/thiếu số liệu khi request fail hoặc Admin cần xem từng NV; lệch UX với `/dich-vu-so-do`.
- **Evidence:** `list` không `count`. `transaction-list-page.tsx` `listQuery` chỉ keyword/type/status. Domain `transactions.md` §2–3 thẻ thống kê «trong cùng lọc».
- **Status:** FIXED (2026-09-06) — Owner: chỉ phân trang (Admin lọc NV **không** làm). `limit`/`offset` (50/200) + `total` = COUNT; stats doanh thu/hoa hồng = aggregate OWN+HOAN_TAT cùng filter API; FE `useCrmInfiniteList` như khách/lô.
### BUG-052 — List sổ đỏ cắt 500 hàng và khai `total` bằng độ dài trang

- **Severity:** MEDIUM
- **Module:** title-services
- **File:** `apps/api/src/modules/title-services/title-services.service.ts`, `apps/api/src/modules/title-services/title-services-view.ts`
- **Function:** `list`
- **Vị trí code:** `take: LIST_LIMIT` (`500`). `return { items, total: items.length }`. Không `count()`. FE `applyExtraFilters` trên `items`.
- **Problem:** Hồ sơ thứ 501+ (sort ghim → `pinnedAt` → `updatedAt`) không lên list/tìm/lọc cột. UI tin `total` = hết. Domain ghi «Limit 500» (CRM cũ) nhưng CRM mới không báo còn trang.
- **Root cause:** `total` gán length sau `take`, không COUNT.
- **Impact:** Mất hồ sơ trên UI; ghim/lọc NV sai vì thiếu hàng.
- **Evidence:** `LIST_LIMIT = 500`. `title-service-list-page.tsx` một `listTitleServices` không infinite scroll.
- **Status:** FIXED (2026-09-06) — Owner: phân trang. `limit`/`offset` (50/200) + `total` = COUNT; FE `useCrmInfiniteList` như khách/lô.

### BUG-053 — List địa chỉ cắt 500; sổ/picker thiếu địa chỉ cũ

- **Severity:** MEDIUM
- **Module:** addresses
- **File:** `apps/api/src/modules/addresses/addresses.service.ts`, `apps/web/src/features/addresses/addresses-manage-dialog.tsx`, `apps/web/src/features/addresses/components/address-picker.tsx`
- **Function:** `list`
- **Vị trí code:** `take: 500`, `orderBy: updatedAt desc`, `total: items.length`. Filter `kind` trên dialog là client trên payload đó. Picker STAFF cùng API (không `includeHidden` mặc định).
- **Problem:** >500 địa chỉ: sổ Admin đếm «Tất cả/Dân/Dự án» sai; NV tạo lô không chọn được địa chỉ cũ. Keyword có thể kéo đúng hàng nếu khớp — không keyword thì mất.
- **Root cause:** Một trang cứng + `total` = length.
- **Impact:** Tạo lô nhầm địa chỉ / không tạo được lô đúng xã/dự án đã có.
- **Evidence:** `addresses.service.ts` `take: 500`. Dialog `counters` từ `allItems.length`. BUG-009 là `includeHidden`; đây là cắt trang.
- **Status:** FIXED (2026-09-06) — Owner: bỏ `take: 500`; `GET /addresses` trả hết theo filter + `total` = COUNT.

### BUG-054 — Cấp mã `GD-` / `SD-` không atomic — tạo song song trùng unique

- **Severity:** MEDIUM
- **Module:** transactions / title-services
- **File:** `apps/api/src/modules/transactions/transactions.service.ts`, `apps/api/src/modules/title-services/title-services.service.ts`
- **Function:** `nextCode`
- **Vị trí code:** `findFirst` `code startsWith` prefix năm, `orderBy code desc`, parse số, `+1` `padStart(4)`. `Transaction.code` / `TitleService.code` `@unique`. `create` GD chỉ `rethrowOpenConflict` khi P2002 unique **lô mở**, không unique `code`. Sổ đỏ `create` không bắt P2002.
- **Problem:** Hai POST cùng lúc → cùng mã → 500. Không retry. (Sau `9999`, sort chuỗi `code` lệch độ dài — dễ cấp trùng `10000`; NEEDS VERIFICATION khi chưa có >9999 GD/năm.)
- **Root cause:** Đọc-sửa không transaction/`SERIAL`.
- **Impact:** NV/Admin bấm Lưu hai lần / hai tab: một bản 500, không rõ đã tạo chưa; retry có thể tạo GD/hồ sơ thứ hai (lô: unique mở chặn GD; sổ đỏ: hai hồ sơ cùng khách).
- **Evidence:** Hai `nextCode` giống nhau. Prisma `code String @unique`.
- **Status:** FIXED (2026-09-06) — Owner: tạo GD/SD retry tới 3 lần khi P2002 `code`; `nextCode` lấy max số (không sort chuỗi).

### BUG-055 — Lọc tài chính theo khoảng vẫn ra khách chưa nhập ngân sách

- **Severity:** MEDIUM
- **Module:** customers
- **File:** `apps/api/src/modules/customers/customers-filters.ts`, `apps/web/src/features/customers/display.ts`
- **Function:** `budgetFilterWhere`, `matchesBudgetFilter`
- **Vị trí code:** API `overlap`: `budgetMinVnd` null **hoặc** `lte rangeMax`; `budgetMaxVnd` null **hoặc** `gte rangeMin`. Cả hai null → cả hai nhánh OR đúng → dính `lt_1b` / `1b_2b` / `gt_2b`. FE: `lo = min ?? 0`, `hi = max ?? 9e15` — cùng nghĩa. Có filter riêng `none` / `has`.
- **Problem:** NV chọn «Dưới 1 tỷ» (hoặc 1–2 tỷ / trên 2 tỷ) vẫn thấy khách «Chưa xác định». FE/API cùng sai (không lệch nhau).
- **Root cause:** Null = không giới hạn thay vì loại khỏi khoảng.
- **Impact:** Sai list chăm sóc / gọi nhầm khách chưa khai ngân sách.
- **Evidence:** `budgetFilterWhere` `lt_1b`/`1b_2b`/`gt_2b`. `customer-list-page.tsx` gửi `budgetFilter`. `normalizeCareBudget` chỉ cho cả hai null hoặc cả hai số — không half-null.
- **Status:** FIXED (2026-09-06) — Owner: `lt_1b`/`1b_2b`/`gt_2b` chỉ khách có min+max; null không còn = vô hạn. Giữ `none`/`has`.

### BUG-056 — Không sửa được nội dung bài CMS sau khi tạo; tạo lại dễ hai bài published

- **Severity:** MEDIUM
- **Module:** public-content
- **File:** `apps/api/src/modules/public-content/admin-public-web.controller.ts`, `apps/api/src/modules/public-content/public-content.service.ts`, `apps/web/src/features/public-content/components/compose-post-dialog.tsx`, `apps/web/src/features/public-content/public-post-list-page.tsx`
- **Function:** `createPost`, `setPostStatus`, `uniquePostSlug`
- **Vị trí code:** API bài: `GET` list, `POST` tạo, `PATCH :id/status`. Không `PATCH` title/body/cover/slug. Dialog «Soạn bài viết» luôn `createPublicPost`. `uniquePostSlug` thêm `-2` khi trùng `(category, slug)`. `setPostStatus(PUBLISHED)` không đổi `publishedAt` nếu đã có. Gỡ về nháp không xóa hàng.
- **Problem:** Sai chính tả / ảnh / HTML: không Lưu đè. Admin soạn lại cùng tiêu đề → slug-2, xuất bản cả hai → hai URL khách. GPT «Dùng cho bài soạn» cũng `POST` mới.
- **Root cause:** Contract domain chỉ create + status; UI không edit.
- **Impact:** Bài trùng trên anhungland.com; SEO/nội dung lệch; nháp cũ tồn tại.
- **Evidence:** Controller không update body. `createPost` + `uniquePostSlug`. Domain bảng API §7 không có PATCH content.
- **Status:** OPEN (HOÃN — owner 2026-09-06: làm sau)

### BUG-057 — Đổi địa chỉ dự án sang đất dân không kiểm kho `ProjectLot`

- **Severity:** MEDIUM
- **Module:** addresses
- **File:** `apps/api/src/modules/addresses/addresses.service.ts`, `apps/web/src/features/addresses/addresses-manage-dialog.tsx`
- **Function:** `update`
- **Vị trí code:** `PROJECT` → `REGULAR`: chỉ chặn khi còn `AddressImage`. Không `count` `projectLots`. `listProjectLots` đòi `kind === PROJECT`. `mapAddressRow` `lodatCount`: PROJECT = `_count.projectLots`, REGULAR = `_count.lodats`.
- **Problem:** Admin bỏ tick dự án khi còn kho: lưu được. Picker lô kho 400 «không phải dự án». `Lodat.projectLotId` cũ vẫn sống. Badge «(N lô)» đổi sang đếm lô dân `addressId` — số kho biến mất trên sổ.
- **Root cause:** Đổi kind không XOR với `ProjectLot` (Restrict chỉ khi xóa Address).
- **Impact:** NV không gắn chủ kho; Admin tưởng dự án hết lô; dữ liệu mixed dân/kho.
- **Evidence:** `update` imageCount vs không `projectLot.findFirst`. `listProjectLots` kind check. Soft-hide địa chỉ cố ý không cascade (domain) — không ghi trùng; đây là đổi kind.
- **Status:** OPEN (HOÃN — owner 2026-09-06: làm sau)

### BUG-058 — Form tạo giao dịch (không gắn sẵn lô) chỉ picker 200 lô

- **Severity:** MEDIUM
- **Module:** transactions / lodats
- **File:** `apps/web/src/features/transactions/transaction-form-page.tsx`
- **Function:** `TransactionFormPage` `lodatsQ`
- **Vị trí code:** `enabled: mode === 'create' && !queryLodatId`. `listLodats({ limit: 200, includePaused: true })`. Không keyword/offset. Tạo từ chi tiết lô dùng `?lodatId=` — không dính.
- **Problem:** Admin/NV vào `/giao-dich/tao` tay: dropdown thiếu lô ngoài 200 `updatedAt`. Chọn nhầm lô mới hơn hoặc không tạo được GD lô cũ. API `create` nhận `lodatId` bất kỳ (trong quyền) — lệch UI/API.
- **Root cause:** Picker một trang max list lô.
- **Impact:** GD gắn sai lô / không tạo được; snapshot đóng băng lô nhầm.
- **Evidence:** `lodatsQ` `limit: 200`. `listLodats` API max 200/trang có `offset` nhưng form không trang.
- **Status:** FIXED (2026-09-06) — Owner: picker tìm keyword (debounce), không dump 200. `LodatSearchPicker` trên form tạo GD tay.

### BUG-059 — Đổi chủ khi giao dịch đang mở: TX trỏ map cũ, xóa GD sửa map inactive

- **Severity:** HIGH
- **Module:** lodats / transactions
- **File:** `apps/api/src/modules/lodats/lodats.service.ts`, `apps/api/src/modules/transactions/transactions.service.ts`, `apps/web/src/features/lodats/components/change-owner-modal.tsx`
- **Function:** `changeOwner`, `create`/`remove`/`findOpenId`
- **Vị trí code:** `changeOwner`: `updateMany` map `isActive: false` rồi `create` map mới; không đọc `Transaction`. Unique SQL `Transaction_lodatId_open_uidx` theo `lodatId`. `Transaction.lodatCustomerMapId` Restrict, không đổi. `remove` GD mở: `lodatCustomerMap.update` **đúng `row.lodatCustomerMapId`** (map đã đóng). Modal Đổi chủ không gọi `GET …/lodat/:id/open`. Lịch sử lô `listLodatTransactionHistory` theo `lodatId` (hiện GD cũ trên lô chủ mới).
- **Problem:** Flow: lô đang Đã cọc (GD mở) → Đổi chủ thành công → `/lo-dat` hiện Person mới + trạng thái form mới; `/giao-dich` vẫn GD mở gắn map/chủ cũ (snapshot + `freeTextName`). Tạo GD mới → 409. Xóa GD mở → map **cũ** (inactive) bị ép `DANG_BAN` (BUG-025 trên nhầm hàng); map active của chủ mới không đổi. Cùng NV hoặc Admin (BUG-028) đều dính.
- **Root cause:** Đổi chủ = đóng/mở map; GD = FK map lúc tạo + unique theo lô. Hai module không giao nhau.
- **Impact:** Sai chủ trên deal vs lô; không tạo GD chủ mới; xóa GD không sửa trạng thái rao bán đang hiện; thống kê/lịch sử lệch Person.
- **Evidence:** `changeOwner` transaction chỉ `LodatCustomerMap`/`Lodat`. `findOpenId({ lodatId })`. `remove` `where: { id: row.lodatCustomerMapId }`. Domain snapshot đóng băng lúc tạo — không giải thích đổi chủ khi deal mở.
- **Status:** OPEN

### BUG-060 — Xóa ảnh lô xóa R2 dù snapshot giao dịch còn trỏ cùng `objectKey`

- **Severity:** HIGH
- **Module:** lodats / transactions
- **File:** `apps/api/src/modules/lodats/lodats.service.ts`, `apps/api/src/storage/retarget-public-key.ts`, `apps/api/src/modules/transactions/transactions-snapshot.ts`
- **Function:** `deleteImage`, `countPublicImageKeyRefs`, `buildSnapshotCreate`
- **Vị trí code:** `deleteImage`: đếm `customerMessengerImage` + `lodatImage` rồi `storage.delete`. Không đếm `transactionSnapshotImage` / `transactionAttachment` / `addressImage`. `countPublicImageKeyRefs` (SEO rename, avatar) **có** snapshot. Snapshot GD copy cùng `objectKey` (+ `sourceLodatImageId` SetNull khi xóa hàng `LodatImage`).
- **Problem:** Tạo GD (đóng băng ảnh) → gỡ ảnh trên `/lo-dat` khi không còn bản lodat/chat khác → R2 mất. Chi tiết GD `storage.publicUrl(objectKey)` 404. Gallery lô đúng (đã xóa hàng); GD sai. Copy SEO `retarget` thì an toàn hơn xóa tay.
- **Root cause:** Hai đường xóa/đếm ref không cùng tập bảng.
- **Impact:** Mất bằng chứng ảnh deal; lệch FE lô vs FE GD.
- **Evidence:** `deleteImage` Promise.all chat+lodat. `countPublicImageKeyRefs` gồm `transactionSnapshotImage`. `buildSnapshotCreate` `objectKey` lodat/address.
- **Status:** OPEN

### BUG-061 — Xóa ảnh địa chỉ dự án luôn xóa object R2 — gãy lô, web khách, snapshot GD

- **Severity:** HIGH
- **Module:** addresses / lodats / public-content / transactions
- **File:** `apps/api/src/modules/addresses/addresses.service.ts`
- **Function:** `deleteImage`
- **Vị trí code:** Xóa hàng `AddressImage` rồi `storage.delete` trong `try`, **không** `countPublicImageKeyRefs`. Lô dự án gallery đọc `projectLot.address.images`. Catalog `coverUrl`/`imageUrls` lấy ảnh địa chỉ kho. Snapshot GD dự án copy `addr.images` `objectKey`.
- **Problem:** Admin gỡ 1 ảnh dự án trên sổ địa chỉ → CDN 404 trên mọi `Lodat` trỏ kho, trang `/mua-ban-…/[slug]`, GD đã snapshot. `LodatImage` dân không dính; kho không nhân ảnh lên `LodatImage`.
- **Root cause:** Ảnh dự án dùng chung một key; xóa địa chỉ coi là exclusive owner.
- **Impact:** Một thao tác sổ địa chỉ phá list lô + Đăng web + hồ sơ GD.
- **Evidence:** `addresses.service.ts` `deleteImage` vs `lodats` `ADDRESS_INCLUDE.images`. `public-content.service.ts` `imageUrls` project address. `transactions-snapshot.ts` nhánh `projectLotId && addr?.images`.
- **Status:** CLOSED (by design, 2026-09-07) — Owner: ảnh dự án **dùng chung** có chủ đích. Admin xóa/đổi = ảnh đó hết giá trị với dự án; gallery lô CRM + Đăng web **đọc live** `AddressImage` nên cập nhật theo. Không copy nhân bản theo NV. GD đã tạo: snapshot đã đóng băng (sau BUG-060 = file riêng) — không đổi theo kho; chấp nhận.

### BUG-062 — Sửa lô CRM không cập nhật overlay Đăng web (title/location); catalog trộn dữ liệu cũ và mới

- **Severity:** MEDIUM
- **Module:** lodats / public-content
- **File:** `apps/api/src/modules/lodats/lodats.service.ts`, `apps/api/src/modules/public-content/public-content.service.ts`
- **Function:** `update` (lodats), `toCatalog` / `toAdminRow`
- **Vị trí code:** `lodats.update` ghi `Lodat`/`LodatCustomerMap` — không `publicLotListing.update`. `toCatalog`: `title`/`location`/`excerpt` từ **hàng listing**; `areaM2`/`frontageM`/`direction`/`saleStatus`/`coverImageUrl` từ **lodat live**.
- **Problem:** NV đổi tiêu đề hoặc địa chỉ dân trên `/lo-dat` → CRM đúng; anhungland.com vẫn H1/địa chỉ overlay. Khách thấy DT/MT/ảnh/công tắc Mở bán mới + tên cũ. Sửa giá map không đổi `priceLabel` overlay (cố ý làm mờ) — title/location thì NV tưởng «sửa lô = sửa web».
- **Root cause:** Overlay copy độc lập; `update` lô không sync; catalog đọc mixed sources.
- **Impact:** SEO/nội dung khách sai; lệch dashboard preview (`cover` live, `title` overlay).
- **Evidence:** `lodats.update` không prisma `publicLotListing`. `toCatalog` `row.title` vs `lodat.areaM2`. Domain: Đăng web ≠ mọi lô Mở bán — không nói sửa lô tự đẩy title.
- **Status:** OPEN

### BUG-063 — Ẩn Person không cắt GD, sổ đỏ, chat API, chủ trên lô

- **Severity:** MEDIUM
- **Module:** customers / lodats / transactions / title-services / messenger
- **File:** `apps/api/src/modules/customers/customers.service.ts`, `apps/api/src/modules/transactions/transactions.service.ts`, `apps/api/src/modules/title-services/title-services.service.ts`, `apps/api/src/modules/lodats/lodats.service.ts`
- **Function:** `update` (`isHidden`), `assertPartyCustomers`, `list`/`update` title-services, `listMessages`, `LIST_INCLUDE` maps
- **Vị trí code:** Ẩn = `Customer.isHidden = true` (không xóa hàng). Chặn tạo: lô, sổ đỏ, care. **Không** chặn: `assertPartyCustomers` (không đọc `isHidden`); title `update`/`addProgress`/`addMoney`/`addAttachment`; `listMessages`; list lô `maps.customer` không lọc ẩn. List khách mặc định `isHidden: false` nên Person «biến» khỏi `/khach-hang`.
- **Problem:** Flow xóa mềm: NV ẩn khách → list khách trống; `/lo-dat` vẫn chủ (mở rộng BUG-027); tạo GD mới vẫn chọn/gắn `customerId` đã ẩn nếu biết ID hoặc prefill chủ map; sổ đỏ đang làm vẫn sửa; `GET /customers/:id/messages` vẫn trả chat. Khôi phục (`isHidden: false`) không sửa map/GD.
- **Root cause:** `isHidden` chỉ cửa list + một số create; không phải cascade nghiệp vụ.
- **Impact:** Person «đã xóa» vẫn là chủ/bên GD/hồ sơ sổ/chat; audit/GD lệch list khách.
- **Evidence:** `create` lodat/title check `isHidden`. `assertPartyCustomers` chỉ `id` + `employeeId`. `listMessages` không `isHidden`. BUG-027 chỉ map; đây là các module còn lại trên cùng cờ.
- **Status:** OPEN

### BUG-064 — Xóa User không precheck FK phụ — 500 Restrict dù không còn khách/lô/GD/sổ đỏ

- **Severity:** MEDIUM
- **Module:** users
- **File:** `apps/api/src/modules/users/users.service.ts`, `apps/api/prisma/schema.prisma`
- **Function:** `remove`
- **Vị trí code:** Đếm `customer.employeeId`, `lodat`/`transaction`/`titleService` `createdByEmployeeId`. `user.delete`. Schema: `CustomerCareNote.employeeId` không `onDelete` (Restrict); `TitleServiceProgress`/`Money`/`Attachment` `createdBy` Restrict; `TitleServiceAttachmentView.viewedBy` Restrict. `Lodat`/`Transaction`/`TitleService` creator Restrict (đã đếm). `PublicLotShare` Cascade. `EmployeeHotline` Cascade vs `Customer.sourceHotlineId` Restrict — đã chặn nếu còn khách của NV đó.
- **Problem:** Admin từng ghi chăm sóc / bước sổ đỏ / xem file trên hồ sơ **NV khác** (hoặc progress trên hồ sơ mình đã chuyển…), rồi xóa hết khách/lô/GD/sổ của chính Admin → UI cho xóa → P2003 500, không câu «vô hiệu hóa». Disable thì JWT CRM còn (BUG-001) / share public tắt (BUG-036).
- **Root cause:** Precheck không phủ mọi Restrict.
- **Impact:** Không xóa được user «sạch» khách; Admin tưởng xóa xong; lỗi không rõ.
- **Evidence:** `remove` bốn `count`. Prisma care note / title progress / view log không Cascade.
- **Status:** OPEN

### BUG-065 — Import Messenger ghi `employeeFacebookUid` không chứng thực profile NV; không API gắn UID

- **Severity:** MEDIUM
- **Module:** customers / messenger / users
- **File:** `apps/api/src/modules/customers/from-extension.service.ts`, `apps/api/src/modules/customers/customers-phone.ts`, `apps/api/scripts/migrate-facebook-profiles-from-legacy.ts`
- **Function:** `createCustomer`, `touchExisting`, `listContactChannels`
- **Vị trí code:** `employeeId` = JWT. `employeeFacebookUid` = `fields.employeeUid` từ payload scanner, không `EmployeeFacebookProfile.find`. `touchExisting` chỉ ghi UID nếu hàng đang trống. Profile chỉ script migrate — không CRUD Nest. Lọc `fb:{uid}` theo `customerFacebook.employeeFacebookUid` trong phạm vi khách của JWT.
- **Problem:** Flow JWT NV A + extension gửi UID nick B (máy chung / sai field): Person thuộc A, kênh liên hệ hiện nick B (nếu migrate) hoặc raw UID. Lọc «Facebook B» ra khách của A. NV mới không có hàng profile → nhãn kênh = UID. Không gắn/sửa UID NV trên `/quan-tri/nguoi-dung`.
- **Root cause:** Ingest tin client; User và Messenger không cùng bảng profile lúc runtime.
- **Impact:** Sai nhóm kênh/thống kê nick; khó biết chat thuộc nick nào; trùng Person theo thread vẫn BUG-013.
- **Evidence:** `from-extension.service.ts` gán `fields.employeeUid`. Grep `employeeFacebookProfile.create` chỉ script migrate. `contactChannelWhere` `fb:`.
- **Status:** OPEN

### BUG-066 — Slug lô từ editor/GPT không chạy `toPublicSlug`

- **Severity:** HIGH
- **Module:** public-content / slug
- **File:** `apps/api/src/modules/public-content/public-content.service.ts`, `packages/shared/src/public-content.ts`, `apps/web/src/features/public-content/lot-gpt-apply.ts`, `apps/web/src/features/public-content/components/lot-listing-editor-dialog.tsx`
- **Function:** `updateDraft`, `uniqueSlug`, `lotGptToEditorPrefill`, `parsedInput`
- **Vị trí code:** `createPost` gọi `toPublicPostSlug(dto.slug \|\| title)`. `updateDraft`: `slugHint = dto.slug?.trim()` rồi `uniqueSlug(slugHint)` — `uniqueSlug` chỉ `reservePublicLotSlug` (đổi đúng chuỗi `xa`). `updatePublicListingDraftSchema.slug` = `z.string().trim().min(1).max(200)` không regex. GPT: `slug: result.slug.trim()` không `toPublicSlug`.
- **Problem:** NV/GPT gửi slug có dấu tiếng Việt, hoa, khoảng trắng, `!`, `/` → ghi DB nguyên. URL `/mua-ban-nha-dat-huyen-nam-sach/{raw}` encode lệch, hai lô `Foo` vs `foo` cùng unique Postgres (case-sensitive). Tạo mới không gửi slug thì `toListingPublicSlug` vẫn ASCII đúng.
- **Root cause:** Hai đường: generate từ title thì slugify; đường overlay/GPT tin client.
- **Impact:** URL gãy / trùng gần giống; crawler/index lệch; không ổn định so với bài CMS.
- **Evidence:** `uniqueSlug` vs `toPublicPostSlug` trong `createPost`. Schema slug lô vs `toPublicSlug` NFD + `[^a-z0-9]`.
- **Status:** OPEN

### BUG-067 — `uniqueSlug` không chừa bảng 301 — listing mới chiếm URL cũ

- **Severity:** HIGH
- **Module:** public-content / slug
- **File:** `apps/api/src/modules/public-content/public-content.service.ts`, `apps/web/src/features/public/listing-detail-route.tsx`
- **Function:** `uniqueSlug`, `recordLotSlugChange`, `redirectIfLegacySlug`
- **Vị trí code:** `uniqueSlug` `while (publicLotListing.findUnique({ slug }))`. `PublicLotSlugRedirect.fromSlug` unique riêng. HTML: `getPublicListingBySlug` trước, chỉ khi null mới `getPublicLotSlugRedirect` → `permanentRedirect`.
- **Problem:** Lô A đổi slug `cu`→`moi` (301 `cu`→`moi`). Lô B publish nhận `cu` vì listing table trống. Guest/`Google` mở URL cũ ra B (200), không 301 về A. Chuỗi redirect A chết khi còn hàng redirect (không bao giờ đọc).
- **Root cause:** Unique guest URL = unique listing slug, không gồm `fromSlug`.
- **Impact:** Backlink/index của URL cũ đổi nội dung; duplicate/sai listing; 301 thành dead.
- **Evidence:** `uniqueSlug` không query `publicLotSlugRedirect`. `ListingDetailRoute` thứ tự fetch listing rồi redirect.
- **Status:** OPEN

### BUG-068 — Hub `/xa/…` không lưu slug, đổi theo tập lô, không 301

- **Severity:** HIGH
- **Module:** public-content / hub
- **File:** `apps/api/src/modules/public-content/public-listing-hub-slugs.ts`, `apps/api/src/modules/public-content/public-content.service.ts`
- **Function:** `buildHubSlugMaps`, `loadPublishedCatalog`, `listCommuneHubs` / `getCommuneHubDetail`
- **Vị trí code:** `commune` slug = `toPublicSlug(wardName, 60)`; nếu cùng tên xã >1 huyện trong **tập geo hiện tại** thì thêm `-${district}`. Place = `toPublicSlug(address.detail, 60)`. Không model hub; không `PublicLotSlugRedirect` cho `/xa/`. Đổi tên xã/thôn, ẩn ward (`addressGeo` → null), hoặc còn 1 huyện → slug đổi. `getCommuneHubDetail` 404 nếu không còn listing khớp slug cũ.
- **Problem:** URL hub là hàm của catalog sống. Google index `/xa/dong-lac-nam-sach` rồi tập lô đổi → 404, không 301 sang `/xa/dong-lac`. Sửa `Address.detail`/ward đổi place/commune slug im lặng.
- **Root cause:** Hub derived, không identity ổn định + không redirect table.
- **Impact:** Mất URL đã index; internal link cũ gãy; sitemap `lastmod` URL mới, URL cũ biến mất không báo crawler.
- **Evidence:** `buildHubSlugMaps` `districts.size > 1`. Prisma không `PublicListingHub`. Redirect chỉ `PublicLotSlugRedirect` (lô).
- **Status:** OPEN

### BUG-069 — Hub slug trang chi tiết lô lệch catalog/sitemap — link nội bộ 404

- **Severity:** HIGH
- **Module:** public-content / hub
- **File:** `apps/api/src/modules/public-content/public-content.service.ts`, `apps/web/src/features/public/listing-seo.ts`, `apps/web/src/features/public/related-listings.ts`
- **Function:** `getPublishedBySlug` / `loadHubMapsForPublished` vs `loadPublishedCatalog`, `listingCommuneHubCrumb`, `pickSameCommuneSection`
- **Vị trí code:** `loadHubMapsForPublished`: mọi `isPublished: true` (gồm Tạm dừng). `loadPublishedCatalog`: `rows.filter(isOpenSale)` rồi `buildHubSlugMaps`. `getPublishedBySlug` gắn `communeSlug` từ maps «mọi published». Catalog/hub/sitemap dùng maps «chỉ Mở bán». Breadcrumb + «Xem tất cả» dùng `listing.communeSlug`.
- **Problem:** Có lô published nhưng Tạm dừng ở xã trùng tên huyện khác → chi tiết lô đang Mở bán nhận slug có hậu tố huyện; hub thật (catalog) không hậu tố (hoặc ngược). `href` `/xa/{slug-chi-tiet}` 404. Cùng lúc BUG-023: slug lô paused vẫn 200.
- **Root cause:** Hai hàm build hub maps, hai tập lô.
- **Impact:** JSON-LD BreadcrumbList + HTML nav trỏ URL hub không tồn tại (broken internal link, crawl trap).
- **Evidence:** `getPublishedBySlug` gọi `loadHubMapsForPublished`. `listPublished`/`listCommuneHubs` gọi `loadPublishedCatalog`. `listingCommuneHubCrumb` / `hubHref: listingCommuneHubPath(communeSlug)`.
- **Status:** OPEN

### BUG-070 — On-demand revalidate bỏ hub; Tạm dừng / sửa địa chỉ không làm mới sitemap-catalog

- **Severity:** HIGH
- **Module:** public-content / ISR
- **File:** `apps/api/src/modules/public-content/public-web-revalidate.service.ts`, `apps/api/src/modules/lodats/lodats.service.ts`, `apps/api/src/modules/addresses/addresses.service.ts`, `apps/web/app/sitemap.ts`, `apps/web/app/(public)/mua-ban-nha-dat-huyen-nam-sach/xa/**/page.tsx`
- **Function:** `revalidateListing`, `updateSaleStatus`, `AddressService.update`
- **Vị trí code:** `revalidateListing` paths: `/{listingPath}/{slug}`, catalog, `/sitemap.xml`, đôi khi `/`. Không `listingCommuneHubPath` / place. Hub/catalog/sitemap `export const revalidate = false` (chỉ ISR khi revalidate). `updateSaleStatus` chỉ map status + `lodat.updatedAt` — không `PublicWebRevalidateService`. `addresses.update` không revalidate.
- **Problem:** (1) Đăng/gỡ lô: HTML hub `/xa/…` cache cũ (thiếu/thừa listing) dù sitemap có thể đã cập nhật. (2) Tạm dừng: catalog+sitemap HTML cũ vẫn list lô cho tới sự kiện publish khác; sau đó sitemap bỏ URL nhưng chi tiết vẫn 200 (BUG-023) = orphan. (3) Đổi ward/`detail` (BUG-068): hub URL đổi, cache+sitemap cũ.
- **Root cause:** Revalidate gắn publish overlay, không gắn sale/address; path list thiếu hub.
- **Impact:** Sitemap/HTML lệch nhau; crawler index URL stale hoặc bỏ URL còn 200.
- **Evidence:** `revalidateListing` array paths. Grep `PublicWebRevalidate` chỉ `public-content.service`. Hub pages `revalidate = false`.
- **Status:** OPEN

### BUG-071 — Sitemap luôn đưa 6 URL chuyên mục bài, kể cả chuyên mục trống

- **Severity:** MEDIUM
- **Module:** public-content / sitemap
- **File:** `apps/web/app/sitemap.ts`, `apps/web/src/features/public/post-seo.ts`, `apps/web/app/(public)/[category]/page.tsx`
- **Function:** `sitemap`, `categoryListMetadata`
- **Vị trí code:** `categoryPages = Object.values(PublicPostCategory).map` → `/tin-tuc` `/du-an` `/kien-thuc` `/kinh-nghiem` `/lien-he` `/chinh-sach` không đếm `listSitemapPosts`. Trang list: `robots: publicSearchRobots()` (index khi cờ SEO bật); empty state «Hiện chưa có bài…».
- **Problem:** `lien-he` / `chinh-sach` (và chuyên mục tin chưa có bài) được khai trong sitemap + indexable, nội dung mỏng/trùng description mẫu.
- **Root cause:** Sitemap emit enum, không filter `posts.length`.
- **Impact:** Index thin/empty; «Chính sách bảo mật» trống nếu chưa soạn bài.
- **Evidence:** `sitemap.ts` `categoryPages` vs `articles` từ posts. `PublicPostCategory` 6 giá trị. `categoryListMetadata` luôn canonical category URL.
- **Status:** OPEN

### BUG-072 — Guest API lỗi bị nuốt → sitemap/catalog rỗng, slug thành 404 giả

- **Severity:** HIGH
- **Module:** public web / sitemap
- **File:** `apps/web/src/features/public-content/api.ts`, `apps/web/app/sitemap.ts`, `apps/web/src/features/public/listing-detail-route.tsx`
- **Function:** `listPublishedCatalog`, `getPublishedCatalogBySlug`, `getPublicLotSlugRedirect`
- **Vị trí code:** `listPublishedCatalog` `catch { return [] }` (mọi lỗi, không chỉ build). `getPublishedCatalogBySlug`: không phải `ApiError` 404 cũng `return null`. `getPublicLotSlugRedirect` tương tự. Sitemap `revalidate = false` ghi đè bằng kết quả rỗng. Chi tiết: null listing + null redirect → `notFound()`.
- **Problem:** Nest timeout/5xx lúc generate sitemap hoặc lúc Googlebot hit detail: sitemap mất toàn bộ URL lô/hub/bài (còn home + catalog + 6 category); URL lô đang sống trả 404 → rủi ro deindex.
- **Root cause:** Fail-soft cho `next build` dùng luôn lúc runtime ISR/request.
- **Impact:** Crawl thấy nội dung «biến»; soft 404 hàng loạt.
- **Evidence:** comment «next build: API chưa chạy». `sitemap.ts` `listSitemapListings` → `listPublishedCatalog`. `buildListingDetailMetadata` unpublished khi `!listing`.
- **Status:** OPEN

### BUG-073 — 301 slug lô không kiểm tra đích còn published / Mở bán

- **Severity:** MEDIUM
- **Module:** public-content / redirect
- **File:** `apps/api/src/modules/public-content/public-content.service.ts`, `apps/web/src/features/public/listing-detail-route.tsx`
- **Function:** `findLotSlugRedirect`, `redirectIfLegacySlug`
- **Vị trí code:** `findLotSlugRedirect` `select: { toSlug: true }` không join listing. `permanentRedirect(listingHref(toSlug))` luôn. `GET /public/listings/:slug` không đọc bảng redirect (404).
- **Problem:** Gỡ Đăng web / xóa overlay / Tạm dừng (BUG-023): URL cũ vẫn 301 tới slug hiện tại rồi 404 hoặc 200 lô không rao. Google gộp tín hiệu vào URL chết/sai.
- **Root cause:** Redirect table không gắn lifecycle listing.
- **Impact:** Chuỗi 301→404; crawl budget; tín hiệu về URL không index được.
- **Evidence:** `findLotSlugRedirect` vs `getPublishedBySlug` `!row?.isPublished`. Không `isOpenSale` trên redirect.
- **Status:** OPEN

### BUG-074 — Xóa lô không xóa `PublicLotSlugRedirect` — 301 mồ côi

- **Severity:** MEDIUM
- **Module:** public-content / redirect
- **File:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/public-content/public-content.service.ts`
- **Function:** `PublicLotListing` `onDelete: Cascade` từ `Lodat`; model `PublicLotSlugRedirect`
- **Vị trí code:** `PublicLotSlugRedirect` không FK `toSlug`/`lodatId`. Xóa `Lodat` cascade listing + shares. Redirect `fromSlug`/`toSlug` còn. `recordLotSlugChange` không chạy lúc xóa.
- **Problem:** URL cũ 301 mãi tới slug đã mất → 404 (BUG-073). `uniqueSlug` vẫn có thể tái sử dụng `fromSlug` (BUG-067) hoặc để 301 chết.
- **Root cause:** Redirect không thuộc vòng đời listing.
- **Impact:** 301 vĩnh viễn tới 404; bảng redirect phình.
- **Evidence:** schema `PublicLotSlugRedirect` không relation. `Lodat` → `PublicLotListing` Cascade. Grep xóa redirect chỉ `recordLotSlugChange` / script regenerate.
- **Status:** OPEN

### BUG-075 — Không có file `/og-default.png` trong app public

- **Severity:** MEDIUM
- **Module:** public web / Open Graph
- **File:** `apps/web/src/features/public/site.ts`, `apps/web/app/(public)/layout.tsx`, `apps/web/src/features/public/listing-seo.ts`, `apps/web/src/features/public/post-seo.ts`, `apps/web/src/features/public/listing-hub-seo.ts`
- **Function:** `PUBLIC_OG_DEFAULT`, `listingOgImage`, layout `openGraph.images`
- **Vị trí code:** `PUBLIC_OG_DEFAULT = '/og-default.png'`. `apps/web/public/` chỉ `brand/*.svg` — không `og-default.png`. Listing/bài/hub không bìa → `toAbsoluteUrl('/og-default.png')`. JSON-LD `listingImageObjectsJsonLd` / `postArticleJsonLd` fallback cùng URL. Sitemap cố ý bỏ OG default (`isBrandOgFallback`).
- **Problem:** Trang chủ, catalog, hub, bài/lô thiếu bìa: `og:image` / Twitter `summary_large_image` trỏ 404 trên origin. Preview MXH hỏng; ImageObject `contentUrl` 404.
- **Root cause:** Hằng số fallback, asset không commit.
- **Impact:** OG sai; rich preview fail. (Production có thể có file ngoài git — repo/deploy từ git thì thiếu.)
- **Evidence:** Glob `og-default.png` = 0. `apps/web/public/brand/` chỉ 2 SVG.
- **Status:** OPEN

### BUG-076 — Category không hợp lệ: noindex nhưng canonical có thể kế thừa trang chủ

- **Severity:** MEDIUM
- **Module:** public web / canonical
- **File:** `apps/web/app/(public)/[category]/page.tsx`, `apps/web/app/(public)/layout.tsx`, `apps/web/src/features/public/post-seo.ts`
- **Function:** `generateMetadata` (category list)
- **Vị trí code:** `isPublicPostCategory` false → `{ title: 'Không tìm thấy', robots: { index: false, follow: false } }` — không `alternates.canonical: null`. Layout public `canonical: PUBLIC_SITE_ORIGIN`. `unpublishedPostMetadata` / `unpublishedListingMetadata` / `not-found.tsx` / `unpublishedHubMetadata` thì gán `canonical: null`. Page sau đó `notFound()`.
- **Problem:** URL `/khong-phai-chuyen-muc` (và segment lạ khác khớp `[category]`) có thể emit canonical homepage trên response 404/noindex — tín hiệu «trang này = trang chủ».
- **Root cause:** Nhánh metadata invalid category thiếu bước gỡ canonical mà các 404 public khác đã làm.
- **Impact:** Soft-404 gắn homepage; merge/index nhầm. (Next có thể ghi đè bằng `not-found.tsx` — nếu merge layout+page thì lỗi còn.)
- **Evidence:** `[category]/page.tsx` generateMetadata vs `unpublishedPostMetadata` `canonical: null`. Layout `alternates.canonical`.
- **Status:** OPEN

### BUG-077 — Hai địa chỉ khác nhau có thể cùng một hub slug

- **Severity:** MEDIUM
- **Module:** public-content / hub
- **File:** `apps/api/src/modules/public-content/public-listing-hub-slugs.ts`
- **Function:** `buildHubSlugMaps`
- **Vị trí code:** Place key = `wardId|detail.trim().toLowerCase()` (chưa slugify). `slug: toPublicSlug(geo.detail, 60, 'khu')` không unique trong commune. Hai `detail` khác («KĐT ABC» vs «KDT ABC», cắt 60 ký tự, chỉ khác dấu) → hai entry, **cùng** `placeSlug`. `listPlaceHubs` gộp `byKey = communeSlug/pSlug`. Commune: hai `wardId` cùng tên (sau NFD) không hậu tố huyện → cùng `commune` slug, `listCommuneHubs` gộp `bySlug`.
- **Problem:** Một URL hub trộn listing hai khu/xã; `label` = sample đầu; title/H1/JSON-LD ItemList sai địa bàn.
- **Root cause:** Unique hub theo label thô, URL theo slug gập.
- **Impact:** Duplicate content / sai entity trên URL đang index; không tách được hai khu.
- **Evidence:** `placeByWardDetail.set` không check slug đã dùng. `listPlaceHubs` key `${cSlug}/${pSlug}`.
- **Status:** OPEN

### BUG-078 — Không ràng buộc unique `title` / `seoTitle` — trùng thẻ title trên nhiều URL

- **Severity:** MEDIUM
- **Module:** public-content / metadata
- **File:** `apps/api/prisma/schema.prisma`, `apps/web/src/features/public/listing-seo.ts`, `apps/web/src/features/public/post-seo.ts`, `apps/api/src/modules/public-content/public-content.service.ts`
- **Function:** `listingMetadata`, `postMetadata`, `uniqueSlug` / `uniquePostSlug`
- **Vị trí code:** Unique DB: `PublicLotListing.slug`; `PublicPost` `@@unique([category, slug])`. Không unique `title`/`seoTitle`/`metaDescription`. `listingSeoTitle` = seoTitle hoặc H1. GPT/NV trùng tiêu đề → slug `-2` nhưng `<title>` giống. `clipMetaDescription` cùng excerpt mẫu → meta description trùng.
- **Problem:** Hai URL published khác slug, cùng document title (và có thể cùng description). Search Console duplicate title; SERP khó chọn URL.
- **Root cause:** Định danh SEO = slug, không phải title.
- **Impact:** Trùng title/description trên index. Bài: cộng BUG-056 (tạo lại → slug-2, cả hai published).
- **Evidence:** schema unique. `listingMetadata` `title: seoTitle`. `postMetadata` `title: post.title`.
- **Status:** OPEN

### BUG-079 — Mock demo đè gallery/mô tả listing thật khi trùng slug

- **Severity:** LOW
- **Module:** public web
- **File:** `apps/web/src/features/public/product-detail.tsx`, `apps/web/src/features/public/mock-data.ts`
- **Function:** `listingImages`, `ProductDetailView`
- **Vị trí code:** `listingImages`: nếu `getProductBySlug(listing.slug)?.gallery` thì **return gallery Unsplash**, bỏ `listing.imageUrls`. Body: `fallbackBody = product?.description`; `highlights = product?.highlights`. Metadata/OG/sitemap dùng API (`listingSeoImageUrls`), không mock.
- **Problem:** Overlay slug trùng slug demo (`nen-tho-cu-long-thanh-mat-tien`, …) → HTML khách ảnh/mô tả giả, OG/sitemap ảnh CDN thật. Lệch on-page vs structured data.
- **Root cause:** Fallback mock còn trong trang production.
- **Impact:** Nội dung sai; ImageObject ≠ gallery DOM. Xác suất thấp (slug demo cụ thể).
- **Evidence:** `getProductBySlug` trong `product-detail.tsx`. `mock-data.ts` `GALLERY.house` Unsplash.
- **Status:** OPEN

### BUG-080 — Slug lô không giới hạn độ dài khi generate từ title+địa chỉ

- **Severity:** LOW
- **Module:** public-content / slug
- **File:** `packages/shared/src/public-content.ts`, `apps/api/src/modules/public-content/public-content.service.ts`
- **Function:** `toListingPublicSlug`, `toPublicSlug`, `uniqueSlug`
- **Vị trí code:** Comment: `maxLen <= 0` — không cắt (lot URLs). `toListingPublicSlug` → `toPublicSlug(combined, 0, 'lo-dat')`. Title overlay max 160 + location 240. `uniqueSlug` có thể thêm `-n`. Zod `slug` max 200 chỉ khi client gửi `dto.slug`; create publish auto không qua cap đó. Hub vẫn `maxLen` 60.
- **Problem:** URL guest hàng trăm ký tự (title lặp địa chỉ). Cắt giữa từ không xảy ra (cố ý) nhưng crawler/CDN/log/OG URL phình; một số công cụ cắt URL.
- **Root cause:** Lot slug cap = 0; schema 200 không áp generate server.
- **Impact:** URL khó chia sẻ; rủi ro cắt/normalize phía proxy. Không làm hai lô trùng slug (vẫn unique).
- **Evidence:** `toPublicSlug` `if (maxLen > 0 && slug.length > maxLen)`. `setPublished` `uniqueSlug(toListingPublicSlug(title, location))`.
- **Status:** OPEN

### BUG-081 — Title trang chủ lặp tên thương hiệu

- **Severity:** MEDIUM
- **Module:** public web / metadata
- **File:** `apps/web/app/layout.tsx`, `apps/web/app/(public)/layout.tsx`
- **Function:** `metadata.title` (root template + public default)
- **Vị trí code:** Root `title.template = '%s \| An Hưng Land'`. Public layout `title.default = 'An Hưng Land — Văn phòng giao dịch bất động sản'` (đã chứa brand). Trang `/` không `generateMetadata` riêng.
- **Problem:** SERP/tab hiện `An Hưng Land — Văn phòng giao dịch bất động sản | An Hưng Land`.
- **Root cause:** Default title đã có brand rồi bị template layout cha gắn thêm `\| An Hưng Land`.
- **Impact:** Title trang chủ trùng brand; cắt SERP; lệch OG `title` (OG không lặp suffix).
- **Evidence:** Live `GET https://anhungland.com/` (UA Chrome, 2026-09-03) `<title>An Hưng Land — Văn phòng giao dịch bất động sản | An Hưng Land</title>`. Listing/bài không lặp (generateMetadata `seoTitle` không chứa brand).
- **Test account:** guest (không đăng nhập)
- **Thao tác đã thực hiện:** Mở trang chủ, đọc `<title>` HTML.
- **Kết quả thực tế:** Brand xuất hiện hai lần, cách bởi ` | `.
- **Kết quả mong đợi:** Một lần tên thương hiệu, ví dụ `An Hưng Land — Văn phòng giao dịch bất động sản`.
- **Cách tái hiện:** Mở `https://anhungland.com/` → xem title tab hoặc View Source `<title>`.
- **Status:** OPEN

### BUG-082 — `/dashbroad` không redirect, trả 200 HTML đã prerender

- **Severity:** MEDIUM
- **Module:** public web / CRM
- **File:** `apps/web/app/(crm)/dashbroad/page.tsx`
- **Function:** `DashbroadAliasPage`
- **Vị trí code:** Server `redirect('/dashboard')`. Live: `GET /dashbroad` **không** `Location`; `HTTP/2 200`; `x-nextjs-prerender: 1`; `x-nextjs-cache: HIT`; `cache-control: s-maxage=31536000`. Body HTML CRM (`boot-screen` / RSC có chuỗi `dashbroad` và `dashboard`).
- **Problem:** Alias «gõ sai» không 307/308. Guest nhận 200 «Đang tải…» rồi JS đẩy `/login`, không đi `/dashboard`. URL sai vẫn 200 (robots Disallow path này).
- **Root cause:** `(crm)/layout.tsx` client + trang `redirect()` bị prerender/cache thành 200 thay vì Response redirect.
- **Impact:** Bookmark/gõ sai không vào Dashboard; URL thừa 200; cache CDN/Next cực dài.
- **Evidence:** Live curl không follow redirect, 2026-09-03. Source comment «Alias gõ sai — chuyển sang `/dashboard`».
- **Test account:** guest
- **Thao tác đã thực hiện:** `GET https://anhungland.com/dashbroad` không follow.
- **Kết quả thực tế:** 200 + HTML, không header `Location`.
- **Kết quả mong đợi:** 307/308 `Location: /dashboard` (rồi guest mới bị đẩy login).
- **Cách tái hiện:** Trình duyệt ẩn / cửa sổ mới → mở `/dashbroad` → URL không đổi thành `/dashboard` trên response đầu (có thể chỉ đổi sau hydrate).
- **Status:** OPEN

### BUG-083 — STAFF mở được stub Quản trị khách (không guard)

- **Severity:** MEDIUM
- **Module:** web authz / customers
- **File:** `apps/web/app/(crm)/quan-tri/khach-hang/page.tsx`, `apps/web/src/shared/ui/placeholder-page.tsx`
- **Function:** `QuanTriKhachHangPage`
- **Vị trí code:** Chỉ `PlaceholderPage` — không `useAuth` / `router.replace`. Khác `/quan-tri/nguoi-dung` (`UserAdminPage` đẩy STAFF về `/khach-hang`) và `/cai-dat/dia-chi`. Nav «Quản trị khách» chỉ hiện với ADMIN (`layout.tsx`).
- **Problem:** User `kha` gõ URL `/quan-tri/khach-hang` thấy H1 «Quản trị khách hàng» và «Registry toàn hệ thống (ADMIN) — triển khai ở P4.» — không redirect. Không có bảng khách toàn hệ thống (stub).
- **Root cause:** Route placeholder quên chặn role; CRM authz chủ yếu client (BUG-012) nhưng các trang admin khác vẫn redirect.
- **Impact:** Lộ mặt trang admin; khi P4 gắn registry thật mà quên guard thì STAFF xem khách toàn công ty. Hiện chưa rò dữ liệu list.
- **Evidence:** Source không check role. Browser 2026-09-03 tài khoản kha: URL giữ `/quan-tri/khach-hang`, đúng copy stub.
- **Test account:** kha
- **Thao tác đã thực hiện:** Đăng nhập kha → mở trực tiếp `https://anhungland.com/quan-tri/khach-hang`.
- **Kết quả thực tế:** Trang stub ADMIN render đủ.
- **Kết quả mong đợi:** Redirect `/khach-hang` (cùng rule `/quan-tri/nguoi-dung`).
- **Cách tái hiện:** Login user `kha` → dán `/quan-tri/khach-hang` trên `anhungland.com`.
- **Status:** FIXED (2026-09-04) — Cùng middleware BUG-012: STAFF + `/quan-tri/*` → redirect `/khach-hang` trước khi render stub.

