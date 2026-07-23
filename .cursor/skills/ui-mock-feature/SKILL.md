---
name: ui-mock-feature
description: Build CRMAnHung web UI features with mock data before the real API exists. Use for pages, lists, forms under apps/web following feature-folder structure.
---

# UI mock feature

## Prerequisites

- Domain doc status ≥ `Ready for mock`
- Contract đã có trong `@crmanhung/shared` (hoặc thêm cùng PR **trước** UI)

## Layout

```
apps/web/src/features/<domain>/
  pages/           # route screens
  components/      # UI chỉ dùng trong domain
  api.ts           # hàm gọi API thật
  mock-data.ts     # dữ liệu giả
  hooks.ts         # optional
```

## Mock switch

- Biến môi trường: `VITE_USE_MOCK=true` (dev mặc định có thể bật trong `.env`)
- Một chỗ duy nhất quyết định mock vs real (ví dụ trong `api.ts` của feature):

```ts
const useMock = import.meta.env.VITE_USE_MOCK === 'true';

export async function listCustomers() {
  if (useMock) return mockCustomers;
  return apiFetch('/customers');
}
```

## Rules

1. Dùng type từ `@crmanhung/shared` — không invent interface cục bộ trùng nghĩa.
2. Mock phủ đủ trạng thái trong domain doc §8.
3. Không gọi API production / CRM cũ.
4. Styling theo CSS variables hiện có (`global.css`); tránh card/hero marketing thừa trên app nội bộ.
5. Route khai báo trong `apps/web/src/app/router.tsx`.
6. Auth: bọc trong `AppLayout`; trang login đã có.

## After

Khi API sẵn sàng: giữ cùng function API, tắt mock, sửa mismatch nếu có (ưu tiên sửa API cho khớp contract đã chốt).
