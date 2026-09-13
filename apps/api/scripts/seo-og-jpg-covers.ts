/**
 * Backfill sibling `….og.jpg` for lot / project cover WebP (Zalo + Facebook OG).
 * Gallery WebP untouched. Idempotent.
 *
 * Usage (VPS, from apps/api):
 *   pnpm images:og-jpg
 *   APPLY=1 pnpm images:og-jpg
 *   APPLY=1 LIMIT=30 pnpm images:og-jpg
 *   APPLY=1 SCOPE=published pnpm images:og-jpg
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { isWebpObjectKey } from '@crmanhung/shared';
import { StorageService } from '../src/storage/storage.service';
import { ensurePublicOgJpegForWebp } from '../src/storage/ensure-public-og-jpeg';

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

/** Same cover order as guest listing: project address photos first, then lot photos. */
function coverObjectKey(row: {
  projectLotId: string | null;
  images: { objectKey: string }[];
  projectLot: { address: { images: { objectKey: string }[] } | null } | null;
  address: { images: { objectKey: string }[] } | null;
}): string | null {
  const addr =
    row.projectLotId && row.projectLot?.address ? row.projectLot.address : row.address;
  const keys = [
    ...(row.projectLotId && addr?.images ? addr.images.map((i) => i.objectKey) : []),
    ...row.images.map((i) => i.objectKey),
  ].filter(Boolean);
  return keys[0] ?? null;
}

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env'));
  const apply = process.env.APPLY === '1';
  const scope = process.env.SCOPE === 'published' ? 'published' : 'all';
  const limitRaw = Number(process.env.LIMIT ?? '0');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 0;

  const storage = new StorageService(new ConfigService());
  if (!storage.isConfigured()) {
    throw new Error('R2 chưa cấu hình (R2_ENDPOINT / keys / bucket / public URL).');
  }

  const publishedLodatIds =
    scope === 'published'
      ? new Set(
          (
            await prisma.publicLotListing.findMany({
              where: { isPublished: true },
              select: { lodatId: true },
            })
          ).map((r) => r.lodatId),
        )
      : null;

  const lodats = await prisma.lodat.findMany({
    where: publishedLodatIds ? { id: { in: [...publishedLodatIds] } } : undefined,
    select: {
      id: true,
      title: true,
      projectLotId: true,
      images: {
        orderBy: { sortOrder: 'asc' },
        select: { objectKey: true },
      },
      address: {
        select: {
          images: { orderBy: { sortOrder: 'asc' }, select: { objectKey: true } },
        },
      },
      projectLot: {
        select: {
          address: {
            select: {
              images: { orderBy: { sortOrder: 'asc' }, select: { objectKey: true } },
            },
          },
        },
      },
    },
  });

  let planned = 0;
  let wrote = 0;
  let skipped = 0;
  let missing = 0;

  for (const row of lodats) {
    if (limit && planned >= limit) break;
    const coverKey = coverObjectKey(row);
    if (!coverKey || !isWebpObjectKey(coverKey)) {
      skipped += 1;
      continue;
    }
    planned += 1;
    const label = `${row.id} ${row.title?.slice(0, 40) ?? ''}`.trim();
    if (!apply) {
      console.log(`[dry-run] would ensure OG JPEG for cover ${coverKey} (${label})`);
      continue;
    }
    const ogKey = await ensurePublicOgJpegForWebp(storage, coverKey);
    if (!ogKey) {
      missing += 1;
      console.warn(`[miss] no source WebP? ${coverKey}`);
      continue;
    }
    wrote += 1;
    console.log(`[ok] ${ogKey}`);
  }

  console.log(
    JSON.stringify(
      {
        apply,
        scope,
        limit: limit || null,
        planned,
        wrote,
        skipped,
        missing,
        lodats: lodats.length,
      },
      null,
      2,
    ),
  );
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
