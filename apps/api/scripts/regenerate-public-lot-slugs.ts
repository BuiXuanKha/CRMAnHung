/**
 * Idempotent: đặt lại slug PublicLotListing = tên + địa chỉ; ghi redirect 301.
 * Chạy trên VPS sau prisma migrate (remote_deploy.sh).
 */
import { PrismaClient } from '@prisma/client';
import { toListingPublicSlug } from '../src/modules/public-content/public-slug';

const prisma = new PrismaClient();

async function uniqueSlug(base: string, excludeId: string): Promise<string> {
  let slug = base || 'lo-dat';
  let n = 2;
  for (;;) {
    const hit = await prisma.publicLotListing.findUnique({ where: { slug } });
    if (!hit || hit.id === excludeId) return slug;
    slug = `${base.slice(0, 72)}-${n}`;
    n += 1;
  }
}

async function main() {
  const rows = await prisma.publicLotListing.findMany({
    orderBy: { createdAt: 'asc' },
  });
  let changed = 0;
  for (const row of rows) {
    const desired = toListingPublicSlug(row.title, row.location);
    const next = await uniqueSlug(desired, row.id);
    if (next === row.slug) {
      console.log(`ok ${row.slug}`);
      continue;
    }
    const old = row.slug;
    await prisma.$transaction(async (tx) => {
      await tx.publicLotSlugRedirect.deleteMany({ where: { fromSlug: next } });
      await tx.publicLotSlugRedirect.upsert({
        where: { fromSlug: old },
        create: { fromSlug: old, toSlug: next },
        update: { toSlug: next },
      });
      await tx.publicLotSlugRedirect.updateMany({
        where: { toSlug: old },
        data: { toSlug: next },
      });
      await tx.publicLotListing.update({
        where: { id: row.id },
        data: { slug: next },
      });
    });
    changed += 1;
    console.log(`${old} -> ${next}`);
  }
  console.log(`done changed=${changed} total=${rows.length}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
