# CRMAnHung

Viết lại **FacebookCustomerCRM** với kiến trúc chuyên nghiệp hơn, dễ mở rộng và bảo mật hơn.

> Hệ cũ vẫn chạy production. Repo này phát triển song song — xem [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) và [`docs/MIGRATION.md`](docs/MIGRATION.md).

## Stack

| App | Công nghệ |
|-----|-----------|
| `apps/api` | NestJS + Prisma + SQLite + JWT (access/refresh) |
| `apps/web` | React 19 + Vite + TypeScript + TanStack Query |
| `apps/extension` | Chrome MV3 + TypeScript |
| `packages/shared` | Enums + Zod schemas dùng chung |

## Yêu cầu

- Node.js ≥ 22
- pnpm 10+

## Bắt đầu nhanh

```bash
pnpm install

# API env
cp apps/api/.env.example apps/api/.env
cp apps/web/.env.example apps/web/.env

# DB
pnpm db:generate
pnpm --filter @crmanhung/api exec prisma migrate dev --name init
pnpm db:seed

# Chạy API + Web
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
| **P0** | Foundation (monorepo, auth, shell) — đang làm |
| **P0b** | Deploy staging Mắt Bão (`crm-next.anhungland.com`) song song với CRM cũ |
| **P1** | Customers + extension ingest |
| **P2** | Lodats + Addresses |
| **P3** | Transactions + Title services |
| **P4** | Admin registry, CI, migrate data |
| **P5** | Cutover production `crm.anhungland.com` |

## Deploy (Mắt Bão)

Production hiện tại vẫn là FacebookCustomerCRM tại **https://crm.anhungland.com**.

CRMAnHung deploy **song song** trên cùng VPS, subdomain staging — xem [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Ghi chú

Nghiệp vụ giữ từ FacebookCustomerCRM (khách FB/Messenger, lô đất, giao dịch, sổ đỏ). Code viết lại theo module — **không** copy nguyên god-file từ repo cũ.
