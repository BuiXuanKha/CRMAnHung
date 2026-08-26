-- Bài đăng lô đất public (Đăng web) — persist overlay admin.

CREATE TABLE "PublicLotListing" (
    "id" TEXT NOT NULL,
    "lodatId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "location" TEXT NOT NULL DEFAULT '',
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "priceMode" TEXT NOT NULL DEFAULT 'CONTACT',
    "priceLabel" TEXT,
    "excerpt" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicLotListing_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicLotListing_lodatId_key" ON "PublicLotListing"("lodatId");
CREATE UNIQUE INDEX "PublicLotListing_slug_key" ON "PublicLotListing"("slug");
CREATE INDEX "PublicLotListing_isPublished_idx" ON "PublicLotListing"("isPublished");
CREATE INDEX "PublicLotListing_updatedAt_idx" ON "PublicLotListing"("updatedAt");

ALTER TABLE "PublicLotListing"
  ADD CONSTRAINT "PublicLotListing_lodatId_fkey"
  FOREIGN KEY ("lodatId") REFERENCES "Lodat"("id") ON DELETE CASCADE ON UPDATE CASCADE;
