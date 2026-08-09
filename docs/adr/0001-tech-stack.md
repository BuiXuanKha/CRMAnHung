# ADR 0001 — Tech stack CRMAnHung

- **Status:** Accepted
- **Date:** 2026-07-23
- **Context:** Viết lại FacebookCustomerCRM cho dễ mở rộng, bảo mật hơn, vẫn hiểu sau nhiều năm.

## Quyết định

| Lớp | Chọn | Không chọn (và vì sao) |
|-----|------|-------------------------|
| Monorepo | **pnpm workspaces** | Nx/Turborepo — overhead chưa cần ở quy mô hiện tại |
| Language | **TypeScript strict** | JS thuần — đã gây khó refactor ở hệ cũ |
| API | **NestJS** (Express adapter) | Raw Express — thiếu khung module/guard; Fastify-only — Nest đủ và quen thuộc hơn cho CRUD nội bộ |
| ORM | **Prisma** | SQL tay / callback migrate — đã đau ở hệ cũ |
| DB | **PostgreSQL** từ đầu | SQLite — đã supersede (ADR 0003 → 0004) |
| Object storage | **Cloudflare R2** (S3 API) | Disk VPS `/uploads` — phình disk, khó scale (ADR 0005) |
| Validation / contract | **Zod** trong `@crmanhung/shared` | Chỉ class-validator — không share được với Web/Extension |
| Web | **Next.js 15 (App Router) + React 19 + TanStack Query** | Vite SPA — đã supersede (ADR 0006) |
| State server | TanStack Query | Redux — quá nặng cho form CRUD |
| Auth | JWT **access ngắn** + **refresh rotation** | JWT 7 ngày cố định như hệ cũ |
| Extension | Chrome MV3 + TS (esbuild) | Giữ vanilla khổng lồ một file — sẽ tách module khi port scanner |
| Deploy | Cùng VPS Mắt Bão, staging subdomain | Server mới — chưa cần chi phí/ops |

## Hệ quả

- Mọi app/package dùng TypeScript → refactor an toàn hơn.
- Contract Zod là nguồn sự thật cho shape dữ liệu giữa UI mock, API, extension.
- Nest module = biên giới domain → dễ tìm code sau 5 năm.
- Staging `crm-next` tách khỏi production `crm.anhungland.com`.
- DB = Postgres; file = R2; Web = Next standalone (PM2) + API Nest.

## Khi nào revisit

- Team > 3 người full-time → cân nhắc Turborepo/Nx.
- Cần mobile native → tách BFF hoặc OpenAPI generate client.
- Managed Postgres / private R2 objects — xem ADR 0004 / 0005.
- Auth cookie + Next middleware — xem ADR 0006.
