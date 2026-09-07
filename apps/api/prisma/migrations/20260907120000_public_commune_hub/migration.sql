-- Trang hub xã cố định + 301 khi đổi tên xã (BUG-068).
CREATE TABLE "PublicCommuneHub" (
    "id" TEXT NOT NULL,
    "wardId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "label" TEXT NOT NULL,
    "districtLabel" TEXT NOT NULL DEFAULT '',
    "provinceLabel" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PublicCommuneHub_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicCommuneHub_wardId_key" ON "PublicCommuneHub"("wardId");
CREATE UNIQUE INDEX "PublicCommuneHub_slug_key" ON "PublicCommuneHub"("slug");
CREATE INDEX "PublicCommuneHub_updatedAt_idx" ON "PublicCommuneHub"("updatedAt");

ALTER TABLE "PublicCommuneHub" ADD CONSTRAINT "PublicCommuneHub_wardId_fkey" FOREIGN KEY ("wardId") REFERENCES "Ward"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

CREATE TABLE "PublicCommuneHubRedirect" (
    "id" TEXT NOT NULL,
    "fromSlug" TEXT NOT NULL,
    "toSlug" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "PublicCommuneHubRedirect_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicCommuneHubRedirect_fromSlug_key" ON "PublicCommuneHubRedirect"("fromSlug");
CREATE INDEX "PublicCommuneHubRedirect_toSlug_idx" ON "PublicCommuneHubRedirect"("toSlug");
