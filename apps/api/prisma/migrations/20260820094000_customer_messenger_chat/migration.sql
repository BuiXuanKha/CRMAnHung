-- AlterTable
ALTER TABLE "CustomerMessengerMessage" ADD COLUMN "sender" TEXT;
ALTER TABLE "CustomerMessengerMessage" ADD COLUMN "senderUid" TEXT;
ALTER TABLE "CustomerMessengerMessage" ADD COLUMN "dedupeKey" TEXT;
ALTER TABLE "CustomerMessengerMessage" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "CustomerMessengerImage" ADD COLUMN "originalPath" TEXT;
ALTER TABLE "CustomerMessengerImage" ADD COLUMN "sortOrder" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "CustomerMessengerImage" ADD COLUMN "rotationDeg" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "CustomerMessengerMessage_customerFacebookId_sortOrder_idx" ON "CustomerMessengerMessage"("customerFacebookId", "sortOrder");

-- CreateIndex
CREATE INDEX "CustomerMessengerImage_messageId_sortOrder_idx" ON "CustomerMessengerImage"("messageId", "sortOrder");
