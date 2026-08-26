# Domains

Đặc tả nghiệp vụ từng module. Template: [`_TEMPLATE.md`](./_TEMPLATE.md).

| Domain | File | Status |
|--------|------|--------|
| Users (login) | [users.md](./users.md) | Ready for API — `/login` = bảng User; `/khach-hang` = API khách |
| Customers | [customers.md](./customers.md) | Ready for API — list + chi tiết `[id]` (lô đất trên chi tiết vẫn mock) |
| Lodats | [lodats.md](./lodats.md) | Draft — model chốt; lịch làm §13 (địa chỉ → kho → lô STAFF) |
| Addresses | [addresses.md](./addresses.md) | Ready for API — Admin `/cai-dat/dia-chi`; copy data sau |
| Transactions | [transactions.md](./transactions.md) | Ready for API — Prisma + contract; UI mock list + chi tiết + form |
| Title services | [title-services.md](./title-services.md) | Ready for API — Nest CRUD + tiến độ/thu-chi; chưa file / copy |
| Users / admin registry | [users.md](./users.md) §11 mục 5 | P4 — CRUD NV, chưa làm |

Trước khi code UI/API: domain doc phải ở trạng thái **Ready for mock** trở lên.

**Cách viết đặc tả màn:** mỗi trang chia **máy tính** rồi **mobile**, sau đó mới chi tiết từng thành phần — mẫu [`customers.md`](./customers.md) §12. Đánh số, ngắn; không trộn PC/mobile trong một mục.
