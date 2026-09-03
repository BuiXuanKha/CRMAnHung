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
| ID tiếp theo | `BUG-023` |
| Tổng bug đã ghi | 22 |
| OPEN | 22 |
| NEEDS VERIFICATION | 0 |
| FIXED / CLOSED | 0 |
| Lần audit gần nhất | 2026-09-03 — Person / Customer / SĐT / Facebook UID / chủ đất |

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

