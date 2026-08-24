-- Align Province / District / Ward / Address with addresses.md (no official codes;
-- soft-hide; creator; Address FKs required).

-- Province: drop code, add soft-hide + creator + timestamps
DROP INDEX IF EXISTS "Province_code_key";
ALTER TABLE "Province" DROP COLUMN IF EXISTS "code";
ALTER TABLE "Province" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Province" ADD COLUMN IF NOT EXISTS "createdByEmployeeId" TEXT;
ALTER TABLE "Province" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Province" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Province_isHidden_idx" ON "Province"("isHidden");

-- District
DROP INDEX IF EXISTS "District_provinceId_code_key";
ALTER TABLE "District" DROP COLUMN IF EXISTS "code";
ALTER TABLE "District" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "District" ADD COLUMN IF NOT EXISTS "createdByEmployeeId" TEXT;
ALTER TABLE "District" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "District" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "District_isHidden_idx" ON "District"("isHidden");

-- Ward
DROP INDEX IF EXISTS "Ward_districtId_code_key";
ALTER TABLE "Ward" DROP COLUMN IF EXISTS "code";
ALTER TABLE "Ward" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Ward" ADD COLUMN IF NOT EXISTS "createdByEmployeeId" TEXT;
ALTER TABLE "Ward" ADD COLUMN IF NOT EXISTS "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
ALTER TABLE "Ward" ADD COLUMN IF NOT EXISTS "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
CREATE INDEX IF NOT EXISTS "Ward_isHidden_idx" ON "Ward"("isHidden");

-- Address: drop unused name; require 3 FKs; soft-hide + description + creator
ALTER TABLE "Address" DROP COLUMN IF EXISTS "name";
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "description" TEXT;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "isHidden" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "Address" ADD COLUMN IF NOT EXISTS "createdByEmployeeId" TEXT;

-- Ensure existing rows (if any) can satisfy NOT NULL before tightening.
-- Staging had empty Address table; if orphan null FKs exist they must be fixed manually.
DELETE FROM "Address" WHERE "provinceId" IS NULL OR "districtId" IS NULL OR "wardId" IS NULL;

ALTER TABLE "Address" ALTER COLUMN "provinceId" SET NOT NULL;
ALTER TABLE "Address" ALTER COLUMN "districtId" SET NOT NULL;
ALTER TABLE "Address" ALTER COLUMN "wardId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Address_kind_idx" ON "Address"("kind");
CREATE INDEX IF NOT EXISTS "Address_provinceId_idx" ON "Address"("provinceId");
CREATE INDEX IF NOT EXISTS "Address_districtId_idx" ON "Address"("districtId");
CREATE INDEX IF NOT EXISTS "Address_wardId_idx" ON "Address"("wardId");
CREATE INDEX IF NOT EXISTS "Address_isHidden_idx" ON "Address"("isHidden");

CREATE INDEX IF NOT EXISTS "AddressImage_addressId_sortOrder_idx" ON "AddressImage"("addressId", "sortOrder");

-- FKs to admin units + creators
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_provinceId_fkey";
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_districtId_fkey";
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_wardId_fkey";
ALTER TABLE "Address" DROP CONSTRAINT IF EXISTS "Address_createdByEmployeeId_fkey";

ALTER TABLE "Address"
  ADD CONSTRAINT "Address_provinceId_fkey"
  FOREIGN KEY ("provinceId") REFERENCES "Province"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Address"
  ADD CONSTRAINT "Address_districtId_fkey"
  FOREIGN KEY ("districtId") REFERENCES "District"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Address"
  ADD CONSTRAINT "Address_wardId_fkey"
  FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Address"
  ADD CONSTRAINT "Address_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Province" DROP CONSTRAINT IF EXISTS "Province_createdByEmployeeId_fkey";
ALTER TABLE "Province"
  ADD CONSTRAINT "Province_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "District" DROP CONSTRAINT IF EXISTS "District_createdByEmployeeId_fkey";
ALTER TABLE "District"
  ADD CONSTRAINT "District_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Ward" DROP CONSTRAINT IF EXISTS "Ward_createdByEmployeeId_fkey";
ALTER TABLE "Ward"
  ADD CONSTRAINT "Ward_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
