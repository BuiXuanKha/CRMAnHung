/**
 * Backfill sibling `….og.png` (1200×630) for lot / project cover WebP — Zalo/FB OG.
 * Gallery WebP untouched. Idempotent.
 *
 * Usage (VPS, from apps/api):
 *   pnpm images:og-jpg
 *   APPLY=1 SCOPE=published pnpm images:og-jpg
 *   APPLY=1 SLUGS=slug-a,slug-b LIMIT=3 pnpm images:og-jpg
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
    const val = t.slice(i + 1).replace(/^[\'"]|[\'"]$/g, '');
    if (process.env[key] == null) process.env[key] = val;
  }
}

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

const LODAT_SELECT = {
  id: true,
  title: true,
  projectLotId: true,
  images: {
    orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
    select: { objectKey: true },
  },
  address: {
    select: {
      images: {
        orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
        select: { objectKey: true },
      },
    },
  },
  projectLot: {
    select: {
      address: {
        select: {
          images: {
            orderBy: [{ sortOrder: 'asc' as const }, { createdAt: 'asc' as const }],
            select: { objectKey: true },
          },
        },
      },
    },
  },
} as const;

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env'));
  const apply = process.env.APPLY === '1';
  const scope = process.env.SCOPE === 'published' ? 'published' : 'all';
  const limitRaw = Number(process.env.LIMIT ?? '0');
  const limit = Number.isFinite(limitRaw) && limitRaw > 0 ? Math.floor(limitRaw) : 0;
  const slugFilter = new Set(
    (process.env.SLUGS ?? '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
  );

  const storage = new StorageService(new ConfigService());
  if (!storage.isConfigured()) {
    throw new Error('R2 chưa cấu hình (R2_ENDPOINT / keys / bucket / public URL).');
  }

  const listings = await prisma.publicLotListing.findMany({
    where: {
      ...(scope === 'published' || slugFilter.size ? { isPublished: true } : {}),
      ...(slugFilter.size ? { slug: { in: [...slugFilter] } } : {}),
    },
    select: { lodatId: true, slug: true },
  });
  const slugByLodat = new Map(listings.map((l) => [l.lodatId, l.slug]));

  if (slugFilter.size && listings.length === 0) {
    throw new Error(`Không thấy listing published cho SLUGS=${[...slugFilter].join(',')}`);
  }

  const rows = await prisma.lodat.findMany({
    where:
      slugFilter.size || scope === 'published'
        ? { id: { in: listings.map((l) => l.lodatId) } }
        : undefined,
    select: LODAT_SELECT,
  });

  let planned = 0;
  let wrote = 0;
  let skipped = 0;
  let missing = 0;
  const done: string[] = [];

  for (const row of rows) {
    if (limit && planned >= limit) break;
    const coverKey = coverObjectKey(row);
    if (!coverKey || !isWebpObjectKey(coverKey)) {
      skipped += 1;
      continue;
    }
    planned += 1;
    const slug = slugByLodat.get(row.id) ?? '';
    const label = `${slug || row.id} ${row.title?.slice(0, 40) ?? ''}`.trim();
    if (!apply) {
      console.log(`[dry-run] would ensure OG PNG for cover ${coverKey} (${label})`);
      continue;
    }
    const ogKey = await ensurePublicOgJpegForWebp(storage, coverKey);
    if (!ogKey) {
      missing += 1;
      console.warn(`[miss] no source WebP? ${coverKey}`);
      continue;
    }
    wrote += 1;
    done.push(slug || row.id);
    console.log(`[ok] ${ogKey}`);
  }

  console.log(
    JSON.stringify(
      {
        apply,
        scope,
        slugs: slugFilter.size ? [...slugFilter] : null,
        limit: limit || null,
        planned,
        wrote,
        skipped,
        missing,
        done,
        lodats: rows.length,
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
