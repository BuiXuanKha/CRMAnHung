-- AlterTable
ALTER TABLE "PublicLotListing" ADD COLUMN "needsWebUpdateChanges" JSONB NOT NULL DEFAULT '[]';
