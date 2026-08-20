# Migration từ FacebookCustomerCRM → CRMAnHung

## Nguyên tắc

1. **Hệ cũ tiếp tục chạy** (`crm.anhungland.com`) cho đến khi crmanhung đủ feature parity + data đã kiểm chứng.
2. Copy **từng bảng**. Idempotent: id cũ đã có trong `migrate.legacy_id_map` thì cập nhật, không tạo trùng. Freeze CRM cũ trước khi copy khách.
3. Giữ **ID ổn định** khi có thể (map `tblPerson.id` → `Customer.id`) để liên kết nghiệp vụ không gãy.
4. Đích CRMAnHung: **PostgreSQL** + file trên **Cloudflare R2** (không copy SQLite/`img/` sang disk VPS mới).

## Nguồn dữ liệu cũ

- SQLite: `database/facebook_customer_crm.db` (không nằm trong git).
- Ảnh upload: thư mục `img/` trên server API cũ.

## Đích

| Loại | Đích |
|------|------|
| Bảng / quan hệ | PostgreSQL (`DATABASE_URL`) |
| File ảnh / đính kèm | R2 object key (upload từ `img/` → bucket) |

## Mapping bảng (tóm tắt)

| Cũ | Mới (Prisma) |
|----|----------------|
| `tblUsers` | `User` |
| `tblPerson` | `Customer` |
| `tblPersonFacebook` | `CustomerFacebook` |
| `tblPersonPhone` | `CustomerPhone` |
| `tblPersonMessenger` | `CustomerMessengerMessage` |
| `tblPersonMessengerImages` | `CustomerMessengerImage` (`objectKey`) |
| `tblPersonCareHistory` | `CustomerCareNote` |
| `tblEmployeeFacebookProfiles` | `EmployeeFacebookProfile` |
| `tblEmployeeHotline` | `EmployeeHotline` |
| `tblLodats` | `Lodat` |
| `tblLodatPersonMap` | `LodatCustomerMap` |
| `tblLodatImages` / temp | `LodatImage` / `LodatTempImage` |
| `tblAddresses` + admin units | `Address`, `Province`, `District`, `Ward` |
| `tblTransaction*` | `Transaction*` |
| `tblTitleService*` | `TitleService*` |
| `tblImageRotation` | `ImageRotation` |

Cột path ảnh cũ → field **`objectKey`** (key trong R2), không phải path local.

Mỗi bước **một PR**. Bảng **được trỏ tới** (User, hotline nguồn) copy **trước**. Bảng **trỏ sang khách** (SĐT, FB, chăm sóc…) copy **sau** khi có map `customer`. Script **chỉ đọc** SQLite. Idempotent.

Thứ tự đúng: **User → hotline nguồn → khách cơ bản → SĐT / Facebook / chăm sóc / …**

Khách đã copy trước hotline (slice 2); slice này copy hotline rồi **gắn lại** `sourceHotlineId` (22 khách lúc freeze).

### Todo copy

| # | Việc | Map entity | Script | Trạng thái |
|---|------|------------|--------|------------|
| 1 | `tblUsers` → `User` | `user` | `pnpm users:migrate-legacy` | Xong |
| 2 | `tblEmployeeHotline` → `EmployeeHotline` + gắn `Customer.sourceHotlineId` | `employee_hotline` | `pnpm hotlines:migrate-legacy` | Xong staging (3 hotline, 22 khách có nguồn) |
| 3 | `tblPerson` cơ bản → `Customer` | `customer` | `pnpm customers:migrate-legacy` | Xong staging (1401/1401). Nguồn gắn ở bước 2 |
| 4 | `tblPersonPhone` → `CustomerPhone` | `customer_phone` | — | Todo — cần map `customer` |
| 5 | `tblPersonFacebook` metadata → `CustomerFacebook` | `customer_facebook` | — | Todo — cần map `customer`. Chưa file avatar |
| 6 | `tblPersonCareHistory` → `CustomerCareNote` | `customer_care` | — | Todo — cần map `customer` + `user` |
| 7 | `tblEmployeeFacebookProfiles` → `EmployeeFacebookProfile` | `employee_facebook_profile` | — | Todo — cần map `user` |
| 8 | Tin nhắn + ảnh chat + avatar → R2 | — | — | Todo sau |
| 9 | Lô đất + `tblLodatPersonMap` | `lodat` | — | Todo — cần map `customer` |
| 10 | Giao dịch | `transaction` | — | Todo |
| 11 | Sổ đỏ | `title_service` | — | Todo |

Copy **cả** hotline đã tắt (`isActive = false`) để khách không mất nguồn. Profile FB NV **không** chặn `sourceHotlineId` — để bước 7.

Freeze CRM cũ + tắt extension trước khi copy khách.

## Bảng map ID (không phải bảng nghiệp vụ)

**Không** tạo bảng map trên SQLite CRM cũ. **Không** trộn vào schema `public` cùng `User` / `Customer`.

Toàn bộ nhật ký copy ID để trong Postgres **schema `migrate`** (ví dụ `migrate.legacy_id_map`: entity, old_id, new_id, copied_at).

Cách nhận ra 3–6 tháng sau: **mọi thứ trong schema `migrate` = bảng nháp copy**. App CRM không đọc schema này hàng ngày.

### Khi nào xoá

1. Bản mới chạy ổn (gợi ý **≥ 3 tháng** sau cutover).
2. Không còn tra «ID cũ sang ID mới».
3. Backup hệ cũ vẫn còn (tối thiểu 30 ngày; thực tế giữ đến lúc chắc).

Trước khi xoá: `pg_dump` schema `migrate` ra file (cất cùng backup). Rồi:

```sql
DROP SCHEMA migrate CASCADE;
```

Chưa dump thì **không** DROP.

## Checklist cutover

- [ ] Feature parity P1–P3
- [ ] Dry-run migrate trên bản sao DB
- [ ] So khớp số bản ghi + spot-check nghiệp vụ + URL ảnh R2
- [ ] Backup SQLite + `img/` hệ cũ; `pg_dump` đích
- [ ] Deploy crmanhung trên `anhungland.com` (CRM cũ giữ `crm`)
- [ ] Chuyển nginx → crmanhung
- [ ] Giữ backup hệ cũ tối thiểu 30 ngày
- [ ] Schema `migrate` (bảng map ID) — giữ ≥ 3 tháng sau cutover; dump rồi mới `DROP SCHEMA migrate CASCADE` (xem mục trên)
