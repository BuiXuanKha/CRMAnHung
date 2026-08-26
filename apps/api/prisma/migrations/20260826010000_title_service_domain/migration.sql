-- Replace stub TitleService* with CRM-old-aligned schema (tblTitleService*).
-- Staging: TitleService tables empty. Safe to drop/recreate.

DROP TABLE IF EXISTS "TitleServiceAttachment";
DROP TABLE IF EXISTS "TitleServiceMoney";
DROP TABLE IF EXISTS "TitleServiceProgress";
DROP TABLE IF EXISTS "TitleService";

CREATE TABLE "TitleService" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DANG_LAM',
    "agreedFeeVnd" BIGINT,
    "needSummary" TEXT,
    "note" TEXT,
    "startedAt" TIMESTAMP(3) NOT NULL,
    "expectedDoneAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "createdByEmployeeId" TEXT NOT NULL,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "pinnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TitleService_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "TitleService_code_key" ON "TitleService"("code");
CREATE INDEX "TitleService_customerId_idx" ON "TitleService"("customerId");
CREATE INDEX "TitleService_createdByEmployeeId_idx" ON "TitleService"("createdByEmployeeId");
CREATE INDEX "TitleService_status_idx" ON "TitleService"("status");
CREATE INDEX "TitleService_isPinned_pinnedAt_idx" ON "TitleService"("isPinned", "pinnedAt");
CREATE INDEX "TitleService_updatedAt_idx" ON "TitleService"("updatedAt");

ALTER TABLE "TitleService"
  ADD CONSTRAINT "TitleService_customerId_fkey"
  FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TitleService"
  ADD CONSTRAINT "TitleService_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TitleServiceProgress" (
    "id" TEXT NOT NULL,
    "titleServiceId" TEXT NOT NULL,
    "stepType" TEXT NOT NULL,
    "note" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "createdByEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleServiceProgress_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TitleServiceProgress_titleServiceId_happenedAt_idx"
  ON "TitleServiceProgress"("titleServiceId", "happenedAt");
CREATE INDEX "TitleServiceProgress_createdByEmployeeId_idx"
  ON "TitleServiceProgress"("createdByEmployeeId");

ALTER TABLE "TitleServiceProgress"
  ADD CONSTRAINT "TitleServiceProgress_titleServiceId_fkey"
  FOREIGN KEY ("titleServiceId") REFERENCES "TitleService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TitleServiceProgress"
  ADD CONSTRAINT "TitleServiceProgress_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "TitleServiceMoney" (
    "id" TEXT NOT NULL,
    "titleServiceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "amountVnd" BIGINT NOT NULL,
    "note" TEXT,
    "happenedAt" TIMESTAMP(3) NOT NULL,
    "createdByEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleServiceMoney_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TitleServiceMoney_titleServiceId_happenedAt_idx"
  ON "TitleServiceMoney"("titleServiceId", "happenedAt");
CREATE INDEX "TitleServiceMoney_createdByEmployeeId_idx"
  ON "TitleServiceMoney"("createdByEmployeeId");

ALTER TABLE "TitleServiceMoney"
  ADD CONSTRAINT "TitleServiceMoney_titleServiceId_fkey"
  FOREIGN KEY ("titleServiceId") REFERENCES "TitleService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TitleServiceMoney"
  ADD CONSTRAINT "TitleServiceMoney_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "TitleServiceMoney"
  ADD CONSTRAINT "TitleServiceMoney_amountVnd_chk"
  CHECK ("amountVnd" > 0);

CREATE TABLE "TitleServiceAttachment" (
    "id" TEXT NOT NULL,
    "titleServiceId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "objectKey" TEXT NOT NULL,
    "createdByEmployeeId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleServiceAttachment_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TitleServiceAttachment_titleServiceId_idx" ON "TitleServiceAttachment"("titleServiceId");
CREATE INDEX "TitleServiceAttachment_createdByEmployeeId_idx" ON "TitleServiceAttachment"("createdByEmployeeId");
CREATE UNIQUE INDEX "TitleServiceAttachment_objectKey_key" ON "TitleServiceAttachment"("objectKey");

ALTER TABLE "TitleServiceAttachment"
  ADD CONSTRAINT "TitleServiceAttachment_titleServiceId_fkey"
  FOREIGN KEY ("titleServiceId") REFERENCES "TitleService"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TitleServiceAttachment"
  ADD CONSTRAINT "TitleServiceAttachment_createdByEmployeeId_fkey"
  FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
