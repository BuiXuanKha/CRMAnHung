---
name: crmanhung-playbook
description: Enforce CRMAnHung feature workflow — docs then skills then shared contract then UI mock then API. Use for any new feature, domain work, or when unsure what to build next.
---

# CRMAnHung playbook

Trước mọi feature: `docs/FOUNDATION.md` + `pnpm doctor` (FAIL → sửa nền trước).

Trước khi viết code feature, đọc `docs/PLAYBOOK.md` và làm **đúng thứ tự**:

1. **Docs** — `docs/domains/<domain>.md` (status ≥ Ready for mock)
2. **Skill** — cập nhật `.cursor/skills` nếu xuất hiện pattern mới
3. **Contract** — Zod/types trong `packages/shared`
4. **UI + mock** — `apps/web` với `NEXT_PUBLIC_USE_MOCK` / mock module
5. **API** — Nest module implement contract
6. **Nối UI → API**
7. **Extension** chỉ nếu domain cần ingest Meta
8. Smoke test + cập nhật docs nếu cần
9. Staging deploy chỉ khi được yêu cầu (`crm-next`, không đụng `crm.anhungland.com`)

## Cấm

- Code API trước khi có domain doc + contract
- Copy nguyên file lớn từ FacebookCustomerCRM
- God-file / business logic trong controller hoặc React view
- Commit `.env`, secrets R2, dump DB

## Definition of Done

Checklist trong `docs/PLAYBOOK.md` §5 — đánh dấu trong PR description.
