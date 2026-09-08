# Kiến trúc CRMAnHung

Viết lại **FacebookCustomerCRM** với cấu trúc có thể mở rộng, bảo mật hơn, và dễ bảo trì.

**Cách làm việc hàng ngày:** [`PLAYBOOK.md`](./PLAYBOOK.md) (docs → skill → contract → UI mock → API).  
**Quyết định công nghệ:** [`adr/`](./adr/).

Production mục tiêu (sau khi migrate): kế thừa nghiệp vụ An Hưng Land CRM — khách hàng (Facebook/Messenger), lô đất, giao dịch, dịch vụ sổ đỏ.

---

## 1. Mục tiêu so với hệ cũ

| Vấn đề hệ cũ | Hướng giải quyết |
|--------------|------------------|
| God files (controller / content-script hàng nghìn dòng) | Module theo domain, file nhỏ, một trách nhiệm |
| Migration lồng callback trong `database.js` | Prisma Migrate (versioned, declarative) |
| JS thuần, thiếu type | TypeScript end-to-end + shared types |
| Auth JWT đơn giản, CORS mở, không refresh | Access + refresh token, CORS allowlist, rate limit |
| Không có validation chuẩn | Zod / class-validator tại biên API |
| Không test | Unit + e2e scaffold sẵn từ đầu |
| Monorepo “thư mục cạnh nhau” | pnpm workspaces + packages dùng chung |

**Nguyên tắc:** hệ cũ (`facebookcustomercrm`) tiếp tục chạy production; `crmanhung` phát triển song song, migrate dữ liệu khi sẵn sàng.

---

## 2. Tech stack

| Lớp | Công nghệ | Lý do |
|-----|-----------|--------|
| Monorepo | pnpm workspaces | Shared package, cài đặt nhất quán |
| Language | TypeScript (strict) | An toàn kiểu, refactor tự tin |
| API | NestJS 11 (Express) | Module rõ ràng, DI, guards/pipes sẵn |
| ORM / DB | Prisma + **PostgreSQL** | Schema rõ, migrate chuẩn; giống nhau từ dev → prod |
| Object storage | **Cloudflare R2** (S3 API) | Ảnh/file không nằm disk VPS |
| Validation | Zod (`@crmanhung/shared`) + Nest ValidationPipe | Contract dùng chung FE/BE/Extension |
| Auth | JWT access (ngắn) + refresh (rotation, mặc định **30 ngày**) | Bảo mật hơn JWT dài cố định không rotation |
| Web | **Next.js 15 (App Router) + React 19 + TanStack Query** | Public web + CRM sau login; SEO/SSR cho trang mở |
| Extension | Chrome MV3 + TypeScript (esbuild) | Cùng type với API |
| Lint/format | ESLint + Prettier (workspace) | Chất lượng đồng đều |

---

## 3. Cấu trúc monorepo

```
crmanhung/
├── apps/
│   ├── api/          # NestJS — REST API
│   ├── web/          # Next.js — public web + CRM (nhân viên / admin)
│   └── extension/    # Chrome MV3 — quét Inbox/Messenger
├── packages/
│   └── shared/       # Types, enums, Zod schemas, constants
├── docs/             # Kiến trúc, migration, ADRs
├── package.json
└── pnpm-workspace.yaml
```

### API — module theo nghiệp vụ

```
apps/api/src/
├── main.ts
├── app.module.ts
├── config/                 # env validation
├── common/                 # guards, filters, decorators, interceptors
├── prisma/                 # PrismaService
├── storage/                # Cloudflare R2 (S3 client)
└── modules/
    ├── health/
    ├── auth/
    ├── users/
    ├── customers/          # Person + Facebook + Messenger + care
    ├── lodats/
    ├── addresses/
    ├── admin-units/
    ├── transactions/
    ├── title-services/
    └── admin-registry/     # registry / hard-delete (ADMIN)
```

Mỗi module: `*.module.ts` → `*.controller.ts` → `*.service.ts` → (optional) `*.repository.ts`.

**Không** nhét business logic vào controller. **Không** gọi Prisma trực tiếp từ controller.

### Web — Next.js App Router

```
apps/web/
├── app/
│   ├── (public)/     # web public — `/` landing
│   ├── (crm)/        # CRM sau login
│   └── login/
├── src/
│   ├── features/     # auth, customers, …
│   ├── shared/       # ui, api client
│   └── styles/
└── next.config.ts    # output: 'standalone'
```

### Extension

```
apps/extension/   # Load unpacked — scanner Meta
├── manifest.json
├── content-inbox.js
├── background.js
├── options.html / options.js
└── scanners/
```

---

## 4. Domain nghiệp vụ (giữ từ hệ cũ)

| Domain | Vai trò |
|--------|---------|
| **Users** | STAFF / ADMIN, hotline, Facebook profile mapping |
| **Customers** | Lead từ extension hoặc thủ công; phone; care history; pin/hide |
| **Lodats** | Lô đất + map M–N với khách (giá / trạng thái bán) |
| **Addresses** | Địa chỉ REGULAR / PROJECT + đơn vị hành chính |
| **Transactions** | Giao dịch trên map lô–khách: snapshot lô, bên mua/bán, đính kèm R2 |
| **Title services** | Hồ sơ dịch vụ sổ đỏ |
| **Tasks** | Nhắc việc / ghi chú nhỏ — tạo từ Thao tác 4 list; xem `/cong-viec` |
| **Admin registry** | Xem / xóa cứng khách toàn hệ thống |

Vai trò: `STAFF` (dữ liệu theo `employeeId`) · `ADMIN` (toàn cục + cấu hình).

### List CRM — nhớ tìm / lọc / cuộn

Các màn list (`/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do`) dùng helper chung `apps/web/src/shared/list-state`:

- **sessionStorage** theo tab (key `crmanhung:<feature>-list-state`)
- Lưu: ô tìm, bộ lọc, `selectedId`, `scrollTop` + `anchorId`
- Restore **đúng pixel** `scrollTop`; chỉ khi list đổi (không đạt được `scrollTop`) mới bám `anchorId` + `anchorOffset`. Căn `anchorId` lên sát mép trên làm lệch ~1 dòng → cảm giác giật.
- Đổi lọc mới cuộn về 0 — không xóa vị trí lúc vừa restore (Back từ chi tiết, cache React Query).
- Đăng xuất → xóa mọi key `*-list-state`
- Feature bọc thin store (`createListStateStore`) — xem skill `crm-list-state`
- **Cuộn tải thêm:** `useCrmInfiniteList` — mỗi lần 50 dòng, gần đáy 160px thì nối trang (`/khach-hang`, `/lo-dat`)
- **Sửa một dòng trên list đang mở** (vd. lưu chăm sóc máy tính): `patchInfiniteListItem` + `withPreservedListScroll` — không refetch/`updatedAt` kéo hàng lên đầu

Không nhớ panel cột phụ (chỉ list). Chi tiết domain: `customers.md` §12.1.5, `lodats.md` §12.1.5, `title-services.md` §12.1.6.

---

## 5. Bảo mật (baseline)

1. **JWT access** ngắn hạn (ví dụ 15m) + **refresh token** có rotation / revoke.
2. **Password:** bcrypt (cost ≥ 12); policy tối thiểu rõ ràng.
3. **CORS allowlist** theo env (không `origin: true` trên production).
4. **Helmet**, rate limit login, giới hạn body size có chủ đích.
5. **Authorization** ở service layer (ownership), không chỉ dựa vào UI ẩn nút.
6. **Secrets** chỉ qua env; không commit `.env`.
7. Upload: validate MIME/size → R2; DB lưu **object key**; không tin path client; không serve file từ disk VPS.
8. Extension: token trong `chrome.storage.session` / local có scope rõ; API URL cấu hình, không hardcode prod secret.

---

## 6. Luồng dữ liệu (giữ nguyên ý tưởng)

```
Meta Inbox / Messenger (tab ngoài / extension)
  → Extension (scan + JWT) — Load unpacked `apps/extension`
  → POST /api/v1/customers/from-extension
  → DB (Customer + Facebook + Messenger)
  → Web: cột phụ «Nội dung chat» = tin đã lưu
```

Web **không** nhúng Inbox Facebook sống. Menu **Mở chat** / **Mở Messenger** mở tab Meta (khách Page → URL Business Suite đã quét). Inbox sống trong CRM = chưa làm (`customers.md` §11 mục 27).

API version prefix: `/api/v1` — dễ thay contract sau này mà không phá client cũ trong giai đoạn chuyển tiếp.

---

## 7. Chiến lược phát triển

| Giai đoạn | Nội dung |
|-----------|----------|
| **P0 — Foundation** | Monorepo, auth, users, health, Web shell, Extension stub, Prisma schema core |
| **P0b — Staging MatBao** | `anhungland.com` trên cùng VPS với CRM cũ; PM2 port 5050 |
| **P1 — Customers** | CRUD khách, ingest extension, care history |
| **P2 — Lodats + Addresses** | Lô đất, map khách–lô, địa chỉ, import Excel |
| **P3 — Transactions + Title** | Giao dịch, dịch vụ sổ đỏ |
| **P4 — Hardening** | Admin registry, CI, deploy, migration data (SQLite cũ → Postgres + `img/` → R2) |
| **P5 — Cutover** | Song song → chuyển DNS/nginx → tắt hệ cũ |

Chi tiết migrate dữ liệu: xem `docs/MIGRATION.md`.

---

## 8. Quy ước code

- Tên file / symbol: tiếng Anh; copy UI / message lỗi user: tiếng Việt.
- Enum status giữ semantic gần hệ cũ (`KHACH_MOI`, `DANG_BAN`, …) để migrate dễ.
- Mỗi PR ưu tiên **một vertical slice** hoàn chỉnh (API + types + UI tối thiểu) hơn skeleton rỗng nhiều domain.
- Không copy nguyên file god từ repo cũ — đọc nghiệp vụ rồi viết lại theo module.
