# Chốt phương án — BUG-051 → BUG-083

File này để **owner đọc tối** rồi tick / ghi hướng. Agent **chưa sửa** các bug OPEN dưới đây.

Xác minh code: `main` commit `fc7037f` (sau deploy BUG-049 / BUG-050, 2026-09-06).  
Postgres staging: máy agent **không SSH được** (`deploy@103.15.51.19` từ chối publickey) → không `SELECT` đêm nay. Ví dụ lấy từ sổ migrate / domain + web công khai `anhungland.com` (curl 2026-09-06). Chỗ nào là giả định đều ghi rõ.

Cách chốt nhanh: sửa cột **Chốt** trong bảng §1 (SỬA / BỎ / HOÃN / Hướng khác). Mai nhắn một dòng kiểu «sửa các ô SỬA» hoặc «HIGH trước» là đủ — không cần ngồi hỏi từng bug.

---

## 1. Bảng chốt (đọc cái này trước)

| ID | Nặng | Còn trên code? | Đau hôm nay? | Đề xuất | Chốt (owner) |
|----|------|----------------|--------------|---------|--------------|
| **051** | MED | STILL_OPEN | List GD mới **2** hàng; Admin **không lọc NV** (lệch sổ đỏ) | SỬA lọc NV Admin; phân trang có thể làm cùng hoặc sau |  |
| **052** | MED | FIXED | Cắt 500 — data sổ đỏ rất ít | SỬA phân trang 50 + COUNT (owner 2026-09-06) |  |
| **053** | MED | FIXED | Picker địa chỉ dump 500 | SỬA: bỏ trần 500, trả hết + COUNT (2026-09-06) |  |
| **054** | MED | FIXED | Race 2 tab Lưu — chưa thấy case | SỬA: retry P2002 code + nextCode max số (2026-09-06) |  |
| **055** | MED | FIXED | Lọc «Dưới 1 tỷ» ra cả khách chưa nhập ngân sách | SỬA: khoảng chỉ khách có số (2026-09-06) |  |
| **056** | MED | STILL_OPEN | Admin không sửa được bài đã tạo | **SỬA** PATCH nội dung | HOÃN (owner 2026-09-06 — làm sau) |
| **057** | MED | STILL_OPEN | Bỏ tick dự án khi còn kho | **SỬA** chặn khi còn `ProjectLot` | HOÃN (owner 2026-09-06 — làm sau) |
| **058** | MED | FIXED | `/giao-dich/tao` không `lodatId` chỉ 200 lô; **Admin đã không tạo GD** | SỬA: picker tìm keyword (2026-09-06) |  |
| **059** | HIGH | FIXED | Đổi chủ khi GD **Đã cọc** — lệch deal vs lô. Admin đã không đổi chủ | SỬA: chặn + thông báo khi còn GD mở (2026-09-06) |  |
| **060** | HIGH | FIXED | Gỡ ảnh lô → xóa R2 dù GD đã đóng băng ảnh | SỬA: copy ảnh khi tạo GD + đếm ref khi xóa (2026-09-06) |  |
| **061** | HIGH | CLOSED (by design) | Admin gỡ ảnh dự án → gãy lô + web + GD | Owner: dùng chung; Admin xóa/đổi = live theo kho (2026-09-07) |  |
| **062** | MED | FIXED | Sửa tiêu đề lô CRM ≠ H1 web | Hướng B: hangtag lệch + sort đầu; không auto-sync (2026-09-07) |  |
| **063** | MED | CLOSED (by design) | Ẩn khách, lô/GD/sổ/chat vẫn dùng Person | Owner hướng B: chỉ khỏi list; không cascade (2026-09-07) |  |
| **064** | MED | FIXED | Xóa User → 500 vì care/tiến độ/xem file | Owner: **không xóa cứng**; chỉ vô hiệu hóa | Không xóa cứng (2026-09-07) |
| **065** | MED | CLOSED (by design) | Extension gửi UID nick; không khớp hồ sơ NV | Owner: **không** đăng ký kênh trước; kênh mới từ extension cứ vào | Không chặn ingest (2026-09-07) |
| **066** | HIGH | FIXED | GPT/sửa slug lô không bỏ dấu | Owner: **không** sửa slug tay; URL từ tiêu đề lúc tạo | Không ô slug (2026-09-07) |
| **067** | HIGH | FIXED | Lô mới chiếm URL 301 của lô cũ | **SỬA** `uniqueSlug` chừa bảng 301 | Chừa fromSlug; trùng thêm `-2` cuối URL (2026-09-07) |
| **068** | HIGH | STILL_OPEN | Hub `/xa/…` đổi theo tập lô, không 301 | Lớn — làm sau 069/070; hoặc persist hub |  |
| **069** | HIGH | STILL_OPEN | Breadcrumb lô trỏ `/xa/…` 404 | **SỬA** cùng tập lô Mở bán |  |
| **070** | HIGH | STILL_OPEN | Tạm dừng / sửa địa chỉ không làm mới hub | **SỬA** revalidate thêm `/xa/…` |  |
| **071** | MED | STILL_OPEN | Sitemap + index 5 chuyên mục **trống** (live) | **SỬA** noindex / bỏ khỏi sitemap khi 0 bài |  |
| **072** | HIGH | STILL_OPEN | API lỗi → sitemap/catalog rỗng, slug 404 giả | **SỬA** không nuốt 5xx lúc chạy |  |
| **073** | MED | STILL_OPEN | 301 tới lô đã gỡ / Tạm dừng | SỬA cùng 074 |  |
| **074** | MED | STILL_OPEN | Xóa lô còn hàng 301 | SỬA cùng 067/073 |  |
| **075** | MED | **ALREADY_FIXED** | `/og-default.png` live **200** | Đóng sổ FIXED — không sửa |  |
| **076** | MED | STILL_OPEN | Category lạ: code thiếu `canonical: null` (live đang được `not-found` cứu) | SỬA 1 dòng cho chắc |  |
| **077** | MED | STILL_OPEN | Hai thôn slug gập một hub | HOÃN — chưa thấy case live |  |
| **078** | MED | STILL_OPEN | Hai URL cùng `<title>` | HOÃN — 25 lô Đăng web **không** trùng title |  |
| **079** | LOW | STILL_OPEN | Mock Unsplash đè gallery nếu trùng slug demo | **SỬA** gỡ mock (rẻ) |  |
| **080** | LOW | STILL_OPEN | Slug không cắt độ dài | HOÃN — live dài nhất **88** ký tự |  |
| **081** | MED | STILL_OPEN | Title trang chủ lặp «An Hưng Land» **hai lần** (live) | **SỬA** |  |
| **082** | MED | STILL_OPEN (một phần) | Guest `/dashbroad` → 307 login, `next` vẫn gõ sai | SỬA nốt: 308 về `/dashboard` trước login |  |
| **083** | MED | **ALREADY_FIXED** | `kha` + `/quan-tri/*` đã redirect | Không sửa lại |  |

**Gợi ý thứ tự nếu bảo «sửa các ô SỬA»:**  
1) (059/060 FIXED; 061 by design)  
2) 066 · 067 · 069 · 072 · 070 (SEO khách)  
3) 055 · 081 · 079 · 071 · 082 (nhanh, thấy ngay)  
4) 051 · 053 · 054 · 064 · 076 · 073+074  
5) Hoãn: **056**, **057** (owner làm sau), 065, 068, 077, 078, 080.


---

## 2. Việc đã xong — không làm lại

### BUG-075 — thiếu `/og-default.png`

**Kết luận:** ALREADY_FIXED. File có trong `apps/web/public/og-default.png`. Live `https://anhungland.com/og-default.png` → **200**, PNG 3201 bytes. Audit ghi Glob = 0 là sót (file nhị phân).

**Owner:** tick đóng sổ `FIXED` trên `BUGS.md` khi duyệt — không cần PR code.

### BUG-083 — `kha` mở stub Quản trị khách

**Kết luận:** ALREADY_FIXED (đã ghi sổ 2026-09-04). Middleware: STAFF + `/quan-tri/*` → `/khach-hang` trước khi render stub.

**Check:** login **kha** → dán `/quan-tri/khach-hang` → về danh sách khách.

---

## 3. Chi tiết từng bug còn mở

Mỗi mục: vai trò / bấm gì / ví dụ / xấu / đề xuất / khi xong. **Không** sửa cho đến khi owner chốt.

### BUG-051 — List giao dịch load hết; Admin không lọc NV

**Còn.** API `GET /transactions` `findMany` không trang; `total` = số hàng trả về. UI `/giao-dich` không gửi `createdByEmployeeId`. Sổ đỏ **có** dropdown NV.

**Tôi vào vai Admin.** Vào `/giao-dich`. Thấy mọi GD của mọi NV, thẻ doanh thu cộng hết. Không có ô chọn `kha` / `buinam` như `/dich-vu-so-do`.

**Tôi vào vai kha.** Cùng URL — API chỉ trả GD `kha` tạo. List trống cho đến khi `kha` tự tạo (sau BUG-049 Admin không tạo hộ).

**Ví dụ (sổ migrate, 2026-08-25):** 2 GD copy xong, cả hai **buinam**, `GD-2026-0002` / `GD-2026-0003`, `HOAN_TAT`. `kha` list trống. Với 2 hàng, timeout/OOM **chưa** xảy ra. Lệch UX Admin vs sổ đỏ **đã** xảy ra.

**Vì sao xấu:** Admin không xem từng NV; sau này copy/tăng GD thì một request nặng + số liệu «tổng» không phải COUNT.

**Đề xuất:** (1) Admin: dropdown NV giống sổ đỏ. (2) Phân trang / infinite + `count()` — có thể cùng PR hoặc PR sau vì data còn nhỏ.

**Khi xong:** Admin chọn `buinam` → chỉ 2 GD đó; chọn `kha` → trống (đến khi kha tạo). `kha` không thấy dropdown.

---

### BUG-052 — List sổ đỏ cắt 500, khai hết

**Còn.** `take: 500`, `total: items.length`, không `count()`.

**Vai:** Admin / kha → `/dich-vu-so-do`.

**Ví dụ:** SQLite cũ **1** hồ sơ `SD-2026-0001` (**kha**, PersonId 1561, đang làm). Docs còn ghi bước copy «chưa chạy staging» — không SSH nên không khẳng định đã có trên Postgres. Dù 0 hay 1 hàng, **cắt 500 chưa đau**.

**Đề xuất mặc định: HOÃN.** Nếu sửa sớm: `total` = COUNT thật + dòng «đang hiện tối đa 500» — đừng infinite ngay.

---

### BUG-053 — Sổ/picker địa chỉ cắt 500

**FIXED (2026-09-06).** Bỏ `take: 500`; list trả hết theo filter + `total` = COUNT. `AddressesService.list` `take: 500`, `total` = length. Picker tạo lô dùng cùng API.

**Tôi vào vai Admin.** Cài đặt → Quản lý địa chỉ. Đếm tab Tất cả/Dân/Dự án trên payload 500 dòng mới nhất (`updatedAt`).

**Tôi vào vai kha.** Tạo lô → chọn địa chỉ. Không ô tìm server: xã/dự án cũ ngoài 500 dòng không có trong list (trừ khi gõ keyword khớp — tùy API còn nhận keyword).

**Ví dụ:** Không đếm được Postgres đêm nay. Nếu sổ thật < 500 thì **chưa** mất địa chỉ; bug vẫn là «total giả» + sẽ gãy khi vượt.

**Đề xuất: SỬA** tìm/phân trang phía server cho picker + sổ (không tin dump 500).

---

### BUG-054 — Mã `GD-` / `SD-` đọc max rồi +1, không khóa

**FIXED (2026-09-06).** Retry tới 3 lần khi trùng unique `code`; `nextCode` lấy max số thật. Hai `nextCode` giống nhau. Trùng `code` unique → 500, không retry. (Admin không còn POST tạo GD/sổ — race chủ yếu **hai tab NV** hoặc hai NV cùng giây.)

**Ví dụ giả định (không bịa là đã query):** `kha` mở hai tab Lưu sổ đỏ cùng lúc → một bản 500. DB hiện rất ít mã; **chưa** có >9999/năm.

**Đề xuất: SỬA nhỏ** — trùng unique `code` thì lấy mã mới rồi tạo lại (1–2 lần). Đủ cho 2–3 NV.

---

### BUG-055 — Lọc tài chính «Dưới 1 tỷ» vẫn ra khách chưa nhập ngân sách

**FIXED (2026-09-06).** Khoảng `lt_1b`/`1b_2b`/`gt_2b` bắt buộc min+max; null không = vô hạn. `none`/`has` giữ nguyên. API + FE client filter cùng rule.

**Check:** kha `/khach-hang` → Tài chính → **Dưới 1 tỷ** — không còn dòng «Chưa xác định»; lọc «Chưa có» vẫn ra khách null.

---

### BUG-056 — Không sửa nội dung bài; soạn lại = bài mới (`-2`)

**Chốt: HOÃN** (owner 2026-09-06 — làm sau). Vẫn OPEN trên code: chỉ `POST` tạo + `PATCH` status; soạn lại → slug `-2`.

**Tôi vào vai Admin.** `/dashboard/bai-viet` → Soạn → xuất bản. Sai chính tả → soạn lại cùng tiêu đề → URL thứ hai, **cả hai** có thể published.

**Live (2026-09-06):** `/du-an` có bài; `/tin-tuc` `/kien-thuc` `/kinh-nghiem` `/lien-he` `/chinh-sach` empty «Hiện chưa có bài». Bug đau khi Admin soạn/sửa, không phụ thuộc list trống.

**Đề xuất khi làm:** `PATCH` title/body/cover/slug; dialog sửa bài đang chọn, không `POST` mới.

---

### BUG-057 — Đổi dự án → đất dân không kiểm kho `ProjectLot`

**Chốt: HOÃN** (owner 2026-09-06 — làm sau). Vẫn OPEN trên code: `PROJECT` → `REGULAR` chỉ chặn khi còn **ảnh**, không `count` kho.

**Tôi vào vai Admin.** Cài đặt → địa chỉ dự án còn lô kho (sau import BUG-048) → bỏ tick dự án → Lưu **được**.

**Tôi vào vai kha.** Tạo lô dự án đó → picker kho 400 «không phải dự án». Lô `projectLotId` cũ vẫn sống.

**Đề xuất khi làm:** còn `ProjectLot` thì không đổi kind (cùng kiểu chặn còn ảnh).

---

### BUG-058 — Form `/giao-dich/tao` (không gắn lô) chỉ 200 lô

**FIXED (2026-09-06).** Form tạo GD tay: `LodatSearchPicker` — gõ tiêu đề/địa chỉ → API `keyword` (debounce), tối đa 30 gợi ý. Không dump 200. Tạo từ chi tiết lô (`?lodatId=`) vẫn khóa.

**Check:** NV `kha` vào `/giao-dich/tao` → gõ tên lô cũ → chọn → Lưu. Admin vẫn không tạo GD.


### BUG-059 — Đổi chủ khi GD đang mở

**FIXED (2026-09-06).** Chặn đổi chủ khi lô còn GD mở (`DA_COC` / `DA_CONG_CHUNG`). Thông báo: «Lô này đang trong trạng thái giao dịch nên không đổi được chủ.» API `changeOwner` + UI trước khi mở modal.

**Check:** NV `kha` lô Đã cọc → Đổi chủ → hiện thông báo, không đổi được.


### BUG-060 — Xóa ảnh lô xóa R2 dù snapshot GD còn trỏ

**FIXED (2026-09-06).** Owner: tạo GD **copy** file ảnh sang key riêng (`transactions/snapshots/…`). Xóa gallery lô không gãy ảnh GD mới. `deleteImage` lô đếm đủ ref (gồm snapshot) để GD migrate/cũ còn share key vẫn an toàn.

**Check:** tạo GD → gỡ ảnh trên lô → chi tiết GD vẫn hiện ảnh.


### BUG-061 — Xóa ảnh địa chỉ dự án luôn xóa R2

**CLOSED (by design, 2026-09-07).** Owner: giữ **dùng chung** ảnh kho. Admin gỡ/đổi ảnh dự án = chủ đích; lô CRM + bài Đăng web đọc live nên theo ảnh mới. Không copy nhân bản theo NV. Snapshot GD đã tạo không đổi theo kho (chấp nhận).


### BUG-062 — Sửa lô CRM không đẩy title/địa chỉ Đăng web

**FIXED (2026-09-07).** Owner chốt **hướng B**: overlay Đăng web độc lập; không ghi đè khi sửa lô CRM.

`/dashboard/lo-dat`: so **tiêu đề + địa chỉ** listing vs lô CRM (khi đã có hàng listing). Lô lệch xếp đầu; icon đỏ → dialog Đăng web vs CRM. NV sửa web tay trên Soạn đăng web.

**Check:** sửa title lô đã Đăng web trên `/lo-dat` → vào Đăng web thấy icon + dòng lệch; H1 khách vẫn bản overlay đến khi Soạn lại.

---

### BUG-063 — Ẩn khách không cắt lô / GD / sổ / chat

**CLOSED (by design, 2026-09-07).** Owner chốt **hướng B**: ẩn khách chỉ khỏi `/khach-hang` (tìm `@`/`@@` rồi Khôi phục). Lô vẫn hiện chủ; GD / sổ đỏ / chat giữ Person. Vẫn không **tạo mới** lô/sổ/chăm sóc trên khách ẩn. Không cascade «đã xóa». BUG-027 giữ OPEN.

---

### BUG-064 — Xóa User thiếu đếm FK → 500

**FIXED (2026-09-07).** Owner chốt: Admin **không xóa cứng** nhân viên. Chỉ **xóa mềm** (`isActive: false`) để giữ khách, lô, giao dịch, sổ đỏ, chăm sóc.

**Tôi vào vai Admin.** `/quan-tri/nguoi-dung` không còn cột **Xoá**. Khóa NV: **Sửa** → bỏ tick **Tài khoản đang hoạt động**. `DELETE /users/:id` (client cũ) luôn 400: «Không xóa cứng nhân viên…».

Admin không tạo chăm sóc — kịch bản «Admin ghi care rồi xóa NV» không thuộc phạm vi sửa care create.

---

### BUG-065 — Extension ghi UID Facebook NV từ máy, không từ hồ sơ

**CLOSED (by design, 2026-09-07).** Owner: **không** đăng ký kênh liên hệ trước. Extension gửi nick/page mới → lưu khách + tin + UID **bình thường**. Không bắt nick có sẵn trong `EmployeeFacebookProfile`. Không chặn ingest. Khách vẫn thuộc NV đang login CRM.

---

### BUG-066 — Slug lô GPT/editor không `toPublicSlug`

**FIXED (2026-09-07).** Owner: tin GPT; **không** cho tự sửa slug.

**Tôi vào vai kha.** `/dashboard/lo-dat` → Soạn bài đăng: hết ô slug, chỉ xem URL. Lô mới: đường dẫn từ tiêu đề (bỏ dấu). Lô đã có: URL giữ nguyên khi sửa tiêu đề. GPT điền title/mô tả, không ghi slug thô.

---

### BUG-067 — Listing mới chiếm URL đang 301

**FIXED (2026-09-07).** Khi hệ thống cấp đường dẫn cho lô mới, nó cũng tránh các URL cũ đang chuyển hướng 301. Nếu trùng, lô mới nhận cùng gốc rồi thêm chữ `-2` vào cuối (ví dụ `lo-dat-nam-sach-2`), để Google mở link cũ vẫn ra lô A.

**Tôi vào vai nhân viên `kha`.** Tôi Đăng web một lô có tiêu đề trùng đường dẫn cũ của lô khác. Trang khách của URL cũ vẫn nhảy về lô cũ, không hiện lô mới.

---

### BUG-068 — Hub `/xa/…` tính lúc đọc, không 301

**Còn.** Slug xã/thôn = hàm catalog sống. Không bảng hub. Live sitemap có **29** URL `/xa/`.

**Tôi vào vai Admin.** Đổi tên xã / ẩn ward / còn 1 huyện trùng tên → URL hub đổi, Google 404.

**Đề xuất:** Lớn. Làm **sau 069+070** (vá link/cache). Persist hub + 301 = PR riêng khi owner muốn SEO ổn lâu.

---

### BUG-069 — Breadcrumb lô trỏ hub 404

**Còn.** Chi tiết lô build hub từ **mọi** listing published (kể Tạm dừng). Catalog/sitemap chỉ **Mở bán**.

**Guest:** trang lô → «Xem tất cả» `/xa/{slug-chi-tiet}` có thể 404.

**Đề xuất: SỬA** — một hàm, cùng tập Mở bán như catalog.

---

### BUG-070 — Revalidate không gồm hub; Tạm dừng / sửa địa chỉ không làm mới

**Còn.** Revalidate: chi tiết + catalog + sitemap, **không** `/xa/…`. Công tắc Mở bán / sửa địa chỉ **không** gọi revalidate.

**Tôi vào vai kha.** Tạm dừng lô đã Đăng web → hub/catalog HTML cũ đến khi có publish khác.

**Đề xuất: SỬA** — thêm path hub; gọi revalidate khi đổi Mở bán và khi sửa địa chỉ đang có listing.

---

### BUG-071 — Sitemap luôn 6 chuyên mục bài, kể cả trống

**Còn.** Live 2026-09-06:

| URL | Trang |
|-----|--------|
| `/du-an` | có bài |
| `/tin-tuc` `/kien-thuc` `/kinh-nghiem` `/lien-he` `/chinh-sach` | empty «Hiện chưa có bài» + title indexable |

**Đề xuất: SỬA** — 0 bài → không đưa sitemap + `noindex` (trừ khi owner muốn giữ «Chính sách» luôn index).

---

### BUG-072 — Lỗi API guest bị nuốt → sitemap rỗng / 404 giả

**Còn.** `catch { return [] }` / lỗi ≠ 404 → `null` → `notFound()`. Sitemap `revalidate = false` có thể **đóng băng** catalog rỗng.

**Guest / Googlebot** lúc Nest timeout: mất URL lô/hub; slug đang sống thành 404.

**Live neo:** catalog API hiện **25** lô, sitemap **65** loc — đang khỏe. Bug là khi API **gãy**.

**Đề xuất: SỬA** — chỉ nuốt lỗi lúc `next build`; runtime 5xx **không** cache rỗng / không biến thành 404.

---

### BUG-073 + BUG-074 — 301 không kiểm đích; xóa lô không xóa redirect

**Còn.** 301 luôn theo `toSlug`. Xóa `Lodat` cascade listing, **không** xóa `PublicLotSlugRedirect`.

**Đề xuất: SỬA chung** — xóa/gỡ Đăng: xóa hoặc ngắt 301; 301 chỉ khi đích còn published (+ ideally Mở bán). Khớp 067.

---

### BUG-076 — Category không hợp lệ thiếu gỡ canonical

**Còn trên code** (nhánh metadata không `canonical: null`). Live `/khong-phai-chuyen-muc` hiện đi `not-found` (đang cứu). Vẫn nên 1 dòng cho đồng bộ các 404 public.

**Đề xuất: SỬA** nhỏ.

---

### BUG-077 — Hai địa chỉ gập một hub slug

**Còn.** «KĐT ABC» vs «KDT ABC» → cùng `placeSlug`.

**Live:** chưa chứng minh hai thôn đang đụng. **HOÃN** đến khi có case, hoặc unique `-2` khi làm 068.

---

### BUG-078 — Không unique `title` / `seoTitle`

**Còn trên schema.** Live **25** lô Đăng web: **0** cặp trùng `title`.

**Đề xuất: HOÃN.** Cảnh báo trùng trên form Đăng web nếu sửa 056/editor — đừng unique DB cứng.

---

### BUG-079 — Mock demo đè gallery listing thật

**Còn.** `getProductBySlug` (Unsplash) nếu slug trùng demo (`nen-tho-cu-long-thanh-mat-tien`, …).

**Live:** 25 slug **không** trùng bộ demo → **chưa** gãy trang thật. Rủi ro khi GPT/NV đặt đúng slug mẫu.

**Đề xuất: SỬA** — gỡ mock khỏi trang production (rẻ, an toàn).

---

### BUG-080 — Slug lô generate không cắt độ dài

**Còn.** `toListingPublicSlug` `maxLen = 0`.

**Live:** slug dài nhất **88** ký tự (`lo-38-quan-tao-…-hai-duong`). Chưa «hàng trăm».

**Đề xuất: HOÃN** hoặc cap 120 khi làm 066.

---

### BUG-081 — Title trang chủ lặp thương hiệu

**Còn. Live xác nhận 2026-09-06:**

`<title>An Hưng Land — Văn phòng giao dịch bất động sản | An Hưng Land</title>`

**Guest:** mở `https://anhungland.com/` — tab/SERP lặp tên.

**Đề xuất: SỬA** — title trang chủ `absolute` (một lần brand).

**Khi xong:** View Source `/` không còn `| An Hưng Land` lần hai.

---

### BUG-082 — `/dashbroad` không về `/dashboard` trên response đầu

**Còn một phần.** Code trang `redirect('/dashboard')`. Middleware: **đã login** thì Admin → `/dashboard`, kha → `/dashboard/lo-dat`. **Guest live:** `GET /dashbroad` → **307** `Location: /login?next=%2Fdashbroad` (không còn 200 prerender như audit 2026-09-03). `next` vẫn **gõ sai** → sau login có thể vòng alias.

**Đề xuất: SỬA nốt** — 308 `/dashbroad` → `/dashboard` **trước** khi gắn `next=` login.

**Khi xong:** guest `/dashbroad` → login `next=/dashboard` (hoặc 308 thẳng `/dashboard` rồi mới login).

---

## 4. Hai hướng **bắt buộc** owner chọn (đừng để trống)

| Bug | A | B |
|-----|---|---|
| **062** Đăng web vs sửa lô | Sửa lô → đẩy title/location lên web | **Đã chốt B** — hangtag lệch, không auto-sync |
| **063** Ẩn khách | Ẩn = cắt lô/GD/sổ/chat | **Đã chốt B** — chỉ biến khỏi `/khach-hang` |

059 nếu không thích chặn: viết «làm B — chuyển GD» (không mặc định).

---

## 5. Mai làm gì

1. Tick bảng §1 (hoặc nhắn «sửa đúng cột Đề xuất»).  
2. 062 / 063 đã chốt B.  
3. Agent sửa **từng bug một PR**, batch 5 rồi hỏi deploy — trừ khi bạn bảo deploy ngay.

Không đụng `crm.anhungland.com`.
