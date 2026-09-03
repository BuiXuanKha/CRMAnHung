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
| ID tiếp theo | `BUG-047` |
| Tổng bug đã ghi | 46 |
| OPEN | 46 |
| NEEDS VERIFICATION | 0 |
| FIXED / CLOSED | 0 |
| Lần audit gần nhất | 2026-09-03 — Messenger ingest (`from-extension`) / tin đã lưu / mapping UID–thread–Person |

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

## Bản đồ module (quan sát cấu trúc, chưa audit)

Danh sách dưới đây chỉ phản ánh **thư mục/code hiện có**. Không phải kết luận audit.

| Module (code) | API | Web | Ghi chú |
|---------------|-----|-----|---------|
| auth | `apps/api/src/modules/auth` | `apps/web/src/features/auth` | Đăng nhập / JWT |
| users | `apps/api/src/modules/users` | `apps/web/src/features/users` | Quản trị user, hotline |
| customers | `apps/api/src/modules/customers` | `apps/web/src/features/customers` | Khách hàng, care, phone, extension ingest |
| addresses | `apps/api/src/modules/addresses` | `apps/web/src/features/addresses` | Địa chỉ, đơn vị hành chính |
| lodats | `apps/api/src/modules/lodats` | `apps/web/src/features/lodats` | Lô đất |
| transactions | `apps/api/src/modules/transactions` | `apps/web/src/features/transactions` | Giao dịch |
| title-services | `apps/api/src/modules/title-services` | `apps/web/src/features/title-services` | Dịch vụ sổ đỏ |
| lot-shares | `apps/api/src/modules/lot-shares` | `apps/web/src/features/lot-shares` | Share lô, thống kê xem |
| public-content | `apps/api/src/modules/public-content` | `apps/web/src/features/public-content` | CMS bài viết / listing admin |
| public web | controllers public trong API | `apps/web/src/features/public` | Site công khai anhungland.com |
| settings | — | `apps/web/src/features/settings` | Cài đặt CRM |
| health | `apps/api/src/modules/health` | — | Health check |
| storage | `apps/api/src/storage` | — | Cloudflare R2 |
| extension | — | `apps/extension` | Chrome MV3 |
| shared | — | `packages/shared` | Zod / types dùng chung |
| prisma | `apps/api/src/prisma` + schema | — | PostgreSQL |

## Tóm tắt bug

| ID | Severity | Module | Problem | Status |
|----|----------|--------|---------|--------|
| BUG-001 | HIGH | auth | Access JWT không gắn trạng thái user trên DB (disable / xóa / hạ role / reset MK). | OPEN |
| BUG-002 | HIGH | users / auth | Username unique phân biệt hoa-thường; login tìm không phân biệt. | OPEN |
| BUG-003 | HIGH | lot-shares | STAFF tạo share-link theo slug không kiểm tra quyền sở hữu lô. | OPEN |
| BUG-004 | MEDIUM | auth | Login lộ username đang active qua thời gian (timing). | OPEN |
| BUG-005 | MEDIUM | auth | Login không giới hạn độ dài mật khẩu; bcrypt + body 32MB có thể DoS. | OPEN |
| BUG-006 | MEDIUM | auth | Refresh rotation không phát hiện reuse token đã revoke. | OPEN |
| BUG-007 | MEDIUM | auth / web | Access + refresh token lưu `localStorage` (mọi XSS = lấy session). | OPEN |
| BUG-008 | MEDIUM | customers / lodats | STAFF nhận 403 (thay vì 404) khi ID thuộc NV khác — lộ tồn tại bản ghi. | OPEN |
| BUG-009 | MEDIUM | addresses | `includeHidden` không khóa ADMIN; STAFF đọc địa chỉ / đơn vị đã ẩn. | OPEN |
| BUG-010 | MEDIUM | users | Kiểm tra Admin cuối cùng không atomic — race có thể hết Admin. | OPEN |
| BUG-011 | LOW | users / auth | Mật khẩu tối thiểu 6 ký tự, không độ phức tạp. | OPEN |
| BUG-012 | LOW | web authz | Chặn route/role CRM chỉ ở client; Guest/STAFF vẫn tải JS trang admin. | OPEN |
| BUG-013 | HIGH | customers / extension | Cùng người Facebook có thể thành nhiều Customer (UID/thread không unique; e2ee vs threadId). | OPEN |
| BUG-014 | HIGH | customers | Trùng SĐT lúc tạo: bấm OK ghi đè `fullName` và mở lại khách cũ. | OPEN |
| BUG-015 | HIGH | customers | Sửa SĐT xóa mọi số phụ (khách migrate nhiều số). | OPEN |
| BUG-016 | HIGH | customers | Gộp Facebook: mất SĐT nguồn, party SetNull, xóa map trùng lô; TitleService Restrict → merge vỡ. | OPEN |
| BUG-017 | HIGH | customers / permission | Admin gộp Facebook giữa hai `employeeId` khác nhau — chuyển hồ sơ sang NV khác. | OPEN |
| BUG-018 | HIGH | customers | SĐT không unique trên DB; không chuẩn hóa — race / format lệch tạo Person trùng. | OPEN |
| BUG-019 | MEDIUM | customers | Tìm kiếm không khớp tên/UID Facebook; keyword SĐT không bỏ khoảng trắng. | OPEN |
| BUG-020 | MEDIUM | lodats / ChuDat | `LodatCustomerMap` không ràng buộc 1 chủ active / lô; list lấy 1 map theo `updatedAt`. | OPEN |
| BUG-021 | MEDIUM | customers / extension | Ingest extension cập nhật khách `isHidden` nhưng không khôi phục — chat mới bị ẩn. | OPEN |
| BUG-022 | MEDIUM | customers | Contract `updateCustomer` có `note`/budget; API DTO không nhận — không sửa được `Customer.note`. | OPEN |
| BUG-023 | HIGH | lodats / public-content | `GET /public/listings/:slug` không kiểm tra Mở bán — lô Tạm dừng vẫn mở được bằng URL. | OPEN |
| BUG-024 | HIGH | lodats / public-content | Gỡ Đăng web cũng đi qua `requireOpenLodat` — lô Tạm dừng không gỡ được listing. | OPEN |
| BUG-025 | HIGH | lodats / transactions | Xóa GD mở ép map `DANG_BAN`; tạo/sửa/hoàn tất GD không đụng trạng thái rao bán. | OPEN |
| BUG-026 | HIGH | lodats | API ép `DAT_COC`/`DA_BAN` → `TAM_DUNG`; Lưu/công tắc ghi đè status thật trên map. | OPEN |
| BUG-027 | MEDIUM | lodats / customers | Ẩn khách không đóng map — lô vẫn hiện chủ đã xoá; không API gỡ chủ/xóa lô. | OPEN |
| BUG-028 | MEDIUM | lodats | Admin đổi chủ không bắt khách thuộc NV giữ luồng — gán nhầm Person sang lô NV khác. | OPEN |
| BUG-029 | MEDIUM | lodats | Unique SQL 1 luồng/NV/kho không khớp Prisma/`create` (chỉ map active); không đóng luồng. | OPEN |
| BUG-030 | MEDIUM | lodats | API nhận DT/MT âm; Zod/FE `nonnegative` — lệch frontend/backend. | OPEN |
| BUG-031 | MEDIUM | lodats / web | Dropdown «Tất cả trạng thái» không gửi `includePaused`; API mặc định chỉ `DANG_BAN`. | OPEN |
| BUG-032 | MEDIUM | lodats / customers | `lodatCount` đếm mọi map active; STAFF `listForCustomer` chỉ lô mình tạo. | OPEN |
| BUG-033 | LOW | lodats / db | Không CHECK XOR `addressId`/`projectLotId` — hàng lô không hợp lệ vẫn lưu được. | OPEN |
| BUG-034 | MEDIUM | lodats | `create()` commit lô trước copy ảnh chat; lỗi copy → 500 nhưng lô đã tồn tại (retry trùng dân). | OPEN |
| BUG-035 | HIGH | lot-shares | Middleware ghi cookie `?share=` đúng format dù resolve 404 — ghi đè last-click; `employeeId` rỗng reset hạn 30 ngày. | OPEN |
| BUG-036 | HIGH | lot-shares | Không API xóa/sửa/xoay mã share; gỡ publish / disable NV chỉ ẩn resolve; publish lại mã cũ còn hiệu lực. | OPEN |
| BUG-037 | MEDIUM | lot-shares | `POST /public/page-views` tin `shareCode` client — thao túng thống kê không cần cookie. | OPEN |
| BUG-038 | MEDIUM | lot-shares | `POST …/visit` tăng `visitCount` không check `isActive`; listing gỡ vẫn +1 rồi 404. | OPEN |
| BUG-039 | MEDIUM | lot-shares | `resolve` đòi SĐT; `findActiveShare` (đếm view) không — NV mất SĐT vẫn nhận thống kê, khách không thấy liên hệ. | OPEN |
| BUG-040 | LOW | lot-shares | `GET /public/lot-shares/:code` trả `employeeId` + `visitCount` (không cần để hiện SĐT). | OPEN |
| BUG-041 | HIGH | customers / messenger | `sortOrder` = chỉ số batch lần quét (≤200); quét lại cửa sổ khác làm loạn thứ tự tin. | OPEN |
| BUG-042 | HIGH | customers / messenger | API cắt im lặng còn 200 tin; scanner cũ giữ 500 — mất tin không báo. | OPEN |
| BUG-043 | HIGH | customers / messenger | Không unique `externalMessageId`; khóa fallback gộp/trùng tin (đặc biệt tin chỉ ảnh). | OPEN |
| BUG-044 | MEDIUM | customers / messenger | Trùng khóa yếu: body dài hơn ghi đè; ảnh chỉ thêm khi số URL tăng. | OPEN |
| BUG-045 | MEDIUM | customers / messenger | Scan lại có tên Facebook không cập nhật `Customer.fullName` (chỉ `facebookName`). | OPEN |
| BUG-046 | MEDIUM | customers / messenger | `GET …/messages` không phân trang; `sentAt` không ghi; chi tiết khách không hiện chat. | OPEN |

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

### BUG-011 — Chính sách mật khẩu yếu

- **Severity:** LOW
- **Module:** users / auth
- **File:** `apps/api/src/modules/users/dto/user-admin.dto.ts`, `packages/shared/src/auth.ts`
- **Function:** `CreateUserDto`, `ResetUserPasswordDto`, `userPasswordSchema`
- **Vị trí code:** `@MinLength(6)` / `z.string().min(6)` — không chữ hoa, số, ký tự đặc biệt. Login không thêm rule (chỉ khác rỗng).
- **Problem:** Admin có thể đặt MK 6 ký tự dễ đoán. bcrypt 12 không bù policy yếu.
- **Root cause:** Contract cố ý min 6.
- **Impact:** Brute-force / credential stuffing dễ hơn; login throttle 10/phút/IP hạn chế một phần.
- **Evidence:** `user-admin.dto.ts` password min 6 max 128; `auth.ts` `userPasswordSchema`.
- **Status:** OPEN

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
- **Status:** OPEN

### BUG-013 — Cùng người Facebook tạo được nhiều Customer

- **Severity:** HIGH
- **Module:** customers / extension
- **File:** `apps/api/src/modules/customers/from-extension.service.ts`, `apps/api/src/modules/customers/from-extension-parse.ts`, `apps/api/prisma/schema.prisma`
- **Function:** `FromExtensionService.findExisting` / `createCustomer`, `parseScan`
- **Vị trí code:** `CustomerFacebook.customerUid` / `threadId` chỉ `@@index`, không unique. `findExisting` scoped `employeeId`: ưu tiên `threadId`, sau đó `customerUid`, `orderBy createdAt desc`. `parseScan`: non-e2ee `customerUid = rawUid || threadId`; e2ee chỉ `rawUid`. `touchExisting` ghi `threadId: fields.threadId || fb.threadId` (đè thread cũ).
- **Problem:** Một người thật có thể thành nhiều Person: (1) quét e2ee và Messenger thường (UID vs threadId-as-UID); (2) threadId đổi, lần sau không khớp thread cũ và UID trống; (3) hai ingest song song không unique; (4) cùng UID hai NV = hai Customer (cố ý theo NV, nhưng cùng NV vẫn trùng). Scan thread mới cùng UID đè `threadId` rồi append tin vào một `CustomerFacebook` — trộn hai hội thoại.
- **Root cause:** Không unique `(employeeId, customerUid)` / `(employeeId, threadId)`; heuristic UID = threadId; lookup không gộp e2ee/non-e2ee.
- **Impact:** Trùng hồ sơ, chat/chăm sóc/lô tách đôi; gộp tay dễ mất dữ liệu (BUG-016).
- **Evidence:** `schema.prisma` `CustomerFacebook` không `@@unique` UID. `findExisting` dòng 69–97. `parseScan` `isE2ee ? rawUid : rawUid || threadId`. `createCustomer` luôn `customer.create` khi miss.
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

### BUG-043 — Tin nhắn không unique; khóa dedupe yếu tạo trùng hoặc gộp nhầm

- **Severity:** HIGH
- **Module:** customers / messenger
- **File:** `apps/api/prisma/schema.prisma`, `apps/api/src/modules/customers/from-extension-parse.ts`, `apps/api/src/modules/customers/from-extension.service.ts`
- **Function:** `messageStorageKey`, `appendMessages`
- **Vị trí code:** `CustomerMessengerMessage.externalMessageId` / `dedupeKey` chỉ index theo facebook+sortOrder, **không unique**. `messageStorageKey`: `mid.` / `@msgr.` → `mid:id`; else `dedupeKey`; else `` `${id\|\|'no-id'}::${sender}::${text}` ``. `find` `byKey` rồi `byStable` chỉ khi hàng cũ đã có `externalMessageId` ổn định. Hai `appendMessages` song song không transaction.
- **Problem:** (1) Lần 1 chưa có mid (fallback `no-id::customer::`) rồi lần 2 có `mid.…` → **tạo hàng mới** (byStable miss). (2) Nhiều tin chỉ ảnh, cùng sender, text rỗng, không mid/dedupe → **một khóa** — gộp thành một tin. (3) Race hai POST → hai hàng cùng mid. Mapping Person đã ghi BUG-013; đây là **trùng/gộp tin**.
- **Root cause:** Không `@@unique([customerFacebookId, externalMessageId])`; fallback không đủ phân biệt bubble.
- **Impact:** Lịch sử nhân bản hoặc mất bubble ảnh. `messageCount` phình.
- **Evidence:** Schema `CustomerMessengerMessage`. `messageStorageKey`. `appendMessages` không `P2002`/unique. `isStableMessengerMessageId`.
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

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
- **Status:** OPEN

