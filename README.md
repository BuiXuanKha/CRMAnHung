# CRMAnHung

CRM nhân viên + web khách của **An Hưng Land**. Viết lại từ FacebookCustomerCRM (NestJS, Postgres, R2, Next.js) — đã **cutover**: nhân viên dùng hệ mới.

| Bề mặt | URL | Ghi chú |
|--------|-----|---------|
| Web khách | [anhungland.com](https://anhungland.com) | Không login. Index Google. Ảnh CDN `cdn.anhungland.com` |
| CRM (production) | [anhungland.com/login](https://anhungland.com/login) | Nhân viên / admin |
| Hệ cũ (FacebookCustomerCRM) | [crm.anhungland.com](https://crm.anhungland.com) | Không còn là CRM production. Giữ cây VPS để rollback; **không** deploy đè lên |

**Bắt đầu đọc:** [`docs/FOUNDATION.md`](docs/FOUNDATION.md) · [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) · [`AGENTS.md`](AGENTS.md) · [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) · web khách: [`docs/PUBLIC-WEB.md`](docs/PUBLIC-WEB.md) + [`docs/PUBLIC-SEO.md`](docs/PUBLIC-SEO.md)

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
| `apps/extension` | Chrome MV3 (Load unpacked folder này) |
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

`pnpm db:seed` không tạo user nháp. Tài khoản CRM lấy từ copy DB cũ (`kha`, `buinam`, `admin`) — xem `docs/MIGRATION.md`.

### Extension

Load unpacked thư mục **`apps/extension`**. API mặc định `https://anhungland.com/api/v1`.

## Hiện trạng

| Hạng mục | Trạng thái |
|----------|------------|
| Foundation, auth, CI, deploy | Production trên `anhungland.com` |
| CRM nhân viên (khách, lô, địa chỉ, giao dịch, sổ đỏ) | **Đang dùng** — đã chuyển từ hệ cũ |
| Web khách: lô đăng web, bài CMS, SEO ảnh/slug | Live |
| Extension ingest Meta | Còn làm |
| Registry NV / xóa cứng khách | Chưa |

## Deploy

Gộp vào `main` → GitHub Actions lên VPS (`anhungland.com`). Chi tiết: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · skill `deploy-staging`.

Deploy **chỉ** cây CRMAnHung (`/var/www/crmanhung`). **Không** đụng `/var/www/anhungland-crm` hay PM2 `anhungland-api` (bản cũ, để rollback).

## Ghi chú

Nghiệp vụ giữ từ FacebookCustomerCRM (khách FB/Messenger, lô đất, giao dịch, sổ đỏ). Code viết lại theo module — **không** copy nguyên god-file từ repo cũ.
