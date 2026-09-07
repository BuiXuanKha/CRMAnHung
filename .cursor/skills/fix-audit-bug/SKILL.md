---
name: fix-audit-bug
description: Fix one OPEN bug from docs/audit/BUGS.md. Verify still open, explain as Admin/staff with real DB examples when needed, open a PR per bug, batch ask merge/deploy every 5 PRs. Use when owner says sửa bug, BUG-NNN, sang bug N, or audit bug fix.
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
④ Sửa tối thiểu + typecheck + cập nhật BUGS.md + PR
    ↓
⑤ Batch merge/deploy — xem mục «Batch 5 PR» (không hỏi deploy sau mỗi bug)
    ↓ khi đủ điều kiện / owner bảo deploy
⑥ Skill deploy-staging (①b gộp hết PR pending → merge main → Actions một lần)
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

#### Câu đủ nghĩa (bắt buộc — owner 2026-09-07)

Giải thích với owner bằng **câu tiếng Việt đủ nghĩa**: có **tên** (người, màn hình, lô, URL), có **chủ ngữ** và **vị ngữ** rõ. **Không** viết tắt gọn, **không** câu cụt, **không** ký hiệu thay cho lời (`-2`, `→`, `∩`) nếu chưa nói bằng chữ đó là gì.

| Làm | Không làm |
|-----|-----------|
| «Nếu hai lô cùng đường dẫn, lô mới được thêm chữ `-2` vào **cuối** URL, ví dụ `lo-dat-nam-sach-2`.» | «Trùng thì -2.» |
| «Chỗ hở còn lại là lúc tạo lô mới trùng URL đang chuyển hướng.» | «Lỗ vẫn còn lúc tạo lô mới.» (mơ hồ: lỗ hổng hay lỗi?) |
| «Tôi vào vai nhân viên `kha`. Tôi mở `/dashboard/lo-dat` rồi soạn bài đăng.» | «kha /dashboard/lo-dat soạn → lưu raw.» |

Thuật ngữ kỹ thuật (slug, 301, unique) chỉ dùng **sau** khi đã nói bằng lời thường. Số, hậu tố, tên file: viết rõ «thêm», «đổi thành», «không phải trừ đi hai ký tự».

Trả lời gồm đủ các phần (mỗi phần là câu đủ chủ-vị, không gạch đầu dòng cụt):

1. **Ai / ở đâu / làm gì** — vào vai **`Admin`** hoặc **`kha` (NV)**; màn hình/URL CRM; từng bước bấm (vd. Tôi mở `/lo-dat`, tôi bấm Sửa, tôi bấm Lưu). Nói rõ **khi nào thấy lỗi** hoặc hành vi sai.
2. **Ví dụ** — ưu tiên **dữ liệu thật trên DB staging** (xem mục dưới). Nếu không lấy được DB: nói rõ và dùng ví dụ giả *gần* nghiệp vụ, không bịa số liệu như thể đã query.
3. **Vì sao xấu** — một hoặc vài câu hậu quả nghiệp vụ (mất data, kẹt thao tác, khách thấy sai…).
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

> Tôi vào vai nhân viên **`kha`**. Tôi mở trang **`/lo-dat`**. Tôi thấy lô **LK2 - 5** (Đồng Khê, chủ Minh Quý). Nếu tôi bấm **Sửa** rồi **Lưu** trong tình huống … thì màn hình sẽ hiện … / khách trên web sẽ thấy …

### ④ Sửa code

- Một bug ≈ một nhánh / một PR nhỏ (`cursor/fix-bug-NNN-…`).
- Sửa tối thiểu đúng Problem; không kéo theo bug khác.
- Áp dụng skill liên quan nếu đụng UI / auth / R2 / SEO (`ui-guidelines`, `security-baseline`, …).
- Typecheck module đã đụng; smoke logic liên quan.
- Cập nhật `docs/audit/BUGS.md`: Status `FIXED`, ghi chú Fix, nhật ký audit; chỉnh đếm OPEN / FIXED.
- Commit + push + mở/cập nhật PR (draft OK). **Chưa merge.**
- Kết thúc lượt: báo ngắn «BUG-NNN xong — PR #… (chờ batch)» + đếm PR bug chưa merge (xem dưới). Sang bug tiếp nếu owner đang duyệt tuần tự.

### ⑤ Batch 5 PR rồi mới hỏi merge / deploy

Owner chốt: **không** hỏi merge/deploy sau mỗi bug — chờ deploy từng cái rất chậm.

**Đếm PR bugfix đang mở vào `main`:**

```bash
gh pr list --base main --state open --limit 30 \
  --json number,title,headRefName,isDraft,statusCheckRollup
```

Chỉ tính PR `cursor/fix-bug-*` (hoặc title/body rõ `BUG-NNN` audit fix). Không tính PR skill/docs linh tinh trừ khi owner bảo gộp chung.

| Tình huống | Việc làm |
|------------|----------|
| Chưa đủ **5** PR bug mở | **Không** hỏi deploy. Tiếp bug / chờ owner. Nhắc: `Đã có N/5 PR — chưa hỏi deploy.` |
| Đủ **≥ 5** PR bug mở | **Một lần** hỏi: liệt kê PR # theo thứ tự BUG (nhỏ → lớn), xin phép **merge tuần tự rồi deploy một lần**. |
| Owner nói **deploy** / **merge deploy** bất kỳ lúc nào | Làm ngay (kể cả &lt; 5) — skill `deploy-staging` (①b gộp hết pending). |
| Owner nói **merge PR này** / **deploy ngay bug N** | Merge đúng phạm vi owner nói; không ép đủ 5. |

Khi được phép batch:

1. CI xanh từng PR (hoặc sửa cho xanh).
2. `gh pr ready` nếu draft.
3. Merge **tuần tự** theo số BUG tăng dần (tránh conflict chồng).
4. Một lần push `main` → Actions deploy (skill **`deploy-staging`**).
5. Sau deploy: health check; nhắc owner đợt đã lên gồm BUG-… nào.

**Không** tự merge/deploy khi chưa đủ 5 và owner chưa bảo deploy.

### ⑥ Sau deploy (nếu có)

- Theo dõi Actions deploy.
- Nhắc cách check nhanh trên https://anhungland.com (các bug trong đợt).

## Giọng giải thích

- Tiếng Việt với owner; code/identifier tiếng Anh.
- **Câu đủ nghĩa:** chủ ngữ + vị ngữ; gọi tên người, màn, lô, URL. Không câu cụt, không viết tắt gọn.
- **Thao tác theo vai NV/Admin** trước, lý thuyết/API sau.
- **Ví dụ DB thật** khi cần minh họa; không thay bằng abstraction nếu đã query được.
- Không dump toàn bộ BUGS.md.

## Cấm

- Sửa bug khi chưa xác minh code hiện tại (bước ②).
- Giải thích chỉ bằng jargon (unique index, DTO…) mà **không** nói được user bấm gì ở màn nào.
- Giải thích bằng câu cụt / ký hiệu (`-2`, `→`) mà **không** nói thành lời đó là gì; dùng từ mơ hồ («lỗ») khi cần nói **lỗ hổng** hay **lỗi**.
- Bịa ví dụ «như thật» khi chưa query — phải ghi là giả định.
- Ghi/sửa DB chỉ để tạo case demo.
- Hỏi merge/deploy **sau mỗi** bug fix (trái batch 5) — trừ khi owner chủ động bảo deploy/merge ngay.
- Tự merge/deploy khi chưa đủ 5 PR và owner chưa bảo deploy.
- Gộp nhiều BUG-NNN vào một PR trừ khi owner bảo gộp.
- Coi UI ẩn nút là đủ bảo mật (xem `security-baseline`).
- Đụng `crm.anhungland.com` / cây CRM cũ khi deploy.

## Checklist PR

- [ ] Đã xác minh STILL_OPEN trên code hiện tại
- [ ] Owner đã được giải thích kiểu thao tác NV/Admin (+ ví dụ DB nếu cần) / đồng ý hướng sửa
- [ ] Fix tối thiểu + typecheck
- [ ] `docs/audit/BUGS.md` cập nhật FIXED
- [ ] PR đã mở, **chưa** merge (trừ khi đang chạy batch / owner bảo deploy)
- [ ] Đếm PR bug mở: &lt; 5 → không hỏi deploy; ≥ 5 → hỏi merge tuần tự + deploy một lần
