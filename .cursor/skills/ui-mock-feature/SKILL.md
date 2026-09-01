---
name: ui-mock-feature
description: Build CRMAnHung web UI features under apps/web following feature-folder structure. CRM screens call the Nest API (no staff/admin123 mock login).
---

# UI feature (CRM = API)

## Prerequisites

- Đọc [`docs/UI-GUIDELINES.md`](../../../docs/UI-GUIDELINES.md) (+ skill `ui-guidelines`) — **quy tắc UI đã chốt**
- Domain doc status ≥ `Ready for mock` (trừ trang marketing public thuần — theo `PUBLIC-SEO.md`)
- Contract đã có trong `@crmanhung/shared` (hoặc thêm cùng PR **trước** UI) — **không bắt buộc** với landing public tĩnh
- Trang **web công khai**: đọc skill **`web-public-seo`** + `docs/PUBLIC-SEO.md`

## Layout

```
apps/web/app/(public)/…          # web công khai — SEO bắt buộc
apps/web/app/(crm)/<route>/page.tsx   # Next.js App Router CRM
apps/web/src/features/<domain>/
  components/      # UI chỉ dùng trong domain
  api.ts           # hàm gọi API thật
  hooks.ts         # optional
```

## CRM data

- Login + list CRM gọi Nest (`apiFetch` trong `api.ts`).
- **Không** thêm user nháp `staff`/`staff123` hay `admin`/`admin123`, không RAM store theo 2 user đó.
- Catalog marketing public: `features/public/mock-data.ts` (không phải user CRM).

## Rules

1. Dùng type từ `@crmanhung/shared` — không invent interface cục bộ trùng nghĩa.
2. UI phủ đủ trạng thái trong domain doc §8 / §12.
3. Không gọi API production / CRM cũ (`crm.anhungland.com`).
4. Styling theo `docs/UI-GUIDELINES.md` + CSS variables; tránh card/hero marketing thừa trên app nội bộ. Bảng list → skill **`crm-data-table`** / §4.5.
5. Route = thư mục trong `apps/web/app/(crm)/…` (App Router).
6. Auth: bọc bởi `(crm)/layout.tsx` → `AppShell`; trang `/login` riêng.
