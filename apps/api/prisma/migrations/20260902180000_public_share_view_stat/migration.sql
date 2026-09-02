-- CreateTable
CREATE TABLE "PublicShareViewStat" (
    "employeeId" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicShareViewStat_pkey" PRIMARY KEY ("employeeId")
);

-- AddForeignKey
ALTER TABLE "PublicShareViewStat" ADD CONSTRAINT "PublicShareViewStat_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
