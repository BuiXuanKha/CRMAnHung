-- Replace stub Transaction* with CRM-old-aligned schema (tblTransaction*).
-- Staging: Transaction tables empty (cleared in 20260824120000). Safe to drop/recreate.

DROP TABLE IF EXISTS "TransactionAttachment";
DROP TABLE IF EXISTS "TransactionParty";
DROP TABLE IF EXISTS "TransactionSnapshotImage";
DROP TABLE IF EXISTS "TransactionSnapshot";
DROP TABLE IF EXISTS "Transaction";

CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "lodatId" TEXT NOT NULL,
    "lodatCustomerMapId" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'OWN',
    "status" TEXT NOT NULL DEFAULT 'DA_COC',
    "notaryAppointmentAt" TIMESTAMP(3),
    "salePriceVnd" BIGINT NOT NULL DEFAULT 0,
    "taxPriceVnd" BIGINT,
    "commissionVnd" BIGINT NOT NULL DEFAULT 0,
    "note" TEXT,
    "cancelReason" TEXT,
    "createdByEmployeeId" TEXT NOT NULL,
    "completedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "Transaction_code_key" ON "Transaction"("code");
CREATE INDEX "Transaction_lodatId_idx" ON "Transaction"("lodatId");
CREATE INDEX "Transaction_lodatCustomerMapId_idx" ON "Transaction"("lodatCustomerMapId");
CREATE INDEX "Transaction_createdByEmployeeId_idx" ON "Transaction"("createdByEmployeeId");
CREATE INDEX "Transaction_status_idx" ON "Transaction"("status");
CREATE INDEX "Transaction_type_idx" ON "Transaction"("type");
CREATE INDEX "Transaction_createdAt_idx" ON "Transaction"("createdAt");

-- One open deal per lodat (app rule in old CRM; DB-enforced here).
CREATE UNIQUE INDEX "Transaction_lodatId_open_uidx"
  ON "Transaction"("lodatId")
  WHERE "status" IN ('DA_COC', 'DA_CONG_CHUNG');

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_lodatId_fkey"
  FOREIGN KEY ("lodatId") REFERENCES "Lodat"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_lodatCustomerMapId_fkey"
  FOREIGN KEY ("lodatCustomerMapId") REFERENCES "LodatCustomerMap"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "Transaction"
  ADD CONSTRAINT "Transaction_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TransactionParty" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "customerId" TEXT,
    "freeTextName" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TransactionParty_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransactionParty_transactionId_role_sortOrder_idx"
  ON "TransactionParty"("transactionId", "role", "sortOrder");
CREATE INDEX "TransactionParty_customerId_idx" ON "TransactionParty"("customerId");

ALTER TABLE "TransactionParty"
  ADD CONSTRAINT "TransactionParty_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransactionParty"
  ADD CONSTRAINT "TransactionParty_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "TransactionParty"
  ADD CONSTRAINT "TransactionParty_freeTextName_chk"
  CHECK (length(trim("freeTextName")) > 0);

CREATE TABLE "TransactionSnapshot" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "title" TEXT,
    "addressText" TEXT,
    "areaM2" DOUBLE PRECISION,
    "frontageM" DOUBLE PRECISION,
    "direction" TEXT,
    "propertyKind" TEXT,
    "mapStatus" TEXT,
    "mapPriceVnd" BIGINT,
    "mapPriceNote" TEXT,
    "mapBrokerFeeNote" TEXT,
    "mapNote" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionSnapshot_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TransactionSnapshot_transactionId_key" ON "TransactionSnapshot"("transactionId");

ALTER TABLE "TransactionSnapshot"
  ADD CONSTRAINT "TransactionSnapshot_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "TransactionSnapshotImage" (
    "id" TEXT NOT NULL,
    "snapshotId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "rotationDeg" INTEGER NOT NULL DEFAULT 0,
    "sourceLodatImageId" TEXT,

    CONSTRAINT "TransactionSnapshotImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransactionSnapshotImage_snapshotId_sortOrder_idx"
  ON "TransactionSnapshotImage"("snapshotId", "sortOrder");

ALTER TABLE "TransactionSnapshotImage"
  ADD CONSTRAINT "TransactionSnapshotImage_snapshotId_fkey"
  FOREIGN KEY ("snapshotId") REFERENCES "TransactionSnapshot"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TransactionSnapshotImage"
  ADD CONSTRAINT "TransactionSnapshotImage_sourceLodatImageId_fkey"
  FOREIGN KEY ("sourceLodatImageId") REFERENCES "LodatImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "TransactionAttachment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'KHAC',
    "label" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TransactionAttachment_transactionId_sortOrder_idx"
  ON "TransactionAttachment"("transactionId", "sortOrder");

ALTER TABLE "TransactionAttachment"
  ADD CONSTRAINT "TransactionAttachment_transactionId_fkey"
  FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;
