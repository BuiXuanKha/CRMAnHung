---
name: migrate-legacy-data
description: Copy data from FacebookCustomerCRM SQLite (+ img/) into CRMAnHung Postgres + R2 with idempotent scripts and FK checks. Use when migrating/copying legacy DB, chạy migrate trên VPS, chuyển khách/địa chỉ/lô/ảnh từ CRM cũ, or avoiding data loss/mismatch.
---

# Migrate legacy data — CRMAnHung

Skill này **bắt buộc** khi copy dữ liệu từ CRM cũ → hệ mới. Mục tiêu: **không lệch / không mất / không sai** quan hệ (NV, khách, địa chỉ, lô, ảnh).

Nguồn quy tắc dài: [`docs/MIGRATION.md`](../../../docs/MIGRATION.md). Domain liên quan trong `docs/domains/` (đặc biệt `lodats.md` §13, `addresses.md`).

## Khi nào dùng

- Chủ bảo **chuyển / copy / migrate** data từ CRM cũ
- Viết hoặc chạy `apps/api/scripts/migrate-*-from-legacy.ts`
- Nghi ngờ thiếu FK, sai chủ (NV), lệch số bản ghi

**Không** dùng skill này cho: Prisma schema-only, UI, deploy (→ `deploy-staging`), hoặc skill Cursor `migrate-to-builds` (environment build).

## Đường dẫn chuẩn (VPS)

| | Path |
|--|------|
| SQLite cũ (chỉ đọc) | `/var/www/anhungland-crm/database/facebook_customer_crm.db` |
| Ảnh cũ | `/var/www/anhungland-crm/api/img/…` |
| App mới | `/var/www/crmanhung/repo/apps/api` |
| Chạy script | `cd …/apps/api` + `pnpm <script>:migrate-legacy` (load `.env` tại chỗ) |

**Cấm ghi** vào SQLite / `img/` CRM cũ. **Cấm** dừng / sửa PM2 `anhungland-api`. Site cũ `crm.anhungland.com` giữ nguyên cho đến cutover.

## Nguyên tắc bất biến

1. **Schema trước data** — Prisma + model domain đã chốt khớp trước khi copy. Stub lệch model (vd. thiếu `ProjectLot`) → **sửa schema trước**, không “copy tạm rồi sửa sau”.
2. **Thứ tự FK** — chỉ copy khi mọi FK đã có trong `migrate.legacy_id_map` (và hàng đích còn sống). Thiếu map → **bỏ dòng + log**, không bịa ID, không gán nhầm sang NV/khách khác.
3. **Một entity = một `old_id`** trong `migrate.legacy_id_map` (`entity`, `old_id`, `new_id`). Idempotent: đã map → **update** hàng mới, không insert trùng.
4. **Script chỉ đọc SQLite**; đích = Postgres + R2 (`objectKey`, không path `/img/…` trên disk app mới).
5. **Một slice / một PR** — không gộp copy khách + lô + GD trong một PR.
6. **Giữ luồng nhân viên** — xem mục «NV kha / buinam» bên dưới. Không gộp chủ về `admin`.
7. **Đếm trước / sau** — trước khi chạy: COUNT nguồn; sau: COUNT đích + COUNT map; báo số bỏ / lỗi. Lệch bất thường → **dừng**, không chạy bước sau.
8. Cập nhật cột **Trạng thái** trong `docs/MIGRATION.md` sau khi chạy xong trên staging.

## Checklist trước khi chạy (preflight)

Làm trên VPS (hoặc agent SSH khi chủ đã cho phép), **trước** `pnpm …:migrate-legacy`:

```
□ Script đã deploy trên main / đúng bản trên /var/www/crmanhung/repo
□ DATABASE_URL + R2 (nếu có ảnh) trong apps/api/.env
□ sqlite3 + pnpm + tsx chạy được
□ Entity phụ thuộc đã có trong migrate.legacy_id_map (vd. lodat cần user, customer, address…)
□ Preflight: mọi PersonId / EmployeeId / AddressId sẽ dùng đều map được (0 missing)
□ Model reshape đã hiểu (vd. PROJECT lodat ≠ 1:1 → Lodat; xem lodats.md §0.4 / §13)
□ Không freeze bắt buộc nếu chỉ copy bảng không đổi CRM cũ — nhưng copy khách/lô lớn: nhắc freeze + tắt extension
```

Mẫu preflight (ý tưởng): lấy DISTINCT FK từ SQLite → so `migrate.legacy_id_map` → in `missing_*` và `maps_attachable=N of M`. **Chỉ chạy migrate khi attachable = đủ** (hoặc chủ chấp nhận bỏ có chủ đích).

## Pattern script (bắt buộc)

Tham chiếu: `migrate-hotlines-from-legacy.ts`, `migrate-addresses-from-legacy.ts`, `migrate-customers-from-legacy.ts`.

| Việc | Cách |
|------|------|
| Đọc SQLite | `sqlite3 -json` qua `execFileSync` — **không** mở ghi |
| Map ID | `loadMap` / `upsertMap` vào `migrate.legacy_id_map` |
| Schema migrate | `CREATE SCHEMA IF NOT EXISTS migrate` + bảng map nếu chưa có |
| Thiếu FK | `console.warn` + `skipped++` — không throw cả batch trừ khi entity phụ thuộc **rỗng hoàn toàn** (vd. chưa có map `user`) |
| Ảnh → R2 | HeadObject bỏ qua nếu đã có; PutObject; lưu `objectKey`; map entity ảnh riêng |
| npm script | Thêm vào `apps/api/package.json` (`foo:migrate-legacy`) |
| Header file | Usage path VPS + entity map + dependency map |

`DATABASE_URL` có `?schema=public` → khi gọi `psql` tay phải **cắt query string**.

## Nhân viên — kha / buinam (không được lệch)

Hai STAFF tách luồng (đã copy User + Customer):

| Username | Old `tblUsers.ID` | Vai trò copy |
|----------|-------------------|--------------|
| `kha` | 5 | Luồng chính — đa số khách + map lô |
| `buinam` | 3 | Luồng riêng — không trộn vào kha |
| `admin` | 1 | ADMIN — thường là người tạo **kho** `ProjectLot`, không phải chủ map `/lo-dat` |

**Luật:**

- `Customer.employeeId`, `Lodat.createdByEmployeeId`, `LodatCustomerMap.createdByEmployeeId` lấy từ đúng cột cũ (`EmployeeId` / `CreatedByEmployeeId` trên **map**).
- **Không** gán hết lô/map về `admin` hoặc về một NV vì “tiện”.
- List STAFF `/lo-dat` = lọc theo NV đăng nhập → sai `createdBy` = **mất / thấy nhầm** data.
- Kho dự án: `ProjectLot.createdBy` có thể là admin (đúng import); map chủ vẫn là kha/buinam.

## Lô đất — reshape (dễ sai nhất)

Cũ: một `tblLodats` cho cả kho lẫn dân.  
Mới (chốt `lodats.md` §0.4):

| Nguồn cũ | Đích mới |
|----------|----------|
| `tblLodats` + Address `PROJECT` | **`ProjectLot`** (1:1), kể cả chưa có chủ |
| Mỗi **luồng** NV trên lô PROJECT (`LodatId`+`CreatedByEmployeeId`) | **`Lodat`** (trỏ `projectLotId`) + mọi map của luồng → `LodatCustomerMap` |
| `tblLodats` + Address `REGULAR` | **`Lodat`** (tự DT/MT) + maps |
| `tblLodatImages` trên PROJECT | `LodatImage` trên **Lodat stream** `p:{lodatId}:{CreatedByEmployeeId}` (ảnh riêng thửa; ảnh dự án vẫn ở Address) |
| `tblLodatImages` trên REGULAR | `LodatImage`: `/img/lodats` → R2 `lodats/…`; path `imgsmessenger` → **reuse** objectKey `customers/chat/…` (không nhân bản file) |

**Cấm** copy 1:1 toàn bộ `tblLodats` → `Lodat` (phá model pointer + nhân bản kho).

Thứ tự slice: schema `ProjectLot`+`Lodat`+map → copy kho → copy dân + maps → copy maps PROJECT → ảnh dân → API list. Chi tiết: `lodats.md` §13.

## Chạy trên VPS

1. Code script đã lên `main` (skill `deploy-staging` nếu cần).
2. SSH (user `deploy` hoặc root **chỉ khi chủ cung cấp / đồng ý**). Không commit mật khẩu; không nhắc lại secret trong PR.
3. Ví dụ:

```bash
cd /var/www/crmanhung/repo/apps/api
LEGACY_SQLITE=/var/www/anhungland-crm/database/facebook_customer_crm.db \
  pnpm addresses:migrate-legacy
```

4. Đọc log: copied / skipped / map entity counts.
5. Spot-check UI hoặc SQL COUNT; cập nhật `MIGRATION.md`.

## Sau khi chạy — Definition of Done

- [ ] Log không có lỗi hàng loạt; skipped có lý do rõ
- [ ] `migrate.legacy_id_map` COUNT entity ≈ nguồn (trừ skipped có chủ đích)
- [ ] FK sống: JOIN map → bảng đích không orphan
- [ ] Ảnh: URL R2 mở được (nếu bước có R2)
- [ ] NV: mẫu vài lô/khách của **kha** và **buinam** đúng chủ
- [ ] `docs/MIGRATION.md` đánh dấu bước Xong staging
- [ ] Không đụng ghi CRM cũ

## Cấm

- Copy khi schema chưa khớp model đã chốt
- Bịa / đoán FK khi thiếu map
- Gộp luồng kha ↔ buinam hoặc gán `createdBy = admin` cho map NV
- Ghi SQLite / xóa `img/` cũ / restart `anhungland-api` như phần “dọn migrate”
- Commit `.env`, password, dump DB vào git
- Chạy bước sau khi bước trước lệch số chưa giải thích
- Dùng skill này thay cho sửa bug UI hoặc deploy

## Liên quan

- Checklist tổng: `docs/MIGRATION.md`
- Lịch lô: `docs/domains/lodats.md` §13
- Deploy code lên VPS trước khi chạy script: skill `deploy-staging`
- Ảnh R2: skill `cloudflare-r2`
