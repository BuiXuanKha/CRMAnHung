# AGENTS.md — CRMAnHung

Hướng dẫn cho Cursor Agent (và người) làm việc trong repo này.

## Đọc trước khi code

0. [`docs/FOUNDATION.md`](docs/FOUNDATION.md) — **công cụ / stack đã sẵn chưa?** chạy `pnpm doctor`  
1. [`docs/PLAYBOOK.md`](docs/PLAYBOOK.md) — **thứ tự bắt buộc**: docs → skill → contract → UI mock → API  
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)  
3. [`docs/adr/`](docs/adr/) — quyết định công nghệ  
4. Domain liên quan trong [`docs/domains/`](docs/domains/)  
5. **UI:** [`docs/UI-GUIDELINES.md`](docs/UI-GUIDELINES.md) — quy tắc giao diện (đọc trước khi làm/sửa UI)  
6. Web công khai: [`docs/PUBLIC-SEO.md`](docs/PUBLIC-SEO.md) + [`docs/PUBLIC-WEB.md`](docs/PUBLIC-WEB.md) + skill `web-public-seo`
## Skills (`.cursor/skills/`)

| Skill | Khi nào dùng |
|-------|----------------|
| `crmanhung-playbook` | Mọi task feature — nhắc thứ tự làm việc |
| `fix-audit-bug` | **Sửa 1 bug trong `docs/audit/BUGS.md`** — xác minh còn bug → giải thích/ví dụ/cách sửa → sửa → hỏi merge/deploy |
| `write-domain-doc` | Viết / cập nhật `docs/domains/*` — **máy tính → mobile → chi tiết thành phần**; đánh số, ngắn (mẫu `customers.md` §12) |
| `add-shared-contract` | Thêm Zod/types vào `packages/shared` |
| `ui-guidelines` | **Trước mọi UI** — đọc `docs/UI-GUIDELINES.md` |
| `crm-data-table` | **Bảng list CRM** — hover/scroll/font theo §4.5 |
| `crm-list-state` | **Nhớ tìm/lọc/cuộn list** — `sessionStorage` + `shared/list-state` |
| `crm-dialog` | **Alert / confirm / form modal** — §4.7; không `window.confirm` |
| `ui-mock-feature` | Làm màn hình Web với mock data |
| `nest-domain-module` | Thêm module NestJS API |
| `security-baseline` | Auth, authz, secrets, CORS, upload |
| `cloudflare-r2` | **R2 đã chốt** — credentials + StorageService; không hỏi lại owner |
| `web-public-seo` | **Web công khai** — metadata, sitemap, robots, OG; xem `docs/PUBLIC-SEO.md` |
| `deploy-staging` | **Khi bảo deploy** — gộp vào `main`; Actions tự lên `anhungland.com` (không đụng CRM cũ) |
| `migrate-legacy-data` | **Copy DB cũ → Postgres/R2** — idempotent, preflight FK, không lệch NV (kha/buinam); xem `docs/MIGRATION.md` |

Gọi skill bằng `/skill-name` hoặc để agent tự chọn theo `description`.

## Cloudflare R2

Đã cấu hình bucket `anhungland-crm`. Agent đọc skill **`cloudflare-r2`** (và `apps/api/.env` nếu có).  
**Không** xin lại Account / endpoint / keys / public URL từ chủ sở hữu trừ khi họ rotate token.

## Nguyên tắc ngắn

- Không copy god-file từ `facebookcustomercrm`.
- Không đụng production `crm.anhungland.com` khi deploy — web mới = `anhungland.com`.
- Tiếng Anh trong code; tiếng Việt trong UI/docs user.
- Một PR = một vertical slice nhỏ.
- File > ~400 dòng → tách.

## Stack (tóm tắt)

pnpm monorepo · NestJS + Prisma + **PostgreSQL** · Cloudflare **R2** · **Next.js** · Zod shared · Chrome MV3 — ADR 0001 / 0004 / 0005 / 0006.
