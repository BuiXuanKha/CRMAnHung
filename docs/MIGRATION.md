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

Script migrate sẽ nằm tại `apps/api/scripts/migrate-from-legacy.ts` (implement ở giai đoạn P4): đọc SQLite + `img/` → ghi Postgres + `PutObject` R2.

## Checklist cutover

- [ ] Feature parity P1–P3
- [ ] Dry-run migrate trên bản sao DB
- [ ] So khớp số bản ghi + spot-check nghiệp vụ + URL ảnh R2
- [ ] Backup SQLite + `img/` hệ cũ; `pg_dump` đích
- [ ] Deploy crmanhung song song (`crm-next`)
- [ ] Chuyển nginx → crmanhung
- [ ] Giữ backup hệ cũ tối thiểu 30 ngày
