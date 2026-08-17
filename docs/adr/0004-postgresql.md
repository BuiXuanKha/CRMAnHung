# ADR 0004 — PostgreSQL từ đầu

- **Status:** Accepted
- **Date:** 2026-08-09
- **Supersedes:** [0003-sqlite-then-optional-pg.md](./0003-sqlite-then-optional-pg.md)

## Quyết định

- Dùng **PostgreSQL** (Prisma) cho **dev, CI, staging, production**.
- Không dùng SQLite cho CRMAnHung.
- `DATABASE_URL` dạng `postgresql://…` — không `file:…`.

## Lý do

- Tránh migrate engine giữa chừng (SQLite → PG).
- Backup / restore / concurrent write chuẩn hơn file DB trên VPS.
- CI và staging giống production hơn.
- Nguồn legacy vẫn là SQLite hệ cũ; script migrate P4 đọc SQLite cũ → ghi vào Postgres mới.

## Hệ quả

- Dev: Postgres local (Docker Compose `postgres` service) hoặc instance riêng.
- Staging/prod: Postgres trên Mắt Bão (hoặc managed) — URL trong `.env` server, không sync từ CI.
- Prisma `provider = "postgresql"`.
- Backup = `pg_dump` (+ R2 riêng, xem ADR 0005).

## Khi nào revisit

- Managed Postgres (Neon, RDS, …) nếu ops VPS không còn phù hợp.
