# Migration từ FacebookCustomerCRM → CRMAnHung

## Nguyên tắc

1. **Hệ cũ tiếp tục chạy** (`crm.anhungland.com`) cho đến khi crmanhung đủ feature parity + data đã kiểm chứng.
2. Migration là **one-shot có kiểm tra**, có thể chạy dry-run.
3. Giữ **ID ổn định** khi có thể (map `tblPerson.id` → `Customer.id`) để URL / bookmark / liên kết ảnh không gãy nếu reuse storage.

## Nguồn dữ liệu cũ

- SQLite: `database/facebook_customer_crm.db` (không nằm trong git).
- Ảnh upload: thư mục `img/` trên server API cũ.

## Mapping bảng (tóm tắt)

| Cũ | Mới (Prisma) |
|----|----------------|
| `tblUsers` | `User` |
| `tblPerson` | `Customer` |
| `tblPersonFacebook` | `CustomerFacebook` |
| `tblPersonPhone` | `CustomerPhone` |
| `tblPersonMessenger` | `CustomerMessengerMessage` |
| `tblPersonMessengerImages` | `CustomerMessengerImage` |
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

Script migrate sẽ nằm tại `apps/api/scripts/migrate-from-legacy.ts` (implement ở giai đoạn P4).

## Checklist cutover

- [ ] Feature parity P1–P3
- [ ] Dry-run migrate trên bản sao DB
- [ ] So khớp số bản ghi + spot-check nghiệp vụ
- [ ] Backup DB + `img/`
- [ ] Deploy crmanhung song song (subdomain hoặc path)
- [ ] Chuyển nginx → crmanhung
- [ ] Giữ backup hệ cũ tối thiểu 30 ngày
