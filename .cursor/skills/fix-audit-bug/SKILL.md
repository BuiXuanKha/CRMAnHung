---
name: fix-audit-bug
description: Fix one OPEN bug from docs/audit/BUGS.md. Verify still open, explain as Admin/staff with real DB examples when needed, propose fix before coding, ask before merge/deploy. Use when owner says sửa bug, BUG-NNN, sang bug N, or audit bug fix.
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
③ Báo owner: còn → giải thích kiểu thao tác NV/Admin + ví dụ DB thật (khi cần) + cách sửa
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

### ③ Giải thích trước khi sửa (tiếng Việt, dễ hiểu)

Chỉ khi **STILL_OPEN**. Owner phải **hiểu bug bằng thao tác thật**, không chỉ jargon kỹ thuật.

Trả lời gồm đủ các phần:

1. **Ai / ở đâu / làm gì** — vào vai **`Admin`** hoặc **`kha` (NV)**; màn hình/URL CRM; từng bước bấm (vd. `/lo-dat` → Sửa → Lưu). Nói rõ **khi nào thấy lỗi** hoặc hành vi sai.
2. **Ví dụ** — ưu tiên **dữ liệu thật trên DB staging** (xem mục dưới). Nếu không lấy được DB: nói rõ và dùng ví dụ giả *gần* nghiệp vụ, không bịa số liệu như thể đã query.
3. **Vì sao xấu** — một câu hậu quả nghiệp vụ (mất data, kẹt thao tác, khách thấy sai…).
4. **Cách sửa** — hướng tối thiểu (file/hàm chính); không over-engineer. *(Bỏ qua nếu owner chỉ bảo «xem / giải thích / sang bug».)*
5. **Sửa xong sẽ thành như nào** — hành vi mong đợi + cách owner tự check nhanh. *(Chỉ khi đang đề xuất sửa.)*

**Dừng lại** chờ owner chốt («sửa đi» / chỉnh hướng / bỏ) trừ khi tin nhắn hiện tại đã chỉ rõ «sửa bug N».

Khi owner đã nói «sửa» trong cùng lượt sau khi đã hiểu bug → được sửa luôn, vẫn phải làm đủ ② trước đó trong lượt đó.

#### Ví dụ từ DB thật (bắt buộc khi cần minh họa)

Khi bug phụ thuộc dữ liệu (trùng SĐT, lô kho, map chủ, gộp khách, share…) hoặc owner bảo «cho ví dụ / không hiểu»:

1. **Query chỉ đọc** Postgres trên VPS staging (secret/SSH đã có trong môi trường agent — giống `migrate-legacy-data`). App path thường: `/var/www/crmanhung/repo/apps/api` + `DATABASE_URL` trong `.env`.
2. Chỉ `SELECT` / `\d` / đếm. **Cấm** `INSERT` / `UPDATE` / `DELETE` / migrate chỉ để «tạo ví dụ».
3. Trong câu trả lời: nêu **tên thật rút gọn** đủ nhận ra (NV `kha`, số lô kho, tên khách, dự án…) + thao tác UI tương ứng. Không dump UUID dài trừ khi owner cần.
4. Không in `DATABASE_URL`, mật khẩu, hash. Không ghi secret vào skill/PR/chat dư thừa.
5. Không có case khớp trên DB → nói thẳng «DB hiện không có hàng X»; mô tả kịch bản sẽ xảy ra **nếu** có, kèm 1 hàng thật gần nhất (vd. lô cùng dự án của `kha`) để neo ngữ cảnh.

Mẫu giọng (đúng ý owner):

> Tôi vào vai **NV `kha`**. Vào **`/lo-dat`**, thấy lô **LK2 - 5** (Đồng Khê, chủ Minh Quý). Nếu … thì khi bấm **…** sẽ …

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
- **Thao tác theo vai NV/Admin** trước, lý thuyết/API sau.
- **Ví dụ DB thật** khi cần minh họa; không thay bằng abstraction nếu đã query được.
- Không dump toàn bộ BUGS.md.

## Cấm

- Sửa bug khi chưa xác minh code hiện tại (bước ②).
- Giải thích chỉ bằng jargon (unique index, DTO…) mà **không** nói được user bấm gì ở màn nào.
- Bịa ví dụ «như thật» khi chưa query — phải ghi là giả định.
- Ghi/sửa DB chỉ để tạo case demo.
- Sửa xong rồi **tự** merge/deploy mà chưa hỏi (bước ⑤).
- Gộp nhiều BUG-NNN vào một PR trừ khi owner bảo gộp.
- Coi UI ẩn nút là đủ bảo mật (xem `security-baseline`).
- Đụng `crm.anhungland.com` / cây CRM cũ khi deploy.

## Checklist PR

- [ ] Đã xác minh STILL_OPEN trên code hiện tại
- [ ] Owner đã được giải thích kiểu thao tác NV/Admin (+ ví dụ DB nếu cần) / đồng ý hướng sửa
- [ ] Fix tối thiểu + typecheck
- [ ] `docs/audit/BUGS.md` cập nhật FIXED
- [ ] Đã hỏi merge/deploy — chỉ merge khi owner đồng ý
