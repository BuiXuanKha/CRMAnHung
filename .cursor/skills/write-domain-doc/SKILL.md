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

Chủ sở hữu chốt: **mỗi trang chia máy tính / mobile trước**, rồi mới chi tiết từng thành phần. Đánh số, ngắn, một control = một mục. Mẫu: `docs/domains/customers.md` **§12**.

```
12.1 Giao diện máy tính
  (bố cục ngắn)
  12.1.1 Ô tìm …
  12.1.2 Bộ lọc …
  12.1.3 Item
    1. STT
    2. Tên
    3. Icon … — màu, hiện khi nào, bấm thì làm gì
  12.1.4 Footer / rail …

12.2 Giao diện mobile
  (bố cục ngắn)
  12.2.1 Ô tìm — quy tắc field: «cùng 12.1.x»
  12.2.2 Bộ lọc (Bộ lọc + Tìm)
  12.2.3 Item (thẻ)
  12.2.4 Footer / CTA đáy …

12.3 Chi tiết `/…/[id]` nếu có
```

**Làm**

- Tiếng Việt. Gạch đầu dòng / bảng nhỏ. Tên field code trong ngoặc khi cần.
- Icon: màu + ý nghĩa + hành vi bấm (hoặc «chỉ thể hiện»).
- Modal chưa chốt field → một câu «bấm → mở modal; quy tắc modal làm sau».
- Quy tắc tìm giống PC: viết «cùng 12.1» — **không** trộn PC/mobile trong một mục.

**Không**

- Đoạn văn dài, lặp UI-GUIDELINES (màu font, hangtag tone).
- Bịa field modal / API khi chủ chưa chốt.
- Gộp nhiều icon vào một ô «tên khách» mà không tách mục.
- Viết «PC: … / Mobile: …» trong cùng một mục item.

## After

Nhắc user/chuyển sang skill `add-shared-contract` rồi `ui-mock-feature`.
