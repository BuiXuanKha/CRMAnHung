---
name: nest-domain-module
description: Add a NestJS domain module in apps/api for CRMAnHung (controller, service, DTOs, Prisma). Use when implementing real API after docs, contract, and preferably UI mock.
---

# Nest domain module

## Prerequisites

- Domain doc ≥ `Ready for API`
- Zod/contract trong `packages/shared`
- Prisma model đã có (hoặc migration cùng PR)

## Layout

```
apps/api/src/modules/<domain>/
  <domain>.module.ts
  <domain>.controller.ts
  <domain>.service.ts
  dto/
```

Đăng ký module trong `app.module.ts`.

## Rules

1. **Controller mỏng** — validate DTO / gọi service / trả kết quả.
2. **Service** chứa business + **ownership** (`employeeId` / role ADMIN).
3. Không query Prisma từ controller.
4. Dùng `JwtAuthGuard` global; `@Public()` chỉ endpoint công khai; `@Roles('ADMIN')` + `RolesGuard` khi cần.
5. Message lỗi tiếng Việt, ổn định (để UI hiện được).
6. Route dưới prefix global `api/v1` (đã set trong `main.ts`).
7. Response shape khớp shared contract.
8. File tiến gần 400+ dòng → tách service phụ / repository.
9. `@crmanhung/shared` là ESM — API Nest (CJS) **chỉ** `import type`. Enum / label runtime copy local (như lodats). `require('@crmanhung/shared')` làm API crash → 502.

## Checklist bảo mật (xem thêm `security-baseline`)

- [ ] STAFF không đọc/sửa bản ghi người khác
- [ ] Không mass-assignment field nhạy cảm (`role`, `employeeId` tùy ý từ client)
- [ ] Validate length / enum
- [ ] Không log token / password

## After

Nối Web (`NEXT_PUBLIC_USE_MOCK=false`), smoke test STAFF + ADMIN.
