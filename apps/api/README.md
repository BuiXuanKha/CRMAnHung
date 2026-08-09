# API — CRMAnHung

NestJS REST API (`/api/v1`).

**DB:** PostgreSQL · **Files:** Cloudflare R2 (`StorageModule`).

## Scripts

```bash
pnpm dev                 # nest watch
pnpm build && pnpm start
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

Local Postgres: từ root repo `pnpm db:up` (Docker Compose).

## Modules (P0)

- `health` — public health check
- `auth` — login / refresh (rotation) / logout / me
- `users` — list users (ADMIN)
- `storage` — R2 upload/delete helper (global)

Domain modules tiếp theo: customers, lodats, addresses, transactions, title-services.
