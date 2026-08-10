# Nền tảng CRMAnHung — checklist trước khi code feature

Mục tiêu: **công cụ sẵn, quy ước sẵn** → code domain không bị đổi stack / hỏi lại credentials giữa chừng.

Agent đọc file này + [`AGENTS.md`](../AGENTS.md) trước khi làm P1+.

## Stack đã chốt (không đổi trừ ADR mới)

| Lớp | Công nghệ |
|-----|-----------|
| Monorepo | pnpm workspaces |
| BE | NestJS + Prisma + Zod (`@crmanhung/shared`) |
| FE | Next.js 15 App Router + React 19 + TanStack Query |
| DB | PostgreSQL |
| File | Cloudflare R2 |
| Auth | JWT access ngắn + refresh rotation |
| Extension | Chrome MV3 + TypeScript (esbuild) |
| Deploy | Mắt Bão · staging `anhungland.com` |

## Trạng thái công cụ

| Hạng mục | Trạng thái | Ghi chú |
|----------|-----------|---------|
| ADR / Playbook / Architecture | Ready | `docs/adr`, `PLAYBOOK.md` |
| Cursor skills | Ready | gồm `cloudflare-r2` |
| API scaffold (auth/users/health) | Ready | nhánh foundation + branch hiện tại |
| Web shell CRM `(crm)/*` | Ready | login + **Customers mock list/detail** |
| Web shell **public** `/` | Ready | landing stub — mở rộng sau |
| Postgres local (`docker compose`) | **Skipped (owner)** | Không bắt buộc; UI mock không cần DB. VPS sẽ có Postgres khi deploy |
| R2 keys + endpoint + bucket | Ready | skill `cloudflare-r2` + `.env` |
| R2 Public URL tạm `r2.dev` | Ready (dự phòng) | có thể Disable sau khi CDN Active |
| R2 **custom domain** `cdn.anhungland.com` | Ready | TLS 1.3 · public assets |
| R2 **private bucket** `anhungland-crm-private` | Ready | Token `crmanhung-api-both` (All buckets) |
| `apps/web/.env` | Ready sau `pnpm doctor` / copy example | |
| Shared Customers contract | Ready | `packages/shared/src/customers.ts` |
| ESLint workspace | Pending (không chặn P1) | placeholder script |
| Postgres trên VPS staging | Owner / deploy lúc P0b | xem `DEPLOYMENT.md` |
| Domain docs ngoài Customers | Draft sau | Lodats… theo phase |

## Lệnh kiểm tra nhanh

```bash
pnpm doctor          # env + tool chain
pnpm db:up           # Postgres local (cần Docker)
pnpm db:generate && pnpm --filter @crmanhung/api exec prisma migrate deploy
pnpm db:seed
pnpm dev             # API :5050 + Web :5001
```

## Quy tắc để không loạn

1. **Không đổi stack** khi đang code feature — mở ADR mới nếu buộc phải đổi.
2. Feature mới theo **PLAYBOOK**: domain doc → contract → UI mock → API.
3. Upload chỉ qua **`StorageService` / R2** — không invent thư mục `uploads` trên VPS.
4. Web: route **public** vs **`(crm)`** tách layout; CRM bắt buộc auth.
5. Secrets: `.env` gitignored; R2 bootstrap từ skill `cloudflare-r2` nếu thiếu file local.
6. Staging không đụng `crm.anhungland.com`.

## Việc chủ sở hữu còn lại (không phải code)

1. ~~Cloudflare R2 custom domain~~ — đã Connect `cdn.anhungland.com`.
2. ~~Postgres local trên máy~~ — tạm bỏ; không chặn làm UI mock / deploy VPS.
3. (Khi deploy) Postgres trên Mắt Bão + DNS A `@` → VPS + nginx `anhungland.com` — `DEPLOYMENT.md`.
