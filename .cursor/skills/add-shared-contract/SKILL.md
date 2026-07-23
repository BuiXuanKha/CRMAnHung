---
name: add-shared-contract
description: Add or change Zod schemas and shared types in packages/shared for CRMAnHung API/UI/extension contracts. Use before UI mock or API implementation.
---

# Add shared contract

## Location

- `packages/shared/src/<domain>.ts` — schemas + types
- `packages/shared/src/enums.ts` — enums dùng chung
- Export từ `packages/shared/src/index.ts`

## Rules

1. Dùng **Zod** cho input/response chính; `z.infer` cho TypeScript types.
2. Enum status giữ semantic gần hệ cũ (`KHACH_MOI`, …).
3. Tên field **camelCase** trong contract JSON (Prisma cũng camelCase).
4. Message lỗi validation hướng user: tiếng Việt khi dùng ở form.
5. Sau khi sửa: `pnpm --filter @crmanhung/shared build`.
6. Không breaking change lặng lẽ — ghi chú đầu file hoặc domain doc.

## Pattern

```ts
import { z } from 'zod';
import { CustomerStatus } from './enums.js';

export const customerListItemSchema = z.object({
  id: z.string(),
  fullName: z.string(),
  status: z.nativeEnum(CustomerStatus),
  // ...
});

export type CustomerListItem = z.infer<typeof customerListItemSchema>;
```

## After

UI mock và API **cùng import** type/schema này — không định nghĩa shape song song.
