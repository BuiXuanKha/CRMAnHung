-- Redirect bảng slug lô cũ → mới (301 trên Next guest).
CREATE TABLE "PublicLotSlugRedirect" (
    "id" TEXT NOT NULL,
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicLotSlugRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicLotSlugRedirect_fromSlug_key" ON "PublicLotSlugRedirect"("fromSlug");
CREATE INDEX "PublicLotSlugRedirect_toSlug_idx" ON "PublicLotSlugRedirect"("toSlug");
