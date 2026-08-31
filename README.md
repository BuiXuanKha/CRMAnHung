# CRMAnHung

Viết lại **FacebookCustomerCRM**: CRM nhân viên + web khách trên cùng monorepo.

Hệ cũ vẫn phục vụ nhân viên tại **https://crm.anhungland.com**. Repo này chạy **song song** — không ghi đè CRM cũ.

| Bề mặt | URL | Ghi chú |
|--------|-----|---------|
| Web khách | [anhungland.com](https://anhungland.com) | Không login. Index Google. Ảnh CDN `cdn.anhungland.com` |
| CRM mới | [anhungland.com/login](https://anhungland.com/login) | Nhân viên / admin |
| CRM cũ | [crm.anhungland.com](https://crm.anhungland.com) | Giữ đến cutover |

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

`pnpm db:seed` tạo user local `admin` / `staff` (mật khẩu in ra terminal). **Không** dùng seed trên server; production đã đổi mật khẩu.

### Extension (dev)

```bash
pnpm --filter @crmanhung/extension build
```

Load unpacked thư mục `apps/extension/dist` trong `chrome://extensions`.

## Hiện trạng

| Hạng mục | Trạng thái |
|----------|------------|
| Foundation, auth, CI, deploy `anhungland.com` | Đang chạy |
| Khách, lô đất, địa chỉ, giao dịch, sổ đỏ (CRM mới) | Đang dùng |
| Web khách: lô đăng web, bài CMS, SEO ảnh/slug | Live trên `anhungland.com` |
| Extension ingest Meta | Còn làm |
| Registry NV / xóa cứng khách (P4) | Chưa |
| Cutover tắt `crm.anhungland.com` (P5) | Chưa — không đụng CRM cũ khi deploy |

## Deploy

Gộp vào `main` → GitHub Actions lên VPS (`anhungland.com`). Chi tiết: [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md) · skill `deploy-staging`.

**Cấm** đụng `crm.anhungland.com`, `/var/www/anhungland-crm`, PM2 `anhungland-api`.

## Ghi chú

Nghiệp vụ giữ từ FacebookCustomerCRM (khách FB/Messenger, lô đất, giao dịch, sổ đỏ). Code viết lại theo module — **không** copy nguyên god-file từ repo cũ.
