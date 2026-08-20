-- AlterTable
UPDATE "EmployeeHotline" SET "label" = '' WHERE "label" IS NULL;

ALTER TABLE "EmployeeHotline" ALTER COLUMN "label" SET NOT NULL;

ALTER TABLE "EmployeeHotline" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "EmployeeHotline" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "EmployeeHotline" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "EmployeeHotline_employeeId_phone_key" ON "EmployeeHotline"("employeeId", "phone");
