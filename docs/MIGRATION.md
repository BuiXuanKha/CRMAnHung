# Migration từ FacebookCustomerCRM → CRMAnHung

## Nguyên tắc

1. **Hệ cũ tiếp tục chạy** (`crm.anhungland.com`) cho đến khi crmanhung đủ feature parity + data đã kiểm chứng.
2. Migration là **one-shot có kiểm tra**, có thể chạy dry-run.
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

Script migrate user (đầu tiên): `apps/api/scripts/migrate-users-from-legacy.ts` — đọc SQLite, ghi `User` + `migrate.legacy_id_map`.  
Script full (P4): `apps/api/scripts/migrate-from-legacy.ts` (chưa viết): `img/` → R2.

Copy data: **User trước** (có `employeeId`), rồi khách → lô → giao dịch → sổ đỏ. Map ID: schema `migrate` (xem mục dưới).

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
