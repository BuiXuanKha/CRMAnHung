# Web — CRMAnHung (Next.js)

Next.js 15 App Router · React 19 · TanStack Query.

Dev: http://localhost:5001  
Prod: PM2 `crmanhung-web` (standalone) · nginx proxy.

## Scripts

```bash
pnpm dev      # next dev -p 5001
pnpm build    # next build (standalone)
pnpm start    # next start -p 5001
```

Env: xem `.env.example` (`NEXT_PUBLIC_API_URL`). Login CRM = API + bảng User (không mock `staff`/`admin123`).
