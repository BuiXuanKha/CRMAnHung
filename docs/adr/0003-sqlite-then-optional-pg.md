# ADR 0003 — SQLite trước, PostgreSQL khi cần

- **Status:** Accepted
- **Date:** 2026-07-23

## Quyết định

- Dùng **SQLite** (Prisma) cho dev + staging + giai đoạn đầu production crmanhung.
- Giữ schema Prisma **không phụ thuộc** tính năng SQLite-only trừ khi bắt buộc.
- Chuyển **PostgreSQL** khi có một trong các tín hiệu: multi-instance API, backup/ops đòi hỏi, contention ghi rõ rệt.

## Lý do

- Hệ cũ đã SQLite trên một VPS — quy mô môi giới đất nội bộ phù hợp.
- Migrate data từ file DB cũ đơn giản hơn nếu đích ban đầu cũng SQLite.
- Prisma làm giảm chi phí đổi engine sau.

## Hệ quả

- `DATABASE_URL=file:…` trên server (`/var/www/crmanhung/database/`).
- Backup = copy file DB + uploads (ghi vào runbook DEPLOYMENT khi cutover).
