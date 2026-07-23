---
name: write-domain-doc
description: Write or update CRMAnHung domain documentation under docs/domains. Use when starting a new module (customers, lodats, transactions, etc.) or clarifying business rules before coding.
---

# Write domain doc

## Steps

1. Copy `docs/domains/_TEMPLATE.md` → `docs/domains/<slug>.md` (nếu chưa có).
2. Điền đủ mục 1–11; bỏ gợi ý in nghiêng.
3. Đối chiếu nghiệp vụ với FacebookCustomerCRM (**đọc để hiểu**, không dán code).
4. Cập nhật bảng trong `docs/domains/README.md`.
5. Set **Status**:
   - `Draft` — còn open questions
   - `Ready for mock` — đủ để làm UI mock + contract
   - `Ready for API` — contract đã có, sẵn sàng Nest module
   - `Done` — slice đã ship

## Quality bar

- Actors STAFF/ADMIN rõ quyền
- Enum/status có nhãn tiếng Việt
- Use case P1 tối thiểu liệt kê được
- Open questions không để trống im lặng — ghi rõ hoặc quyết định

## After

Nhắc user/chuyển sang skill `add-shared-contract` rồi `ui-mock-feature`.
