-- Eager upload on create-lodat form: temp rows must be owned by the uploader.
DELETE FROM "LodatTempImage";

ALTER TABLE "LodatTempImage" ADD COLUMN "createdByEmployeeId" TEXT NOT NULL;

CREATE INDEX "LodatTempImage_createdByEmployeeId_idx" ON "LodatTempImage"("createdByEmployeeId");
CREATE INDEX "LodatTempImage_createdAt_idx" ON "LodatTempImage"("createdAt");
