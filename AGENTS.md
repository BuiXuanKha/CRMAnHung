# AGENTS.md — CRMAnHung

Hướng dẫn cho Cursor Agent (và người) làm việc trong repo này.

## Đọc trước khi code

1. [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) — **thứ tự bắt buộc**: docs → skill → contract → UI mock → API  
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)  
3. [`docs/adr/`](docs/adr/) — quyết định công nghệ  
4. Domain liên quan trong [`docs/domains/`](docs/domains/)

## Skills (`.cursor/skills/`)

| Skill | Khi nào dùng |
|-------|----------------|
| `crmanhung-playbook` | Mọi task feature — nhắc thứ tự làm việc |
| `write-domain-doc` | Viết / cập nhật `docs/domains/*` |
| `add-shared-contract` | Thêm Zod/types vào `packages/shared` |
| `ui-mock-feature` | Làm màn hình Web với mock data |
| `nest-domain-module` | Thêm module NestJS API |
| `security-baseline` | Auth, authz, secrets, CORS, upload |

Gọi skill bằng `/skill-name` hoặc để agent tự chọn theo `description`.

## Nguyên tắc ngắn

- Không copy god-file từ `facebookcustomercrm`.
- Không đụng production `crm.anhungland.com` khi deploy — staging = `crm-next`.
- Tiếng Anh trong code; tiếng Việt trong UI/docs user.
- Một PR = một vertical slice nhỏ.
- File > ~400 dòng → tách.

## Stack (tóm tắt)

pnpm monorepo · NestJS + Prisma + SQLite · React/Vite · Zod shared · Chrome MV3 — chi tiết ADR 0001.
