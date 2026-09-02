-- CreateTable
CREATE TABLE "PublicLotShare" (
    "id" TEXT NOT NULL,
    "shareCode" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "publicListingId" TEXT NOT NULL,
    "visitCount" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PublicLotShare_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PublicLotShare_shareCode_key" ON "PublicLotShare"("shareCode");

-- CreateIndex
CREATE UNIQUE INDEX "PublicLotShare_employeeId_publicListingId_key" ON "PublicLotShare"("employeeId", "publicListingId");

-- CreateIndex
CREATE INDEX "PublicLotShare_publicListingId_idx" ON "PublicLotShare"("publicListingId");

-- AddForeignKey
ALTER TABLE "PublicLotShare" ADD CONSTRAINT "PublicLotShare_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PublicLotShare" ADD CONSTRAINT "PublicLotShare_publicListingId_fkey" FOREIGN KEY ("publicListingId") REFERENCES "PublicLotListing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
