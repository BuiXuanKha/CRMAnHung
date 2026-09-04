---
name: fix-audit-bug
description: Fix one OPEN bug from docs/audit/BUGS.md. Verify the bug still exists in current code, explain with examples and proposed fix before coding, then ask owner before merge/deploy. Use when owner says sửa bug, BUG-NNN, sang bug N, or audit bug fix.
---

# Sửa bug audit — CRMAnHung

Áp dụng khi owner giao **một** bug trong [`docs/audit/BUGS.md`](../../../docs/audit/BUGS.md) (vd. BUG-008).

**Không** sửa hàng loạt bug trong một lượt trừ khi owner nói rõ.

## Quy trình bắt buộc (đúng thứ tự)

```
① Đọc mục bug trong BUGS.md
    ↓
② Xác minh code hiện tại CÒN bị bug không
    ↓ còn / không còn
③ Báo owner: còn → giải thích + ví dụ + cách sửa + kết quả sau sửa
         không còn → đóng/ghi FIXED hoặc CLOSED (by design) — không sửa thừa
    ↓ owner đồng ý sửa (hoặc «sửa đi»)
④ Sửa tối thiểu + typecheck + cập nhật BUGS.md
    ↓
⑤ Hỏi owner: có merge vào main để deploy không?
    ↓ chỉ khi owner đồng ý
⑥ Skill deploy-staging (①b nhánh cũ → merge main → Actions)
```

### ① Đọc bug

- Mở đúng mục `### BUG-NNN` trong `docs/audit/BUGS.md`.
- Ghi nhận: Severity, Module, File, Function, Problem, Status.
- Nếu Status đã `FIXED` / `CLOSED` → nói rõ; chỉ làm lại khi owner yêu cầu.

### ② Xác minh còn bug trên code hiện tại

**Trước khi giải thích dài hoặc sửa:** đọc file/hàm cited (và chỗ liên quan). So với Evidence trong sổ.

Kết luận một trong:

| Kết luận | Việc làm |
|----------|----------|
| **STILL_OPEN** | Code vẫn khớp Problem → sang bước ③ rồi sửa khi được phép |
| **ALREADY_FIXED** | Code đã xử lý (owner/PR khác) → cập nhật BUGS.md `FIXED`, không sửa thêm |
| **BY_DESIGN** | Owner / domain chứng minh hành vi đúng → `CLOSED (by design)`, có thể revert fix nhầm |
| **NEEDS VERIFICATION** | Không đủ bằng chứng → hỏi owner, không đoán |

Không tin sổ mù: sau audit, code có thể đã đổi.

### ③ Giải thích trước khi sửa (tiếng Việt, ngắn)

Chỉ khi **STILL_OPEN**. Trả lời owner gồm đủ 4 phần:

1. **Giải thích** — bug là gì, vì sao xấu (tránh jargon; ví dụ đời thường nếu cần).
2. **Ví dụ** — tình huống cụ thể (user `Admin` / `kha`, URL/API, trước/sau hành vi).
3. **Cách sửa** — hướng tối thiểu (file/hàm chính); không over-engineer.
4. **Sửa xong sẽ thành như nào** — hành vi mong đợi + cách owner tự check nhanh.

**Dừng lại** chờ owner chốt («sửa đi» / chỉnh hướng / bỏ) trừ khi tin nhắn hiện tại đã chỉ rõ «sửa bug N».

Khi owner đã nói «sửa» trong cùng lượt sau khi đã hiểu bug → được sửa luôn, vẫn phải làm đủ ② trước đó trong lượt đó.

### ④ Sửa code

- Một bug ≈ một nhánh / một PR nhỏ (`cursor/fix-bug-NNN-…`).
- Sửa tối thiểu đúng Problem; không kéo theo bug khác.
- Áp dụng skill liên quan nếu đụng UI / auth / R2 / SEO (`ui-guidelines`, `security-baseline`, …).
- Typecheck module đã đụng; smoke logic liên quan.
- Cập nhật `docs/audit/BUGS.md`: Status `FIXED`, ghi chú Fix, nhật ký audit; chỉnh đếm OPEN / FIXED.
- Commit + push + mở/cập nhật PR draft.

### ⑤ Hỏi merge / deploy

Sau khi PR sẵn sàng (typecheck OK; CI xanh nếu đã chạy), **hỏi owner**:

> BUG-NNN đã sửa xong (PR #…). Bạn có muốn **merge vào `main` để deploy** lên anhungland.com không?

- **Không** tự merge/deploy.
- Owner đồng ý → skill **`deploy-staging`** (bắt buộc bước ①b: liệt kê PR/nhánh `cursor/*` chưa merge và hỏi nếu còn PR khác).
- Owner chưa đồng ý → dừng; giữ PR.

### ⑥ Sau deploy (nếu có)

- Theo dõi Actions deploy.
- Nhắc cách check nhanh trên https://anhungland.com (đúng mục «Sửa xong sẽ thành như nào»).

## Giọng giải thích

- Tiếng Việt với owner; code/identifier tiếng Anh.
- Ưu tiên ví dụ cụ thể hơn lý thuyết.
- Không dump toàn bộ BUGS.md.

## Cấm

- Sửa bug khi chưa xác minh code hiện tại (bước ②).
- Sửa xong rồi **tự** merge/deploy mà chưa hỏi (bước ⑤).
- Gộp nhiều BUG-NNN vào một PR trừ khi owner bảo gộp.
- Coi UI ẩn nút là đủ bảo mật (xem `security-baseline`).
- Đụng `crm.anhungland.com` / cây CRM cũ khi deploy.

## Checklist PR

- [ ] Đã xác minh STILL_OPEN trên code hiện tại
- [ ] Owner đã được giải thích / đồng ý hướng sửa
- [ ] Fix tối thiểu + typecheck
- [ ] `docs/audit/BUGS.md` cập nhật FIXED
- [ ] Đã hỏi merge/deploy — chỉ merge khi owner đồng ý
