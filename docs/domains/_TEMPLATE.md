# Domain: \<Tên\>

> Copy file này thành `docs/domains/<slug>.md`. Xóa các gợi ý in nghiêng khi viết xong.

- **Slug:** `customers` | `lodats` | …
- **Status:** Draft | Ready for mock | Ready for API | Done
- **Owner:** …
- **Liên quan hệ cũ:** đường dẫn / màn hình FacebookCustomerCRM (để đối chiếu nghiệp vụ, không copy code)

---

## 1. Mục đích

_Một đoạn: domain này giải quyết việc gì cho nhân viên An Hưng Land?_

## 2. Actors & quyền

| Actor | Được làm | Không được |
|-------|----------|------------|
| STAFF | … | … |
| ADMIN | … | … |

## 3. Khái niệm & trạng thái

| Thuật ngữ | Nghĩa |
|-----------|--------|
| … | … |

**State machine / enum** (nếu có): liệt kê giá trị + nhãn tiếng Việt.

## 4. Use cases

1. **…** — trigger, bước chính, kết quả
2. …

## 5. Quan hệ dữ liệu

- Entity chính → quan hệ (1-1, 1-n, n-n)
- Ownership: theo `employeeId`? shared?

## 6. UI (màn hình)

| Màn | Route | Hành vi chính |
|-----|-------|----------------|
| List | `/…` | … |
| Detail | `/…/:id` | … |

Đặc tả list/modal: **đánh số, ngắn** (một control = một mục). Mẫu: [`customers.md`](./customers.md) §12. Icon: màu, hiện khi nào, bấm thì làm gì. Modal chưa chốt → «bấm → mở modal; quy tắc sau».

## 7. Contract / API dự kiến

Prefix: `/api/v1/...`

| Method | Path | Body / query | Response | Auth |
|--------|------|--------------|----------|------|
| GET | … | … | … | JWT |

Schema Zod sẽ nằm ở `packages/shared/src/<domain>.ts`.

## 8. Mock data cần có

- Ít nhất 3–5 bản ghi đủ trạng thái khác nhau
- Case biên: rỗng, lỗi quyền, validation

## 9. Extension? 

- [ ] Không
- [ ] Có — mô tả payload ingest

## 10. Migrate từ hệ cũ

Bảng / field map ngắn (chi tiết ở MIGRATION.md nếu lớn).

## 11. Open questions

- …
