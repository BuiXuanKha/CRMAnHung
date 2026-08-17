---
name: ui-guidelines
description: Read and enforce CRMAnHung shared UI rules in docs/UI-GUIDELINES.md before building or redesigning any apps/web UI (public or CRM staff/admin).
---

# UI guidelines

**Trước khi** làm / redesign UI trong `apps/web`:

1. Đọc [`docs/UI-GUIDELINES.md`](../../../docs/UI-GUIDELINES.md) — nguồn quy tắc duy nhất.
2. Xác định bề mặt: **public** hay **CRM** (STAFF / ADMIN).
3. Chỉ áp dụng mục đã **chốt**; mục *Chờ chốt* → hỏi chủ sở hữu hoặc để trống, không đoán theo CRM cũ.
4. Public: thêm `PUBLIC-WEB.md` + `PUBLIC-SEO.md` + skill `web-public-seo`.
5. CRM mock: skill `ui-mock-feature` + domain doc.

## Cấm

- Clone UI `crm.anhungland.com` khi guidelines chưa yêu cầu.
- Bỏ qua file guidelines rồi tự invent visual system mới mỗi PR.
