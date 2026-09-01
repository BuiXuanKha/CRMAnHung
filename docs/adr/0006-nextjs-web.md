# ADR 0006 — Next.js cho Web

- **Status:** Accepted
- **Date:** 2026-08-09
- **Supersedes:** phần Web trong [0001](./0001-tech-stack.md) (Vite + React Router SPA thuần nội bộ)

## Quyết định

- Web dùng **Next.js 15 (App Router) + React 19**.
- Phần **public** (landing / trang mở) dùng khả năng SSR/SSG/RSC của Next.
- Phần **CRM sau login** dùng client components + **TanStack Query** gọi Nest API.
- **Không** dùng Vite SPA thuần.
- Deploy: `output: 'standalone'` → PM2 `crmanhung-web` (port **5001**); nginx proxy `/` → Next, `/api/` → Nest.

## Lý do (đã chốt)

1. Web sẽ **public** — cần SEO, tải trang nhanh, chia sẻ link ổn; Vite SPA nội bộ không đủ.
2. Viết lại để **đồng bộ một stack hiện đại** (thay hệ cũ thiếu chuẩn).
3. Một app Next phục vụ cả public + CRM, vẫn giữ NestJS làm API nghiệp vụ riêng.

## Hệ quả

- Env: `NEXT_PUBLIC_API_URL`. CRM login + list gọi API (không mock `staff`/`admin123`).
- Route public và route `(crm)` tách rõ; auth bắt buộc chỉ trong khu CRM.
- Chuẩn SEO web công khai: [`PUBLIC-SEO.md`](../PUBLIC-SEO.md) + skill `web-public-seo`.
- Dev: `pnpm --filter @crmanhung/web dev` → http://localhost:5001

## Khi nào revisit

- Auth cookie httpOnly + Next middleware (thay localStorage JWT) khi harden.
- Tách marketing site riêng chỉ khi team/ops đòi hỏi.
