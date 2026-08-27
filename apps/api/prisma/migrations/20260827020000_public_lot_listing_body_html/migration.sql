-- Phase 2: persist TipTap body + first publish timestamp.

ALTER TABLE "PublicLotListing"
  ADD COLUMN "bodyHtml" TEXT NOT NULL DEFAULT '',
  ADD COLUMN "publishedAt" TIMESTAMP(3);
