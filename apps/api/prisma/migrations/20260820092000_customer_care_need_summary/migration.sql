-- AlterTable
ALTER TABLE "CustomerCareNote" ADD COLUMN "needSummary" TEXT;
ALTER TABLE "CustomerCareNote" ALTER COLUMN "note" SET DEFAULT '';

-- CreateIndex
CREATE INDEX "CustomerCareNote_customerId_createdAt_idx" ON "CustomerCareNote"("customerId", "createdAt");
