---
name: crmanhung-playbook
description: Enforce CRMAnHung feature workflow — docs then skills then shared contract then UI mock then API. Use for any new feature, domain work, or when unsure what to build next.
---

# CRMAnHung playbook

Trước mọi feature: `docs/FOUNDATION.md` + `pnpm doctor` (FAIL → sửa nền trước).

Trước khi viết code feature, đọc `docs/PLAYBOOK.md` và làm **đúng thứ tự**:

1. **Docs** — `docs/domains/<domain>.md` (status ≥ Ready for mock). List UI: máy tính → mobile → chi tiết thành phần (`customers.md` §12).
2. **Skill** — cập nhật `.cursor/skills` nếu xuất hiện pattern mới
3. **Contract** — Zod/types trong `packages/shared`
4. **UI + mock** — `apps/web` với `NEXT_PUBLIC_USE_MOCK` / mock module
5. **API** — Nest module implement contract
6. **Nối UI → API**
7. **Extension** chỉ nếu domain cần ingest Meta
8. Smoke test + cập nhật docs nếu cần
9. Staging deploy chỉ khi được yêu cầu (`anhungland.com`, không đụng `crm.anhungland.com`)
10. **Web công khai** — áp dụng skill `web-public-seo` / `docs/PUBLIC-SEO.md`
11. **UI** — đọc `docs/UI-GUIDELINES.md` (skill `ui-guidelines`) trước khi làm/sửa giao diện; bảng list → `crm-data-table` / §4.5; icon Lucide §4.6; dialog → `crm-dialog` / §4.7

## Cấm

- Code API trước khi có domain doc + contract
- Copy nguyên file lớn từ FacebookCustomerCRM
- God-file / business logic trong controller hoặc React view
- Commit `.env`, secrets R2, dump DB
- Làm UI bỏ qua `UI-GUIDELINES.md` hoặc tự clone CRM cũ khi chưa được yêu cầu
- Invent style bảng list CRM khác §4.5
- Invent icon set / hangtag màu / `window.confirm` lệch §4.6–4.7

## Definition of Done

Checklist trong `docs/PLAYBOOK.md` §5 — đánh dấu trong PR description.
