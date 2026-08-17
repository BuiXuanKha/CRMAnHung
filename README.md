# CRMAnHung

Viết lại **FacebookCustomerCRM** với kiến trúc chuyên nghiệp hơn, dễ mở rộng và bảo mật hơn.

> Hệ cũ vẫn chạy production. Repo này phát triển song song.

**Bắt đầu đọc:** [`docs/FOUNDATION.md`](docs/FOUNDATION.md) · [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) · [`AGENTS.md`](AGENTS.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

## Cách chúng ta làm việc

```
Docs domain → Skill (nếu cần) → Contract Zod → UI + mock → API → Nối thật → Extension → Staging
```

Không nhảy cóc. Chi tiết + Definition of Done: **PLAYBOOK**. Skills Cursor: `.cursor/skills/`.

## Stack

| App | Công nghệ |
|-----|-----------|
| `apps/api` | NestJS + Prisma + **PostgreSQL** + JWT + **Cloudflare R2** |
| `apps/web` | **Next.js 15** (App Router) + React 19 + TanStack Query |
| `apps/extension` | Chrome MV3 + TypeScript |
| `packages/shared` | Enums + Zod schemas dùng chung |

Lý do chọn stack: [`docs/adr/0001-tech-stack.md`](docs/adr/0001-tech-stack.md) · Postgres [0004](docs/adr/0004-postgresql.md) · R2 [0005](docs/adr/0005-cloudflare-r2.md) · Next [0006](docs/adr/0006-nextjs-web.md).

## Yêu cầu

- Node.js ≥ 22
- pnpm 10+
- Docker (Postgres local) hoặc Postgres sẵn có
- Cloudflare R2 (bắt buộc khi upload / production)

## Bắt đầu nhanh

```bash
pnpm install

# Postgres local
pnpm db:up

# API / Web env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env
# Điền R2_* nếu sẽ test upload

# DB
pnpm db:generate
pnpm --filter @crmanhung/api exec prisma migrate deploy
pnpm db:seed

# Chạy API + Web
pnpm doctor
pnpm db:up
pnpm dev
```

- Web: http://localhost:5001  
- API: http://localhost:5050/api/v1/health  

Tài khoản seed mặc định:

| User | Password | Role |
|------|----------|------|
| `admin` | `admin123` | ADMIN |
| `staff` | `staff123` | STAFF |

**Đổi mật khẩu ngay** trước khi dùng trên môi trường thật.

### Extension (dev)

```bash
pnpm --filter @crmanhung/extension build
```

Load unpacked thư mục `apps/extension/dist` trong `chrome://extensions`.

## Lộ trình

| Phase | Nội dung |
|-------|----------|
| **P0** | Foundation (monorepo, auth, shell) — xong khung |
| **P0b** | Deploy staging Mắt Bão (`anhungland.com`) song song với CRM cũ |
| **P1** | Customers + extension ingest — đang làm (docs + mock UI) |
| **P2** | Lodats + Addresses |
| **P3** | Transactions + Title services |
| **P4** | Admin registry, CI, migrate data |
| **P5** | Cutover production `crm.anhungland.com` |

## Deploy (Mắt Bão)

Production hiện tại vẫn là FacebookCustomerCRM tại **https://crm.anhungland.com**.

CRMAnHung deploy **song song** trên cùng VPS tại **`anhungland.com`** — xem [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Ghi chú

Nghiệp vụ giữ từ FacebookCustomerCRM (khách FB/Messenger, lô đất, giao dịch, sổ đỏ). Code viết lại theo module — **không** copy nguyên god-file từ repo cũ.
