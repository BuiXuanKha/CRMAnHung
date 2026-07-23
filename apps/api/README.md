# API — CRMAnHung

NestJS REST API (`/api/v1`).

## Scripts

```bash
pnpm dev                 # nest watch
pnpm build && pnpm start
pnpm db:generate
pnpm db:migrate
pnpm db:seed
```

## Modules (P0)

- `health` — public health check
- `auth` — login / refresh (rotation) / logout / me
- `users` — list users (ADMIN)

Domain modules tiếp theo: customers, lodats, addresses, transactions, title-services.
