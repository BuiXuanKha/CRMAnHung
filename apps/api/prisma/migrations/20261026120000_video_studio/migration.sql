-- CreateTable
CREATE TABLE "VideoProject" (
    "id" TEXT NOT NULL,
    "lodatId" TEXT NOT NULL,
    "createdByEmployeeId" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "exportObjectKey" TEXT,
    "exportError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoProject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VideoScene" (
    "id" TEXT NOT NULL,
    "projectId" TEXT NOT NULL,
    "kind" TEXT NOT NULL,
    "customLabel" TEXT,
    "sortOrder" INTEGER NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "rawVideoObjectKey" TEXT,
    "narrationText" TEXT NOT NULL DEFAULT '',
    "aiNotes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VideoScene_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "VideoProject_lodatId_createdByEmployeeId_idx" ON "VideoProject"("lodatId", "createdByEmployeeId");

-- CreateIndex
CREATE INDEX "VideoProject_lodatId_updatedAt_idx" ON "VideoProject"("lodatId", "updatedAt");

-- CreateIndex
CREATE INDEX "VideoScene_projectId_sortOrder_idx" ON "VideoScene"("projectId", "sortOrder");

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_lodatId_fkey" FOREIGN KEY ("lodatId") REFERENCES "Lodat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoProject" ADD CONSTRAINT "VideoProject_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VideoScene" ADD CONSTRAINT "VideoScene_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "VideoProject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
