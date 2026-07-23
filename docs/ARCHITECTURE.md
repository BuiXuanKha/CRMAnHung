# Kiến trúc CRMAnHung

Viết lại **FacebookCustomerCRM** với cấu trúc có thể mở rộng, bảo mật hơn, và dễ bảo trì.

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
| API | NestJS 11 + Fastify adapter | Module rõ ràng, DI, guards/pipes sẵn |
| ORM / DB | Prisma + SQLite (dev/prod giai 1) | Schema rõ, migrate chuẩn; sau có thể đổi PostgreSQL |
| Validation | Zod (`@crmanhung/shared`) + Nest ValidationPipe | Contract dùng chung FE/BE/Extension |
| Auth | JWT access (ngắn) + refresh (httpOnly cookie / storage có rotation) | Bảo mật hơn JWT 7 ngày cố định |
| Web | React 19 + Vite + React Router + TanStack Query | State server rõ, ít boilerplate |
| Extension | Chrome MV3 + TypeScript (Vite build) | Cùng type với API |
| Lint/format | ESLint + Prettier (workspace) | Chất lượng đồng đều |

---

## 3. Cấu trúc monorepo

```
crmanhung/
├── apps/
│   ├── api/          # NestJS — REST API
│   ├── web/          # React SPA — nhân viên / admin
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

### Web — theo domain UI

```
apps/web/src/
├── app/            # router, providers
├── features/       # auth, customers, lodats, transactions, title-services, admin
├── shared/         # ui kit, hooks, api client, lib
└── styles/
```

### Extension

```
apps/extension/src/
├── background/     # service worker — proxy API
├── content/        # inbox / messenger adapters + scanners
├── options/        # login & API URL
└── shared/
```

---

## 4. Domain nghiệp vụ (giữ từ hệ cũ)

| Domain | Vai trò |
|--------|---------|
| **Users** | STAFF / ADMIN, hotline, Facebook profile mapping |
| **Customers** | Lead từ extension hoặc thủ công; phone; care history; pin/hide |
| **Lodats** | Lô đất + map M–N với khách (giá / trạng thái bán) |
| **Addresses** | Địa chỉ REGULAR / PROJECT + đơn vị hành chính |
| **Transactions** | Giao dịch trên map lô–khách |
| **Title services** | Hồ sơ dịch vụ sổ đỏ |
| **Admin registry** | Xem / xóa cứng khách toàn hệ thống |

Vai trò: `STAFF` (dữ liệu theo `employeeId`) · `ADMIN` (toàn cục + cấu hình).

---

## 5. Bảo mật (baseline)

1. **JWT access** ngắn hạn (ví dụ 15m) + **refresh token** có rotation / revoke.
2. **Password:** bcrypt (cost ≥ 12); policy tối thiểu rõ ràng.
3. **CORS allowlist** theo env (không `origin: true` trên production).
4. **Helmet**, rate limit login, giới hạn body size có chủ đích.
5. **Authorization** ở service layer (ownership), không chỉ dựa vào UI ẩn nút.
6. **Secrets** chỉ qua env; không commit `.env`.
7. Upload ảnh: validate MIME/size; serve tĩnh tách path; không tin client path.
8. Extension: token trong `chrome.storage.session` / local có scope rõ; API URL cấu hình, không hardcode prod secret.

---

## 6. Luồng dữ liệu (giữ nguyên ý tưởng)

```
Meta Inbox / Messenger
  → Extension (scan + JWT)
  → POST /api/v1/customers/from-extension
  → DB (Person + Facebook + Messenger)
  → Web SPA quản lý qua /api/v1/*
```

API version prefix: `/api/v1` — dễ thay contract sau này mà không phá client cũ trong giai đoạn chuyển tiếp.

---

## 7. Chiến lược phát triển

| Giai đoạn | Nội dung |
|-----------|----------|
| **P0 — Foundation** | Monorepo, auth, users, health, Web shell, Extension stub, Prisma schema core |
| **P0b — Staging MatBao** | `crm-next.anhungland.com` trên cùng VPS với CRM cũ; PM2 port 5050 |
| **P1 — Customers** | CRUD khách, ingest extension, care history |
| **P2 — Lodats + Addresses** | Lô đất, map khách–lô, địa chỉ, import Excel |
| **P3 — Transactions + Title** | Giao dịch, dịch vụ sổ đỏ |
| **P4 — Hardening** | Admin registry, CI, deploy, migration data từ SQLite cũ |
| **P5 — Cutover** | Song song → chuyển DNS/nginx → tắt hệ cũ |

Chi tiết migrate dữ liệu: xem `docs/MIGRATION.md`.

---

## 8. Quy ước code

- Tên file / symbol: tiếng Anh; copy UI / message lỗi user: tiếng Việt.
- Enum status giữ semantic gần hệ cũ (`KHACH_MOI`, `DANG_BAN`, …) để migrate dễ.
- Mỗi PR ưu tiên **một vertical slice** hoàn chỉnh (API + types + UI tối thiểu) hơn skeleton rỗng nhiều domain.
- Không copy nguyên file god từ repo cũ — đọc nghiệp vụ rồi viết lại theo module.
