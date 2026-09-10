-- Owner 2026-09-10: chuyển map active Tạm dừng → Không bán.
-- Lô Không bán ẩn khỏi web khách (catalog / sitemap / slug).
-- Chỉ map đang active; lịch sử map đã đóng giữ nguyên.

UPDATE "LodatCustomerMap"
SET
  "status" = 'KHONG_BAN',
  "updatedAt" = CURRENT_TIMESTAMP
WHERE
  "isActive" = true
  AND "status" = 'TAM_DUNG';
