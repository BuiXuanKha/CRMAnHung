-- Nhật ký xem giấy tờ mật sổ đỏ (signed URL).

CREATE TABLE "TitleServiceAttachmentView" (
    "id" TEXT NOT NULL,
    "attachmentId" TEXT NOT NULL,
    "viewedByEmployeeId" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TitleServiceAttachmentView_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "TitleServiceAttachmentView_attachmentId_viewedAt_idx"
  ON "TitleServiceAttachmentView"("attachmentId", "viewedAt");
CREATE INDEX "TitleServiceAttachmentView_viewedByEmployeeId_idx"
  ON "TitleServiceAttachmentView"("viewedByEmployeeId");

ALTER TABLE "TitleServiceAttachmentView"
  ADD CONSTRAINT "TitleServiceAttachmentView_attachmentId_fkey"
  FOREIGN KEY ("attachmentId") REFERENCES "TitleServiceAttachment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "TitleServiceAttachmentView"
  ADD CONSTRAINT "TitleServiceAttachmentView_viewedByEmployeeId_fkey"
  FOREIGN KEY ("viewedByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
