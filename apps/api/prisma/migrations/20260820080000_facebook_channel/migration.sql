-- AlterTable
ALTER TABLE "CustomerFacebook" ADD COLUMN "scanSourceLabel" TEXT;
ALTER TABLE "CustomerFacebook" ADD COLUMN "employeeFacebookUid" TEXT;

CREATE INDEX "CustomerFacebook_employeeFacebookUid_idx" ON "CustomerFacebook"("employeeFacebookUid");

-- AlterTable
ALTER TABLE "EmployeeFacebookProfile" ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "EmployeeFacebookProfile" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE INDEX "EmployeeFacebookProfile_facebookUid_idx" ON "EmployeeFacebookProfile"("facebookUid");
