-- Phase 5: CMS bài viết public (PublicPost).

CREATE TABLE "PublicPost" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "title" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "bodyHtml" TEXT NOT NULL DEFAULT '',
    "excerpt" TEXT NOT NULL DEFAULT '',
    "metaDescription" TEXT,
    "authorLabel" TEXT NOT NULL DEFAULT 'An Hưng Land',
    "publishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PublicPost_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "PublicPost_category_slug_key" ON "PublicPost"("category", "slug");
CREATE INDEX "PublicPost_status_idx" ON "PublicPost"("status");
CREATE INDEX "PublicPost_category_status_idx" ON "PublicPost"("category", "status");
CREATE INDEX "PublicPost_updatedAt_idx" ON "PublicPost"("updatedAt");
