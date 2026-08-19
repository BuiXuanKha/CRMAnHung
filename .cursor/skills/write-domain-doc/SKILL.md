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

## Đặc tả màn hình (đã chốt — dễ đọc)

Chủ sở hữu chốt **đánh số, ngắn, một control = một mục**. Mẫu: `docs/domains/customers.md` **§12**.

```
12.1 Section tìm kiếm
  1. Ô tìm kiếm
  1.1 Tìm theo field … / quy tắc @ @@
  1.2 Nút … → mở modal (chi tiết modal mục riêng, sau)

12.2 Section bảng
  1.1 Tiêu đề cột
  1.2 Item
  1.2.1 STT
  1.2.2 Tên
  1.2.3 Icon … — màu, hiện khi nào, bấm thì làm gì
  …
```

**Làm**

- Tiếng Việt. Gạch đầu dòng / bảng nhỏ. Tên field code trong ngoặc khi cần.
- Icon: màu + ý nghĩa + hành vi bấm (hoặc «chỉ thể hiện»).
- Modal chưa chốt field → một câu «bấm → mở modal; quy tắc modal làm sau».

**Không**

- Đoạn văn dài, lặp UI-GUIDELINES (màu font, hangtag tone).
- Bịa field modal / API khi chủ chưa chốt.
- Gộp nhiều icon vào một ô «tên khách» mà không tách 1.2.x.

## After

Nhắc user/chuyển sang skill `add-shared-contract` rồi `ui-mock-feature`.
