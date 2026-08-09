# ADR index — Architecture Decision Records

Quyết định công nghệ / kiến trúc được ghi ở đây để sau này không phải đoán “sao lại chọn cái này”.

| ADR | Quyết định | Trạng thái |
|-----|------------|------------|
| [0001](./0001-tech-stack.md) | Tech stack monorepo (NestJS, Prisma, React, pnpm) | Accepted |
| [0002](./0002-docs-mock-api-order.md) | Thứ tự: docs → skill → contract → UI mock → API | Accepted |
| [0003](./0003-sqlite-then-optional-pg.md) | SQLite trước; PostgreSQL khi cần | **Superseded** bởi 0004 |
| [0004](./0004-postgresql.md) | PostgreSQL từ đầu (dev → prod) | Accepted |
| [0005](./0005-cloudflare-r2.md) | Cloudflare R2 cho mọi file upload | Accepted |

Cách thêm ADR mới:

1. Copy số tiếp theo `NNNN-slug.md`
2. Status: `Proposed` → review → `Accepted` / `Superseded`
3. Link vào bảng trên
