-- CreateTable
CREATE TABLE "PublicDirectViewStat" (
    "id" TEXT NOT NULL,
    "viewCount" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicDirectViewStat_pkey" PRIMARY KEY ("id")
);

INSERT INTO "PublicDirectViewStat" ("id", "viewCount", "updatedAt")
VALUES ('direct', 0, CURRENT_TIMESTAMP);
