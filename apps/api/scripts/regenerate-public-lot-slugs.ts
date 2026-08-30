/**
 * Rewrite PublicLotListing.slug from title + leftover location (no 80-char cap).
 * Default: dry-run. Write DB only with APPLY=1 (or APPLY_LOT_SLUGS=1).
 * Does not rename CDN image keys.
 *
 *   pnpm --filter @crmanhung/api lots:regenerate-public-slugs
 *   APPLY=1 pnpm --filter @crmanhung/api lots:regenerate-public-slugs
 */
import { PrismaClient } from '@prisma/client';
import { PUBLIC_LISTING_PATH, reservePublicLotSlug, toListingPublicSlug } from '@crmanhung/shared';

const prisma = new PrismaClient();

function applyRequested(): boolean {
  const v = (process.env.APPLY ?? process.env.APPLY_LOT_SLUGS ?? '').trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

async function uniqueSlug(
  base: string,
  excludeId: string,
  reservedNext: Set<string>,
): Promise<string> {
  const root = reservePublicLotSlug(base || 'lo-dat');
  let slug = root;
  let n = 2;
  for (;;) {
    const hit = await prisma.publicLotListing.findUnique({ where: { slug } });
    const takenByPlan = reservedNext.has(slug);
    if ((!hit || hit.id === excludeId) && !takenByPlan) {
      reservedNext.add(slug);
      return slug;
    }
    slug = `${root}-${n}`;
    n += 1;
  }
}

async function revalidatePaths(paths: string[]): Promise<void> {
  const secret = process.env.REVALIDATE_SECRET?.trim();
  const origin = (process.env.PUBLIC_WEB_ORIGIN?.trim() || 'http://127.0.0.1:5001').replace(
    /\/$/,
    '',
  );
  if (!secret) {
    console.log('revalidate skip (REVALIDATE_SECRET missing)');
    return;
  }
  const unique = [...new Set(paths.filter(Boolean))];
  try {
    const res = await fetch(`${origin}/api/revalidate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-revalidate-secret': secret,
      },
      body: JSON.stringify({ paths: unique }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.log(`revalidate ${res.status}: ${text.slice(0, 200)}`);
      return;
    }
    console.log(`revalidate ok ${unique.length} paths`);
  } catch (err) {
    console.log(`revalidate failed: ${err instanceof Error ? err.message : String(err)}`);
  }
}

async function main() {
  const apply = applyRequested();
  const rows = await prisma.publicLotListing.findMany({
    orderBy: { createdAt: 'asc' },
  });
  const planned: Array<{ id: string; old: string; next: string }> = [];
  const reservedNext = new Set<string>();

  for (const row of rows) {
    const desired = toListingPublicSlug(row.title, row.location);
    const next = await uniqueSlug(desired, row.id, reservedNext);
    if (next === row.slug) {
      console.log(`ok  ${row.slug}`);
      continue;
    }
    planned.push({ id: row.id, old: row.slug, next });
    console.log(`${apply ? 'APPLY' : 'PLAN'}  ${row.slug}  ->  ${next}`);
  }

  if (planned.length === 0) {
    console.log(`done changed=0 total=${rows.length} (dry-run=${!apply})`);
    return;
  }

  if (!apply) {
    console.log(
      `done planned=${planned.length} total=${rows.length} — dry-run. Set APPLY=1 to write 301s.`,
    );
    return;
  }

  const revalidate: string[] = [
    PUBLIC_LISTING_PATH,
    '/',
    '/sitemap.xml',
  ];

  for (const row of planned) {
    await prisma.$transaction(async (tx) => {
      await tx.publicLotSlugRedirect.deleteMany({ where: { fromSlug: row.next } });
      await tx.publicLotSlugRedirect.upsert({
        where: { fromSlug: row.old },
        create: { fromSlug: row.old, toSlug: row.next },
        update: { toSlug: row.next },
      });
      await tx.publicLotSlugRedirect.updateMany({
        where: { toSlug: row.old },
        data: { toSlug: row.next },
      });
      await tx.publicLotListing.update({
        where: { id: row.id },
        data: { slug: row.next },
      });
    });
    revalidate.push(`${PUBLIC_LISTING_PATH}/${row.old}`);
    revalidate.push(`${PUBLIC_LISTING_PATH}/${row.next}`);
  }

  await revalidatePaths(revalidate);
  console.log(`done changed=${planned.length} total=${rows.length} apply=1`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
