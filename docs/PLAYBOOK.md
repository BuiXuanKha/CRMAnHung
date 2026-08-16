# Playbook làm việc — CRMAnHung

Tài liệu “cách làm” để 5 năm sau vẫn đọc hiểu và mở rộng được.  
**Mọi tính năng mới phải đi theo thứ tự bên dưới** — không nhảy cóc (trừ hotfix bảo mật).

Tham chiếu nhanh:

| Doc | Nội dung |
|-----|----------|
| [ARCHITECTURE.md](./ARCHITECTURE.md) | Kiến trúc tổng thể |
| [PUBLIC-SEO.md](./PUBLIC-SEO.md) | Chuẩn SEO **web công khai** |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | Mắt Bão / staging |
| [MIGRATION.md](./MIGRATION.md) | Migrate từ FacebookCustomerCRM |
| [adr/](./adr/) | Quyết định công nghệ (ADR) |
| [domains/](./domains/) | Đặc tả nghiệp vụ từng module |
| [../AGENTS.md](../AGENTS.md) | Hướng dẫn agent / skill |

---

## 1. Mục tiêu chất lượng

1. **Đọc hiểu được** — docs + code nói cùng một ngôn ngữ domain.
2. **Sửa một chỗ** — contract Zod ở `packages/shared`; UI mock và API cùng dựa vào đó.
3. **An toàn mặc định** — authz ở service, không tin UI; secrets chỉ qua env.
4. **Một vertical slice / PR** — nhỏ, review được, không “làm cả CRM một PR”.
5. **Không copy god-file** từ FacebookCustomerCRM — đọc nghiệp vụ, viết lại sạch.

---

## 2. Thứ tự làm việc (bắt buộc)

```
① Docs nghiệp vụ (domains/)
    ↓
② Skill / quy ước Cursor (nếu pattern mới xuất hiện)
    ↓
③ Contract shared (Zod + types)  ← “API giả định”
    ↓
④ UI + mock data (Web chạy được không cần API thật)
    ↓
⑤ API thật (Nest module) implement đúng contract
    ↓
⑥ Nối Web bỏ mock → API
    ↓
⑦ Extension (nếu domain liên quan ingest)
    ↓
⑧ Test smoke + cập nhật docs user (khi gần xong)
    ↓
⑨ Deploy lên anhungland.com khi slice ổn
```

### Chi tiết từng bước

### ① Viết docs

- Tạo / cập nhật `docs/domains/<domain>.md` theo [template](./domains/_TEMPLATE.md).
- Ghi rõ: actor (STAFF/ADMIN), use case, trạng thái, rule sở hữu dữ liệu, màn hình UI, endpoint dự kiến.
- **Chưa code** cho đến khi docs đủ để người khác implement không cần hỏi lại ý chính.

### ② Viết / cập nhật skill

- Khi có quy trình lặp lại (thêm module Nest, thêm trang mock, thêm Zod schema…) → cập nhật `.cursor/skills/…`.
- Skill là “cách làm trong repo này”, không phải docs nghiệp vụ.

### ③ Contract (`packages/shared`)

- Enum, input/output Zod, type infer.
- Version ý niệm: breaking change phải ghi trong domain doc + changelog ngắn ở đầu file schema.

### ④ UI + mock data

- Feature trong `apps/web/src/features/<domain>/`.
- `mocks/` hoặc `mock-api.ts` — bật bằng `NEXT_PUBLIC_USE_MOCK=true` (mặc định dev có thể bật).
- UI phải dùng type từ `@crmanhung/shared`, không invent shape riêng.

### ⑤ API

- Nest module: `controller → service → prisma`.
- Guard + Roles; ownership check trong service.
- Trả đúng shape contract; map lỗi thành message tiếng Việt ổn định.

### ⑥ Nối thật

- Tắt mock; `apiFetch` gọi `/api/v1/...`.
- Xử lý 401 refresh (đã có sẵn client).

### ⑦ Extension

- Chỉ khi domain cần ingest Meta (customers).
- Background proxy; không gọi API trực tiếp từ page Facebook.

### ⑧–⑨ Kiểm thử & staging

- Ít nhất: happy path tay + 1–2 case quyền (STAFF vs ADMIN).
- Deploy staging theo `DEPLOYMENT.md` (không đụng `crm.anhungland.com`).

---

## 3. Lộ trình sản phẩm (macro)

| Phase | Việc | Kết quả nhìn thấy |
|-------|------|-------------------|
| **P0** | Foundation + playbook + skills | Repo chạy local, auth, docs quy trình |
| **P0b** | Staging Mắt Bão | `anhungland.com` song song CRM cũ |
| **P1** | Customers (docs→mock UI→API→ext) | Quản lý khách + ingest stub |
| **P2** | Lodats + Addresses | Lô đất / địa chỉ |
| **P3** | Transactions + Title services | Giao dịch / sổ đỏ |
| **P4** | Admin registry + migrate data | Sẵn sàng cutover |
| **P5** | Cutover `crm.anhungland.com` | Tắt dần hệ cũ |

Trong mỗi phase domain: **luôn** đi ①→⑨, không code API trước docs/UI mock.

---

## 4. Quy ước đặt tên & chỗ để code

| Thứ | Quy ước |
|-----|---------|
| Code / file / symbol | Tiếng Anh |
| Copy UI, message lỗi user | Tiếng Việt |
| Domain folder | `customers`, `lodats`, `addresses`, `transactions`, `title-services` |
| API prefix | `/api/v1` |
| Enum status | Giữ semantic gần hệ cũ (`KHACH_MOI`, `DANG_BAN`…) để migrate dễ |

---

## 5. Definition of Done (một slice)

- [ ] Domain doc cập nhật
- [ ] Shared contract có schema + export
- [ ] UI mock demo được luồng chính
- [ ] API implement + ownership/role đúng
- [ ] Web nối API (hoặc flag mock rõ)
- [ ] Không lộ secret; không phá CRM production
- [ ] PR mô tả slice + cách thử

---

## 6. Việc **không** làm

- Không thêm dependency “vì thấy hay” nếu chưa có ADR.
- Không god-file (> ~400 dòng hãy tách).
- Không business logic trong React component / Nest controller.
- Không `origin: true` CORS trên production.
- Không commit `.env`, secrets R2, dump DB.
