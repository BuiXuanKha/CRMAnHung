/**
 * Copy leftover CMS post photos (`public-web/` UUID) to SEO keys
 * `{slug-tieu-de}-anh-n.webp` and rewrite cover + TipTap URLs.
 * Shared UUID files are copied per post (not deleted) — several /du-an
 * articles reused the same three images.
 *
 * Usage (VPS, apps/api):
 *   pnpm images:seo-copy-posts
 *   APPLY=1 pnpm images:seo-copy-posts
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../src/storage/storage.service';
import { rewritePostSeoImages } from '../src/modules/public-content/post-seo-image-upload';

const prisma = new PrismaClient();

function loadDotEnv(file: string) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split('\n')) {
    const t = line.trim();
    if (!t || t.startsWith('#') || !t.includes('=')) continue;
    const i = t.indexOf('=');
    const key = t.slice(0, i);
    const val = t.slice(i + 1).replace(/^['"]|['"]$/g, '');
    if (process.env[key] == null) process.env[key] = val;
  }
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env'));
  const apply = process.env.APPLY === '1';
  const storage = new StorageService(new ConfigService());
  if (!storage.isConfigured()) {
    throw new Error('R2 chưa cấu hình (R2_ENDPOINT / keys / bucket / public URL).');
  }

  const posts = await prisma.publicPost.findMany({
    select: {
      id: true,
      title: true,
      category: true,
      slug: true,
      coverImageUrl: true,
      bodyHtml: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  let planned = 0;
  let updated = 0;
  let skipped = 0;

  console.log(`seo-copy-post-images apply=${apply} posts=${posts.length}`);

  for (const post of posts) {
    const rewritten = await rewritePostSeoImages(
      storage,
      {
        title: post.title,
        coverImageUrl: post.coverImageUrl,
        bodyHtml: post.bodyHtml ?? '',
      },
      { dryRun: !apply },
    );
    if (rewritten.moves.length === 0) {
      skipped += 1;
      continue;
    }
    planned += rewritten.moves.length;
    for (const move of rewritten.moves) {
      console.log(
        `${apply ? 'MOVE' : 'DRY'} ${post.category}/${post.slug} ${move.fromKey} -> ${move.toKey}`,
      );
    }
    if (!apply) continue;
    const coverChanged = rewritten.coverImageUrl !== post.coverImageUrl;
    const bodyChanged = rewritten.bodyHtml !== (post.bodyHtml ?? '');
    if (!coverChanged && !bodyChanged) continue;
    await prisma.publicPost.update({
      where: { id: post.id },
      data: {
        coverImageUrl: rewritten.coverImageUrl,
        bodyHtml: rewritten.bodyHtml,
      },
    });
    updated += 1;
  }

  console.log(
    `done planned=${planned} postsUpdated=${updated} alreadySeo=${skipped} apply=${apply}`,
  );
  if (!apply && planned > 0) {
    console.log('Chạy APPLY=1 — copy UUID public-web sang {slug}-anh-n.webp, cập nhật URL bài.');
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
