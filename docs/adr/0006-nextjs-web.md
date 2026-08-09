# ADR 0006 — Next.js cho Web

- **Status:** Accepted
- **Date:** 2026-08-09
- **Supersedes:** phần Web trong [0001](./0001-tech-stack.md) (Vite + React Router SPA)

## Quyết định

- Web CRM dùng **Next.js 15 (App Router) + React 19**.
- Vẫn dùng **TanStack Query** cho data client (CRUD sau login).
- **Không** dùng Vite + `react-router-dom` nữa.
- Deploy: `output: 'standalone'` → PM2 process `crmanhung-web` (port **5001**); nginx proxy `/` tới Next, `/api/` tới Nest.

## Lý do

- Chủ sở hữu chốt chuyển sang Next.js (routing, font, layout, mở rộng SSR/RSC sau này).
- App Router thay React Router; vẫn giữ NestJS làm API riêng (`apps/api`).

## Hệ quả

- Env public: `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_USE_MOCK` (thay `VITE_*`).
- Dev: `pnpm --filter @crmanhung/web dev` → http://localhost:5001
- Staging: nginx không còn `try_files` SPA static; proxy Next Node.

## Khi nào revisit

- Auth chuyển cookie httpOnly + middleware Next (thay localStorage JWT) khi harden P4.
- Edge / ISR chỉ khi có trang public thật sự cần.
