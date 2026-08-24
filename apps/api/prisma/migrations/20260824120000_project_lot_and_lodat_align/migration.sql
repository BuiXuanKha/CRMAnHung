-- ProjectLot + align Lodat / LodatCustomerMap with lodats.md §0.4 / §13
-- Staging: Lodat tables empty — safe to reshape.

-- 1) ProjectLot (kho dự án)
CREATE TABLE IF NOT EXISTS "ProjectLot" (
    "id" TEXT NOT NULL,
    "addressId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "areaM2" DOUBLE PRECISION,
    "frontageM" DOUBLE PRECISION,
    "direction" TEXT,
    "note" TEXT,
    "isHidden" BOOLEAN NOT NULL DEFAULT false,
    "createdByEmployeeId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "ProjectLot_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "ProjectLot_addressId_idx" ON "ProjectLot"("addressId");
CREATE INDEX IF NOT EXISTS "ProjectLot_isHidden_idx" ON "ProjectLot"("isHidden");
CREATE INDEX IF NOT EXISTS "ProjectLot_title_idx" ON "ProjectLot"("title");

DO $$ BEGIN
  ALTER TABLE "ProjectLot"
    ADD CONSTRAINT "ProjectLot_addressId_fkey"
    FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "ProjectLot"
    ADD CONSTRAINT "ProjectLot_createdByEmployeeId_fkey"
    FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 2) LodatCustomerMap — drop old unique before reshape (empty or clear maps first)
DROP INDEX IF EXISTS "LodatCustomerMap_lodatId_customerId_key";

-- Clear stub rows if any (no production lodat data yet on staging)
DELETE FROM "TransactionAttachment";
DELETE FROM "TransactionParty";
DELETE FROM "Transaction";
DELETE FROM "LodatCustomerMap";
DELETE FROM "LodatImage";
DELETE FROM "Lodat";

-- 3) Lodat reshape
ALTER TABLE "Lodat" DROP COLUMN IF EXISTS "isForSale";
ALTER TABLE "Lodat" ALTER COLUMN "title" DROP NOT NULL;
ALTER TABLE "Lodat" ADD COLUMN IF NOT EXISTS "projectLotId" TEXT;
ALTER TABLE "Lodat" ADD COLUMN IF NOT EXISTS "propertyKind" TEXT NOT NULL DEFAULT 'DAT';
ALTER TABLE "Lodat" ADD COLUMN IF NOT EXISTS "createdByEmployeeId" TEXT;

-- Temporary: if any orphan left without creator, attach first admin (should be none after DELETE)
UPDATE "Lodat" l
SET "createdByEmployeeId" = (SELECT id FROM "User" WHERE role = 'ADMIN' ORDER BY "createdAt" LIMIT 1)
WHERE "createdByEmployeeId" IS NULL;

ALTER TABLE "Lodat" ALTER COLUMN "createdByEmployeeId" SET NOT NULL;

CREATE INDEX IF NOT EXISTS "Lodat_addressId_idx" ON "Lodat"("addressId");
CREATE INDEX IF NOT EXISTS "Lodat_projectLotId_idx" ON "Lodat"("projectLotId");
CREATE INDEX IF NOT EXISTS "Lodat_createdByEmployeeId_idx" ON "Lodat"("createdByEmployeeId");
CREATE INDEX IF NOT EXISTS "Lodat_propertyKind_idx" ON "Lodat"("propertyKind");

-- One STAFF stream per warehouse lot
CREATE UNIQUE INDEX IF NOT EXISTS "Lodat_projectLotId_createdByEmployeeId_uidx"
  ON "Lodat"("projectLotId", "createdByEmployeeId")
  WHERE "projectLotId" IS NOT NULL;

DO $$ BEGIN
  ALTER TABLE "Lodat" DROP CONSTRAINT IF EXISTS "Lodat_addressId_fkey";
EXCEPTION WHEN undefined_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Lodat"
    ADD CONSTRAINT "Lodat_addressId_fkey"
    FOREIGN KEY ("addressId") REFERENCES "Address"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Lodat"
    ADD CONSTRAINT "Lodat_projectLotId_fkey"
    FOREIGN KEY ("projectLotId") REFERENCES "ProjectLot"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE "Lodat"
    ADD CONSTRAINT "Lodat_createdByEmployeeId_fkey"
    FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4) LodatCustomerMap reshape
ALTER TABLE "LodatCustomerMap" ADD COLUMN IF NOT EXISTS "priceNote" TEXT;
ALTER TABLE "LodatCustomerMap" ADD COLUMN IF NOT EXISTS "brokerFeeNote" TEXT;
ALTER TABLE "LodatCustomerMap" ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "LodatCustomerMap" ADD COLUMN IF NOT EXISTS "endedAt" TIMESTAMP(3);
ALTER TABLE "LodatCustomerMap" ADD COLUMN IF NOT EXISTS "createdByEmployeeId" TEXT;

-- priceVnd Int → BigInt
ALTER TABLE "LodatCustomerMap" ALTER COLUMN "priceVnd" TYPE BIGINT
  USING CASE WHEN "priceVnd" IS NULL THEN NULL ELSE "priceVnd"::BIGINT END;

ALTER TABLE "LodatCustomerMap" ALTER COLUMN "status" SET DEFAULT 'TAM_DUNG';

CREATE INDEX IF NOT EXISTS "LodatCustomerMap_lodatId_isActive_idx"
  ON "LodatCustomerMap"("lodatId", "isActive");
CREATE INDEX IF NOT EXISTS "LodatCustomerMap_createdByEmployeeId_idx"
  ON "LodatCustomerMap"("createdByEmployeeId");
CREATE INDEX IF NOT EXISTS "LodatCustomerMap_status_idx"
  ON "LodatCustomerMap"("status");

-- At most one active owner map per Lodat row
CREATE UNIQUE INDEX IF NOT EXISTS "LodatCustomerMap_lodatId_active_uidx"
  ON "LodatCustomerMap"("lodatId")
  WHERE "isActive" = true;

DO $$ BEGIN
  ALTER TABLE "LodatCustomerMap"
    ADD CONSTRAINT "LodatCustomerMap_createdByEmployeeId_fkey"
    FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
