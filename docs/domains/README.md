# Domains

Đặc tả nghiệp vụ từng module. Template: [`_TEMPLATE.md`](./_TEMPLATE.md).

| Domain | File | Status |
|--------|------|--------|
| Users (login + quản lý NV) | [users.md](./users.md) | Ready — `/login`; ADMIN `/quan-tri/nguoi-dung` |
| Customers | [customers.md](./customers.md) | Ready for API — list + chi tiết `[id]`; lô đất API; tạo lô từ khách STAFF đã có |
| Nguồn Facebook (extension) | [facebook-source.md](./facebook-source.md) | Draft — KEY = NV + nick/page + UID khách (BUG-013 ingest 2026-09-08) |
| Lodats | [lodats.md](./lodats.md) | Done STAFF `/lo-dat`; list ADMIN chưa bàn |
| Addresses | [addresses.md](./addresses.md) | Ready for API — Admin `/cai-dat/dia-chi`; copy data sau |
| Transactions | [transactions.md](./transactions.md) | Ready for API — Prisma + contract; UI mock list + chi tiết + form |
| Title services | [title-services.md](./title-services.md) | Ready for API — copy script + ADMIN lọc NV + audit xem file |
| Công việc (nhắc việc) | [tasks.md](./tasks.md) | Ready for API — bảng `/cong-viec` + FAB tạo + ghim + hoàn thành |
| Users / admin registry | [users.md](./users.md) §11 mục 5 | P4 — CRUD NV, chưa làm |
| Public content (web khách) | [public-content.md](./public-content.md) | Done — STAFF `/dashboard/lo-dat`; bài CMS ADMIN |

Trước khi code UI/API: domain doc phải ở trạng thái **Ready for mock** trở lên.

**Cách viết đặc tả màn:** mỗi trang chia **máy tính** rồi **mobile**, sau đó mới chi tiết từng thành phần — mẫu [`customers.md`](./customers.md) §12. Đánh số, ngắn; không trộn PC/mobile trong một mục.
