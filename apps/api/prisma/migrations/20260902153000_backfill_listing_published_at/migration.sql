-- Guest chi tiết / share dùng isPublished; publishedAt từng trống trên lô đã Đăng web → 404.
-- Backfill lần đăng (giữ khi gỡ) cho hàng đang hiện.
UPDATE "PublicLotListing"
SET "publishedAt" = COALESCE("publishedAt", "updatedAt", "createdAt")
WHERE "isPublished" = true
  AND "publishedAt" IS NULL;
