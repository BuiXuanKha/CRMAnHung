# Checklist hoàn thiện — góc Admin

- **Ngày ghi:** 2026-09-11
- **Người ghi:** rà soát vai Admin trên `anhungland.com` (docs + code, không audit lại toàn bộ)
- **Mục đích:** mai owner/agent lấy từng mục ra làm. **Một mục = một PR** (playbook). Không nhảy cóc: docs → contract → UI → API.
- **Không phải:** sổ bug. Bug OPEN vẫn nằm ở [`audit/BUGS.md`](./audit/BUGS.md). File này là **việc sản phẩm / thao tác Admin còn thiếu**.

Cách dùng: tick `[x]` khi xong trên `main` + đã deploy (nếu slice cần lên staging). Cột **Chốt** = cần owner nói «làm / bỏ / hoãn / hướng khác» trước khi code.

---

## 0. Đã xong — đừng làm lại

Admin **đã dùng được** trên CRM mới:

| Việc | Chỗ |
|------|-----|
| Đăng nhập / đăng xuất / đổi mật khẩu | `/login`, avatar menu |
| CRUD nhân viên (thêm, sửa, vô hiệu hóa, reset MK, avatar) | `/quan-tri/nguoi-dung` — **không** xóa cứng User |
| Xem mọi khách / lô / GD / sổ đỏ | `/khach-hang`, `/lo-dat`, `/giao-dich`, `/dich-vu-so-do` |
| Hotline nguồn khi thêm khách | Cài đặt → Quản lý SĐT |
| Sổ địa chỉ (tỉnh → huyện → xã → thôn/dự án) + ảnh dự án | Cài đặt → Quản lý địa chỉ |
| Import Excel kho lô vào **dự án chưa có lô** | Cài đặt → Import lô đất Excel |
| Dashboard bài CMS: tạo, xuất bản, gỡ về nháp, thống kê share | `/dashboard`, `/dashboard/bai-viet`, `/dashboard/thong-ke` |
| Lọc nhân viên trên list sổ đỏ | `/dich-vu-so-do` (select NV) |

**Cố ý không cho Admin** (chốt owner, không mở lại trừ khi bảo):

- Tạo lô từ menu khách
- Đổi chủ lô
- Tạo giao dịch
- Tạo hồ sơ sổ đỏ
- Soạn / đăng bài listing lô (STAFF soạn trên `/lo-dat`)
- Gộp hai hồ sơ khách (chỉ NV gộp khách **của mình**)

CRM cũ `crm.anhungland.com` **vẫn chạy**. Web mới = `anhungland.com`. Cutover subdomain cũ = mục D, sau P4.

---

## A. Đau ngay — nên làm trước

Việc Admin **đụng hàng ngày** mà đang kẹt hoặc thiếu nút.

### A1. Sửa nội dung bài CMS đã tạo

- **Chốt:** HOÃN (owner 2026-09-06 — «làm sau»). Mai nếu làm: bỏ HOÃN trên BUG-056.
- **Bug:** [BUG-056](./audit/BUGS.md) — MEDIUM, OPEN
- **Ai / ở đâu:** Admin mở `/dashboard/bai-viet` hoặc Tổng quan `/dashboard`. Bài đã Lưu nháp / Xuất bản.
- **Hiện tại:** API chỉ `POST` tạo + `PATCH /admin/public-web/posts/:id/status`. Dialog «Soạn bài viết» luôn tạo bài mới. Sai chính tả / ảnh / HTML → **không Lưu đè**. Soạn lại cùng tiêu đề → slug `-2`, xuất bản cả hai URL khách.
- **Mong đợi:** mở bài đã có → sửa title / body / ảnh bìa / excerpt / meta → Lưu. Không tạo slug mới. GPT «Dùng cho bài soạn» điền vào bài đang mở, không `POST` bài thứ hai.
- **File neo:** `apps/api/src/modules/public-content/admin-public-web.controller.ts`, `public-content.service.ts`; `apps/web/src/features/public-content/components/compose-post-dialog.tsx`; `docs/domains/public-content.md` §7 / §14
- **Playbook:** cập nhật domain + Zod PATCH → UI dialog edit → API `PATCH /posts/:id` (không đổi slug trừ khi owner chốt được đổi)

Checklist:

- [ ] Owner xác nhận: **làm** (bỏ HOÃN) hay vẫn để sau
- [ ] Domain `public-content.md`: thêm PATCH nội dung; cấm tạo trùng published cùng ý
- [ ] Contract Zod update post
- [ ] API PATCH title/body/cover/excerpt/seo (giữ slug)
- [ ] UI: Soạn = sửa bài đang chọn; GPT đổ vào form đang mở
- [ ] Không xuất bản hai bài cùng chuyên mục + cùng ý do «soạn lại»
- [ ] Đánh BUG-056 FIXED khi xong

---

### A2. Lọc nhân viên trên list khách

- **Chốt:** chưa bàn (sổ đỏ đã có lọc NV; khách thì chưa)
- **Ai / ở đâu:** Admin `/khach-hang` — đang thấy **hết** khách công ty, không chọn được «chỉ khách của Kha»
- **Hiện tại:** `GET /customers` ADMIN không lọc `employeeId`. STAFF tự hẹp theo owner. List không có select NV.
- **Mong đợi (đề xuất):** cùng pattern sổ đỏ — dropdown nhân viên trên filter bar; STAFF không thấy ô này. Nhớ lọc trong `sessionStorage` (skill `crm-list-state`).
- **File neo:** `docs/domains/customers.md` §12; `apps/web/src/features/customers/customer-list-page.tsx`; `apps/api/src/modules/customers`
- **Mẫu UI:** `apps/web/src/features/title-services/components/filter-bar.tsx` (`showEmployeeFilter`)

Checklist:

- [ ] Owner: lọc theo NV phụ trách khách (`employeeId`) — đúng chứ?
- [ ] Domain §12 máy tính + mobile: thêm control lọc NV (Admin)
- [ ] Query API `employeeId` (ADMIN only; STAFF bỏ qua / 403)
- [ ] UI select + list-state
- [ ] Footer đếm theo lọc

---

### A3. Lọc nhân viên trên list lô đất

- **Chốt:** list ADMIN `/lo-dat` **chưa bàn** (`lodats.md` mục 14 — «làm sau»). Lọc NV có thể làm **trước** khi chốt gộp/tách dòng kho.
- **Ai / ở đâu:** Admin `/lo-dat` — API trả mọi `Lodat` (`ownershipWhere` ADMIN = `{}`). UI không lọc NV. Cùng số lô kho (LK12) có thể **nhiều dòng** (mỗi NV một luồng) — dễ rối nếu không biết dòng của ai.
- **Mong đợi (đề xuất tối thiểu):** dropdown NV = `createdByEmployeeId` (người giữ luồng). Chưa đổi cách gộp dòng (xem C1).
- **File neo:** `docs/domains/lodats.md` §11 / §12 / mục 14; `apps/web/src/features/lodats/lodat-list-page.tsx`; `lodats.service.ts` `list`

Checklist:

- [ ] Owner: lọc theo NV giữ luồng, chưa gộp LK12 — được làm trước C1?
- [ ] Domain §12: control lọc NV Admin
- [ ] API query + UI + list-state
- [ ] Cột hoặc hangtag tên NV trên dòng (nếu list lẫn nhiều NV)

---

### A4. Lọc nhân viên trên list giao dịch

- **Chốt:** BUG-051 ghi «lọc NV Admin **không làm**» khi sửa phân trang. Domain `transactions.md` §11: CRM cũ có lọc NV; mới «chưa mock cột NV» — **query `createdByEmployeeId` đã có trên contract + `transactions/api.ts`**.
- **Ai / ở đâu:** Admin `/giao-dich` — thấy hết GD, **không có** select NV trên UI (khác sổ đỏ).
- **Mong đợi:** dropdown NV giống `/dich-vu-so-do`; 3 thẻ doanh thu/hoa hồng theo đúng lọc.
- **File neo:** `docs/domains/transactions.md` §2 / §11 / §12; `apps/web/src/features/transactions/`; `packages/shared` query GD

Checklist:

- [ ] Owner: làm lọc NV trên GD (lệch sổ đỏ hôm nay)
- [ ] Domain §12: control Admin
- [ ] UI nối query đã có; list-state
- [ ] Thẻ thống kê theo cùng `createdByEmployeeId`

---

## B. Thao tác quản trị còn thiếu

### B1. Quản trị khách — xóa cứng / registry (P4)

- **Chốt:** 2026-08-24 — **chưa làm**. UI-GUIDELINES §5: tạm hoãn P4.
- **Ai / ở đâu:** menu Admin **Quản trị khách** → `/quan-tri/khach-hang`
- **Hiện tại:** `PlaceholderPage` — «Registry toàn hệ thống (ADMIN) — triển khai ở P4.» Ẩn khách trên `/khach-hang` chỉ là **xóa mềm** (`isHidden`). STAFF không vào `/quan-tri/*` (BUG-012 / BUG-083 FIXED).
- **Mong đợi:** Admin tìm khách toàn hệ thống; xóa cứng có xác nhận (dialog §4.7); quyết định cascade (lô/GD/sổ/chat/R2) **trước khi code** — rất dễ mất data. Liên quan BUG-016 (gộp Person) và BUG-027 / BUG-063 (ẩn không cascade — owner chốt hướng B).
- **File neo:** `apps/web/app/(crm)/quan-tri/khach-hang/page.tsx`; `docs/domains/customers.md` §11 mục 26; ARCHITECTURE «Admin registry»

Checklist:

- [ ] Owner chốt: xóa cứng xóa những gì (Person + FB + SĐT + chat + map + cấm khi còn GD/sổ?)
- [ ] Domain registry (máy tính → mobile → control) — status Ready for mock
- [ ] Contract + API ADMIN only
- [ ] UI thay placeholder; confirm CrmDialog
- [ ] Không để STAFF gọi API dù biết URL
- [ ] Cập nhật UI-GUIDELINES §5 khi xong

---

### B2. Sửa / xóa từng dòng kho `ProjectLot`

- **Chốt:** Import Excel **xong** (BUG-048). `lodats.md` §13: «Sửa/xoá từng dòng kho — sau». Admin **cấm** xóa kho khi còn `Lodat` đang trỏ.
- **Ai / ở đâu:** Cài đặt → Quản lý địa chỉ, sửa địa chỉ **Dự án**. Hiện có ảnh dự án + badge số lô. **Không** form sửa LK12 / DT / MT / hướng / ghi chú từng dòng kho.
- **Hiện tại:** `POST /addresses/:id/lodats/import` — tối đa 2500 dòng, **chỉ dự án chưa có** `ProjectLot`. Không PATCH/DELETE `ProjectLot`.
- **Mong đợi:** Admin mở kho của dự án → sửa DT/MT/hướng/ghi chú/số lô; xóa dòng trống (chưa ai trỏ); sửa DT trên kho → mọi luồng NV thấy số mới (JOIN, không copy).
- **File neo:** `docs/domains/lodats.md` §0.4 / §13 mục 5; `docs/domains/addresses.md` §4; `apps/api/src/modules/addresses/import-project-lots.ts`

Checklist:

- [ ] Domain: màn kho (trong sổ địa chỉ hay dialog riêng)
- [ ] API PATCH/DELETE `ProjectLot`; DELETE 409 nếu còn `Lodat`
- [ ] Unique số lô trong cùng dự án
- [ ] UI Admin; STAFF không sửa kho
- [ ] Sửa DT → list `/lo-dat` + form NV đọc số mới, không nhân bản

---

### B3. Bổ sung lô vào dự án **đã có kho**

- **Chốt:** `lodats.md` «nhẹ hơn (mặc định nếu không bác): admin được bổ sung lô vào dự án đã import». Import hiện **từ chối** khi `_count.projectLots > 0`.
- **Ai / ở đâu:** Cài đặt → Import Excel. Admin thêm LK mới vào dự án đã import lần đầu.
- **Mong đợi:** import (hoặc form một dòng) **cộng** vào kho; trùng số lô → báo, không đè im lặng.

Checklist:

- [ ] Owner: Excel bổ sung vs form từng dòng vs cả hai
- [ ] Nới rule «chỉ dự án trống»; unique title/số lô trong địa chỉ
- [ ] UI: chọn được dự án đã có lô; xem trước dòng trùng

---

### B4. Nhật ký xem file sổ đỏ (chỉ UI)

- **Chốt:** API **đã ghi** `TitleServiceAttachmentView` khi cấp signed URL. Domain: «chưa UI nhật ký». P3 ghi **không làm** màn list nhật ký.
- **Ai / ở đâu:** Admin mở hồ sơ `/dich-vu-so-do/[id]`, xem CCCD/sổ — DB có ai xem lúc nào, **không có bảng trên UI**.
- **Mong đợi (nếu làm):** panel «Ai đã xem tài liệu» trên chi tiết hồ sơ (ADMIN; có thể cả NV chủ hồ sơ).

Checklist:

- [ ] Owner: có cần màn này không, hay đủ ghi DB?
- [ ] Nếu làm: domain §12 chi tiết + API list view + UI

---

### B5. Công việc — Admin xem việc cả công ty?

- **Chốt:** `tasks.md` §11 **open question**. Hiện `/cong-viec` = việc **của mình** (Admin cũng vậy). Pin/complete việc người khác → 404.
- **Mong đợi (nếu chốt Có):** list + lọc NV; không sửa việc NV trừ khi owner cho phép.

Checklist:

- [ ] Owner: Admin xem / không xem / chỉ xem không sửa
- [ ] Nếu Có: domain + API + UI + list-state

---

## C. Cần owner chốt hướng — đừng code trước

### C1. List `/lo-dat` Admin: tách theo NV hay gộp theo số lô kho?

- **Chốt:** tạm hoãn, chờ bàn (`lodats.md` §11).
- **Vấn đề:** Cùng LK12, NV A và NV B = hai `Lodat` (luồng độc lập). List hiện từng dòng. Gộp 1 dòng thì mất giá/chủ/mở bán theo NV. Tách thì Admin thấy «trùng LK12».
- **Đề xuất cũ:** «mỗi NV một dòng LK12 (hai luồng hiện đủ)». Lọc NV (A3) giảm đau mà chưa cần gộp.

Checklist:

- [ ] Owner chốt: tách (như nay + tên NV) / gộp / màn kho riêng
- [ ] Viết §12 Admin rồi mới UI

---

### C2. Gộp hai hồ sơ Facebook trùng — BUG-016

- **Chốt:** DEFERRED 2026-09-05. **Không sửa code** đến khi chốt thiết kế. HIGH.
- **Vấn đề:** Gộp Facebook hiện có thể mất SĐT nguồn, party GD SetNull, xóa map trùng lô; TitleService Restrict → merge vỡ. Bốn cặp `buinam` cũ (BUG-013) **không** tự gộp.
- **Hướng đã ghi:** giữ Person đích (có SĐT), chuyển hết quan hệ, xóa Person nguồn rỗng — không tạo Person mới. Cần chốt: (1) SĐT nguồn trùng đích; (2) map trùng lô + GD; (3) Admin **không** gộp (BUG-017 FIXED).
- **File neo:** `docs/audit/BUGS.md` BUG-016; `docs/domains/facebook-source.md`; `docs/domains/customers.md` merge

Checklist:

- [ ] Owner ngồi chốt 3 điểm trên + ví dụ 4 cặp `buinam`
- [ ] Domain merge đầy đủ
- [ ] Một PR riêng, có backup/staging

---

### C3. Inbox Facebook sống trong CRM

- **Chốt:** `customers.md` §11 mục 27 — **chưa làm; cần bàn**. Không nhầm cột phụ chat đã lưu / menu Mở chat (tab Meta).
- **Hiện tại:** tin đã lưu + Mở Messenger / Business Suite. Scanner = `apps/extension`.
- **Cần bàn:** iframe / cửa sổ phụ / chỉ dựa extension + tin đã lưu.

Checklist:

- [ ] Owner: cần inbox nhúng hay **không làm** (đóng mục 27)

---

### C4. Extension — chat nhóm Messenger

- **Chốt:** owner 2026-09-08 — **làm sau**. Ít nhóm. Máy đang lấy số URL làm UID; nhóm thì số đó không phải UID một người → có thể tạo Person mang mã nhóm.
- **Khi làm:** không gán `customerUid` = mã nhóm; thiếu UID người thì không POST (cùng BUG-013).
- **File neo:** `apps/extension/README.md`; `docs/domains/facebook-source.md` §13.1

Checklist:

- [ ] Owner mở đợt extension → nhận diện nhóm

---

### C5. Đổi địa chỉ Dự án → Đất dân khi còn kho — BUG-057

- **Chốt:** HOÃN 2026-09-06.
- **Ai:** Admin Cài đặt → sửa địa chỉ, bỏ tick dự án khi còn `ProjectLot`.
- **Hiện tại:** chỉ chặn khi còn **ảnh** dự án, không đếm kho. Picker kho 400; `Lodat.projectLotId` cũ còn; badge số lô đổi sang đếm lô dân.

Checklist:

- [ ] Owner: sửa (chặn khi còn kho) hay vẫn hoãn

---

### C6. SEO hoãn / «không cần»

Không chặn CRM Admin. Ghi để khỏi quên nếu làm web khách:

| ID | Việc | Chốt |
|----|------|------|
| BUG-070 | Tạm dừng / sửa địa chỉ không revalidate hub `/xa/…` | HOÃN — giữ logic hiện tại |
| BUG-078 | Hai URL cùng `<title>` | HOÃN — chưa unique title |
| BUG-080 | Slug không cắt độ dài | HOÃN — live max ~88 ký tự |
| BUG-081 | Title trang chủ lặp «An Hưng Land» hai lần | Owner: **Ko cần** |

---

### C7. Bug lô / GD / URL public còn OPEN (chưa HOÃN)

Chi tiết trong [`audit/BUGS.md`](./audit/BUGS.md). Sổ ghi «OPEN thuần»: **023, 025, 026, 027, 029**. Riêng **023** (URL lô Tạm dừng vẫn mở): sau chốt listing sống mãi, có thể **đúng sản phẩm** — chưa CLOSED by design.

| ID | Admin thấy gì | Ghi chú |
|----|----------------|---------|
| BUG-023 | Khách mở slug lô đã Tạm dừng | Có thể by design (listing always-on, trừ Không bán) |
| BUG-025 | Xóa GD mở ép map về Mở bán; tạo/sửa/hoàn tất GD không đổi trạng thái rao | FIXED — đồng bộ map theo `transactions.md` §3 |
| BUG-026 | Ép `DAT_COC`/`DA_BAN` thành Tạm dừng rồi Lưu ghi đè | Data copy cũ |
| BUG-027 | Ẩn khách, `/lo-dat` vẫn hiện chủ; không API gỡ chủ/xóa lô | Owner BUG-063 hướng B: ẩn chỉ khỏi list khách |
| BUG-029 | Unique 1 luồng/NV/kho lệch Prisma/`create`; không đóng luồng rồi gắn lại | Liên quan merge / kho |

Checklist:

- [ ] Owner: từng bug SỬA / BỎ / by design (giống đợt CHOT 051–083)
- [ ] Không sửa đống này trong một PR

---

## D. Dữ liệu + cutover (không phải nút trên màn hình)

Nguồn sự thật: [`MIGRATION.md`](./MIGRATION.md). Skill: `migrate-legacy-data`. **Không đụng** `crm.anhungland.com` khi deploy web mới.

### D1. Copy còn lại trên VPS

| # | Việc | Script | Trạng thái sổ (2026-09-11) |
|---|------|--------|----------------------------|
| 10d | Lô dân + map NV → `Lodat` + `LodatCustomerMap` + ảnh | `pnpm lodats:migrate-legacy` | Todo — chạy VPS; stream PROJECT `p:{lodatId}:{empId}`; giữ kha/buinam |
| 12 | Sổ đỏ | `pnpm title-services:migrate-legacy` | Script sẵn — 1 hồ sơ `SD-2026-0001` kha |

Các bước User / khách / SĐT / FB / care / địa chỉ / kho 3608 / GD 2 hàng: sổ ghi **xong staging**. Trước cutover: chạy lại idempotent trên snapshot freeze.

Checklist:

- [ ] Preflight FK (skill migrate)
- [ ] Chạy 10d trên VPS; đối chiếu số lô kha vs buinam (không lệch NV)
- [ ] Chạy 12 sổ đỏ
- [ ] Ghi kết quả COUNT vào `MIGRATION.md`

---

### D2. Cutover CRM cũ — P5

- **Chốt:** [`DEPLOYMENT.md`](./DEPLOYMENT.md) «sau P4 — chưa làm bây giờ». [`PLAYBOOK.md`](./PLAYBOOK.md) P4 = registry + migrate; P5 = tắt dần hệ cũ.

Checklist (chỉ khi A–B + D1 đủ, owner bảo cutover):

- [ ] P4 registry (B1) xong hoặc owner chấp nhận không xóa cứng
- [ ] Freeze CRM cũ + tắt extension cũ
- [ ] Backup Postgres + snapshot R2
- [ ] Migrate lần cuối SQLite/`img/` → Postgres + R2
- [ ] Redirect `crm.anhungland.com` → `https://anhungland.com`
- [ ] Giữ `/var/www/anhungland-crm` ≥ 30 ngày rollback
- [ ] NV Load unpacked `apps/extension` trỏ API mới (đã mặc định `anhungland.com/api/v1`)

---

## E. Docs lệch (sửa khi tiện, không phải feature)

| Chỗ | Lệch |
|-----|------|
| `docs/domains/README.md` dòng Users/admin registry | ~~Ghi «P4 — CRUD NV, chưa làm»~~ — **đã sửa 2026-09-11**: CRUD NV xong; còn registry khách. |
| `docs/UI-GUIDELINES.md` §5 | ~~Gom CRUD NV với registry~~ — **đã sửa 2026-09-11**: chỉ còn registry; link checklist. |
| `docs/domains/addresses.md` status | «copy data sau» — migrate địa chỉ/kho sổ ghi xong staging. |

- [x] Sửa README domains + UI-GUIDELINES §5 (PR checklist này)
- [ ] Sửa status `addresses.md` («copy data sau» → xong staging) — PR riêng nếu đụng domain dài

---

## Thứ tự gợi ý khi mai làm

Làm **từng dòng**, tick, một PR / slice. Đủ 5 PR bug-fix mới hỏi merge tuần tự — skill `fix-audit-bug`. Feature mới: hỏi deploy khi slice ổn.

```
1. A1  Sửa bài CMS          — nếu bỏ HOÃN BUG-056
2. A2  Lọc NV trên khách
3. A4  Lọc NV trên giao dịch — API gần sẵn
4. A3  Lọc NV trên lô        — chưa gộp dòng (C1)
5. B3  Bổ sung kho đã import
6. B2  Sửa/xóa từng dòng kho
7. B1  Registry xóa cứng     — sau khi chốt cascade
8. D1  Copy 10d + sổ đỏ VPS
9. C*  Chỉ khi owner chốt
10. D2 Cutover               — cuối
```

B4 / B5: hỏi một câu rồi làm hoặc đóng «không làm».

---

## Việc Admin **không** có trên CRM mới (cố ý)

Ghi lại để mai không mở lại như bug:

1. Admin không tạo lô / GD / sổ hộ NV (BUG-047, 049, 050).
2. Admin không đổi chủ lô (BUG-020 / 028).
3. Admin không gộp khách (BUG-017).
4. Không sửa tên Facebook tay (`customers.md` mục 13).
5. Không gỡ Đăng web listing (BUG-024 CLOSED — listing sống; ẩn khách = trạng thái **Không bán**).
6. Không thu hồi mã share (BUG-036 CLOSED).
7. Không xóa cứng User — chỉ `isActive: false` (BUG-064).
8. Ẩn khách không xóa lô/GD/sổ/chat (BUG-063 hướng B).
