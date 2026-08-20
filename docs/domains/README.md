# Domains

Đặc tả nghiệp vụ từng module. Template: [`_TEMPLATE.md`](./_TEMPLATE.md).

| Domain | File | Status |
|--------|------|--------|
| Users (login) | [users.md](./users.md) | Ready for API — `/login` = bảng User; list CRM vẫn mock |
| Customers | [customers.md](./customers.md) | Ready for mock — §12 theo CRM cũ; §11 backlog lệch mock |
| Lodats | [lodats.md](./lodats.md) | Ready for mock — §12 list `/lo-dat` |
| Addresses | _(tạo khi P2)_ | — |
| Transactions | [transactions.md](./transactions.md) | Ready for mock — §12 list `/giao-dich` |
| Title services | [title-services.md](./title-services.md) | Ready for mock — §12 list `/dich-vu-so-do` |
| Users / admin registry | [users.md](./users.md) §11 mục 5 | P4 — CRUD NV, chưa làm |

Trước khi code UI/API: domain doc phải ở trạng thái **Ready for mock** trở lên.

**Cách viết đặc tả màn:** mỗi trang chia **máy tính** rồi **mobile**, sau đó mới chi tiết từng thành phần — mẫu [`customers.md`](./customers.md) §12. Đánh số, ngắn; không trộn PC/mobile trong một mục.
