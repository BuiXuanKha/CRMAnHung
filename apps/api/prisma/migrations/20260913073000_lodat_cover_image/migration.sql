-- AlterTable
ALTER TABLE "Lodat" ADD COLUMN "coverImageId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Lodat_coverImageId_key" ON "Lodat"("coverImageId");

-- AddForeignKey
ALTER TABLE "Lodat" ADD CONSTRAINT "Lodat_coverImageId_fkey" FOREIGN KEY ("coverImageId") REFERENCES "LodatImage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
