# ADR 0003 — SQLite trước, PostgreSQL khi cần

- **Status:** Superseded bởi [0004-postgresql.md](./0004-postgresql.md)
- **Date:** 2026-07-23
- **Superseded:** 2026-08-09

## Quyết định cũ (không còn áp dụng)

Dùng SQLite ban đầu, chuyển PostgreSQL khi có tín hiệu scale.

## Lý do supersede

Chủ sở hữu chốt **PostgreSQL từ đầu** + file trên **Cloudflare R2** — không giữ DB file trên VPS, tránh bước đổi engine giữa chừng.
