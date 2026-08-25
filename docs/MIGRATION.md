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
| `tblLodats` (Address PROJECT) | `ProjectLot` (kho) |
| `tblLodats` (Address REGULAR) + maps | `Lodat` + `LodatCustomerMap` |
| `tblLodatPersonMap` trên lô PROJECT | Mỗi map → `Lodat` (trỏ `projectLotId`) + `LodatCustomerMap` |
| `tblLodatImages` (chỉ lô dân) | `LodatImage` (`objectKey`) |
| `tblAddresses` + admin units | `Address`, `Province`, `District`, `Ward` |
| `tblTransaction` | `Transaction` (`code`, `lodatId` + `lodatCustomerMapId`, BigInt tiền) |
| `tblTransactionParty` | `TransactionParty` (`customerId`, `freeTextName`) |
| `tblTransactionSnapshot` (+ ảnh) | `TransactionSnapshot` + `TransactionSnapshotImage.objectKey` |
| `tblTransactionAttachment` | `TransactionAttachment.objectKey` (`kind`) |
| `tblTitleService*` | `TitleService*` |
| `tblImageRotation` | `ImageRotation` |

Cột path ảnh cũ → field **`objectKey`** (key trong R2), không phải path local.

Mỗi bước **một PR**. Script **chỉ đọc** SQLite. Idempotent.

**Agent:** khi viết/chạy copy → skill [`.cursor/skills/migrate-legacy-data`](../.cursor/skills/migrate-legacy-data/SKILL.md) (preflight FK, luồng NV, reshape lô).

### Khóa — cái nào bắt buộc trước?

| Cột trên khách | Loại khóa | Bắt buộc lúc tạo khách? |
|----------------|-----------|-------------------------|
| `id` | **PK** của khách | Tự sinh |
| `employeeId` | **FK** → `User.id` | **Có** — chưa có User thì không insert được |
| `sourceHotlineId` | **FK** → `EmployeeHotline.id`, **cho phép NULL** | **Không** — để trống rồi gắn sau được |

`sourceHotlineId` **không phải PK**. Nó chỉ trỏ sang PK của bảng hotline. Postgres chặn khi ghi một id hotline **chưa tồn tại**; ghi `NULL` thì không sao.

Vì vậy: tạo bảng hotline **sau** khách cũng được (đúng như đã làm: 1401 khách → 3 hotline → gắn 22 nguồn). Làm hotline trước chỉ tiện hơn nếu muốn ghi nguồn ngay lúc insert khách.

Bảng **trỏ sang khách** (SĐT, Facebook, chăm sóc) thì **phải sau** map `customer` — `customerId` của chúng là FK NOT NULL.

### Todo copy

| # | Việc | Map entity | Script | Trạng thái |
|---|------|------------|--------|------------|
| 1 | `tblUsers` → `User` | `user` | `pnpm users:migrate-legacy` | Xong |
| 2 | `tblEmployeeHotline` → `EmployeeHotline` + gắn `Customer.sourceHotlineId` | `employee_hotline` | `pnpm hotlines:migrate-legacy` | Xong staging (3 hotline, 22 khách có nguồn) |
| 3 | `tblPerson` cơ bản → `Customer` | `customer` | `pnpm customers:migrate-legacy` | Xong staging (1401/1401). Nguồn gắn ở bước 2 |
| 4 | `tblPersonPhone` → `CustomerPhone` | `customer_phone` | `pnpm phones:migrate-legacy` | Xong staging (152/152 số, 152 khách) |
| 5 | `tblPersonFacebook` metadata → `CustomerFacebook` (UID NV, tên nick, thread; chưa file avatar / tin nhắn) | `customer_facebook` | `pnpm facebook-profiles:migrate-legacy` | Xong staging (cùng bước 7) |
| 6 | `tblPersonCareHistory` → `CustomerCareNote` (`needSummary` + `note`) | `customer_care` | `pnpm care:migrate-legacy` | Xong staging (266/266 dòng, 237 khách) |
| 7 | `tblEmployeeFacebookProfiles` → `EmployeeFacebookProfile` | `employee_facebook_profile` | `pnpm facebook-profiles:migrate-legacy` | Xong staging (cùng bước 5) |
| 8 | Avatar khách `/img/avatars` → R2 public (`avatarObjectKey`) | — | `pnpm avatars:migrate-legacy-r2` | Xong staging (1376 file, ~5 MB) |
| 9 | Tin nhắn + ảnh chat `imgsmessenger` → R2 public | `customer_messenger`, `customer_messenger_image` | `pnpm chat:migrate-legacy` | Xong staging (20253 tin / 2448 ảnh, ~418 MB) |
| 10a | Tỉnh / Huyện / Xã `tblAddr*` | `province`, `district`, `ward` | `pnpm addresses:migrate-legacy` | Xong staging (1 tỉnh, 1 huyện, 23 xã) |
| 10b | `tblAddresses` + ảnh dự án R2 | `address`, `address_image` | `pnpm addresses:migrate-legacy` | Xong staging (110 địa chỉ, 9 ảnh) |
| 10c | Lô PROJECT → `ProjectLot` (kho) | `project_lot` | `pnpm project-lots:migrate-legacy` | Xong staging (3608/3608) |
| 10d | Lô dân + map NV → `Lodat` + `LodatCustomerMap`; ảnh lô dân R2 | `lodat`, `lodat_customer_map`, `lodat_image` | `pnpm lodats:migrate-legacy` | Todo — chạy VPS; PROJECT stream `p:{lodatId}:{empId}`; giữ kha/buinam; `SKIP_LODAT_IMAGES=1` nếu chỉ text |
| 11 | Giao dịch | `transaction` (+ party/snapshot/ảnh/đính kèm) | `pnpm transactions:migrate-legacy` | Xong staging (2/2 GD OWN+HOAN_TAT, buinam, 2 snapshot, 9 ảnh, 0 đính kèm) |
| 12 | Sổ đỏ | `title_service` | — | Todo |

Copy **cả** hotline đã tắt (`isActive = false`) để khách không mất nguồn. Profile FB NV copy cùng metadata `tblPersonFacebook` (UID NV) để cột Kênh liên hệ hiện tên page/nick.

Freeze CRM cũ + tắt extension trước khi copy khách.

### Bước 11 — giao dịch (schema đã chốt)

Live SQLite (2026-08-25): **2** GD, cả `OWN` + `HOAN_TAT`, tạo bởi **buinam**, mã `GD-2026-0002` / `GD-2026-0003`. Attachment = 0. Snapshot PK = `TransactionId` (không cột `ID`); tiêu đề = `LodatTitle`; địa chỉ = ghép `AddressDetail` + xã/huyện/tỉnh. Sau hoàn tất, map vẫn **active + TAM_DUNG** (không `DA_BAN`).

**Đã copy staging** (2026-08-25): Transaction=2, map `transaction`=2, cả hai `createdBy=buinam`. Snapshot 2, ảnh snapshot 9, đính kèm 0. Map lô sẵn có (`lodat_customer_map`=190). CRM cũ không bị ghi.

| Cột cũ | Cột mới |
|--------|---------|
| `Code` | `code` (giữ nguyên) |
| `LodatPersonMapId` | `lodatCustomerMapId` ← map entity `lodat_customer_map` |
| `LodatId` | **không** map thẳng kho PROJECT. Lấy `LodatCustomerMap.lodatId` (luồng NV; PROJECT = `p:{lodatId}:{empId}`) |
| `TransactionType` | `type` |
| `Status` | `status` |
| `NotaryAppointmentAtMs` | `notaryAppointmentAt` |
| `SalePriceVnd` / `TaxPriceVnd` / `CommissionVnd` | BigInt cùng tên camelCase |
| `Note` / `CancelReason` | `note` / `cancelReason` |
| `CreatedByEmployeeId` | `createdByEmployeeId` ← map `user` |
| `CreatedAtMs` / `UpdatedAtMs` / `CompletedAtMs` | `createdAt` / `updatedAt` / `completedAt` |
| Party `PersonId` / `FreeTextName` / `Role` / `SortOrder` | `customerId` / `freeTextName` (bắt buộc; copy tên nếu trống) / `role` / `sortOrder` |
| Snapshot `LodatTitle` / địa chỉ tách cột / `SnapshotAtMs` | `title` / `addressText` (ghép) / `createdAt` |
| Snapshot ảnh / đính kèm `StoredPath` | R2 `objectKey` (giống ảnh lô) |

Cần bước 10d xong (map `lodat` + `lodat_customer_map` + `user` + `customer`). Unique 1 GD mở / lô: dữ liệu live hiện không có GD mở.

```bash
cd /var/www/crmanhung/repo/apps/api
LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
  pnpm transactions:migrate-legacy
```

`SKIP_TX_FILES=1` nếu chỉ copy text (bỏ R2). Idempotent qua `migrate.legacy_id_map` entity `transaction`.

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
