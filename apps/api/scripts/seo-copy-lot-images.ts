/**
 * Copy lot / project-address photos to SEO CDN filenames.
 * Chat-sourced lot photos: copy to lodats/ SEO key, **keep** customers/chat/ original.
 *
 * Default: dry-run, **all** CRM lots.
 *
 * Usage (VPS, from apps/api):
 *   pnpm images:seo-copy
 *   APPLY=1 pnpm images:seo-copy
 *   APPLY=1 LIMIT=30 pnpm images:seo-copy
 *   APPLY=1 SCOPE=published pnpm images:seo-copy
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../src/storage/storage.service';
import {
  applySeoImageMove,
  isChatLibraryObjectKey,
  planSeoAddressImageCopy,
  planSeoLotImageCopy,
  projectAddressSeoFields,
} from '../src/modules/lodats/lodat-seo-image-upload';

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

function formatAddress(addr: {
  detail: string | null;
  ward?: { name: string; isHidden: boolean } | null;
  district?: { name: string; isHidden: boolean } | null;
  province?: { name: string; isHidden: boolean } | null;
} | null): string {
  if (!addr) return '';
  return [
    addr.detail?.trim() || null,
    addr.ward && !addr.ward.isHidden ? addr.ward.name : null,
    addr.district && !addr.district.isHidden ? addr.district.name : null,
    addr.province && !addr.province.isHidden ? addr.province.name : null,
  ]
    .filter(Boolean)
    .join(', ');
}

const ADDR_INCLUDE = {
  detail: true,
  ward: { select: { name: true, isHidden: true } },
  district: { select: { name: true, isHidden: true } },
  province: { select: { name: true, isHidden: true } },
} as const;

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

  const listings = await prisma.publicLotListing.findMany({
    where: scope === 'published' ? { isPublished: true } : undefined,
    select: { lodatId: true, title: true, location: true, isPublished: true },
  });
  const publishedLodatIds = new Set(
    listings.filter((r) => r.isPublished).map((r) => r.lodatId),
  );

  const lodats = await prisma.lodat.findMany({
    where: scope === 'published' ? { id: { in: [...publishedLodatIds] } } : undefined,
    include: {
      address: { select: ADDR_INCLUDE },
      projectLot: { include: { address: { select: { id: true, ...ADDR_INCLUDE } } } },
      images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  let planned = 0;
  let moved = 0;
  let deleted = 0;
  let skipped = 0;
  let fromChat = 0;
  const seenAddress = new Set<string>();
  let hitLimit = false;

  console.log(
    `seo-copy-lot-images scope=${scope} apply=${apply} limit=${limit || 'none'} lodats=${lodats.length}`,
  );

  for (const lodat of lodats) {
    const listing =
      listings.find((l) => l.lodatId === lodat.id && l.isPublished) ||
      listings.find((l) => l.lodatId === lodat.id);
    const isProject = Boolean(lodat.projectLotId);
    const title =
      listing?.title?.trim() ||
      (isProject ? lodat.projectLot?.title : lodat.title)?.trim() ||
      lodat.title?.trim() ||
      lodat.projectLot?.title?.trim() ||
      'Lô đất';
    const location =
      listing?.location?.trim() ||
      formatAddress(
        lodat.projectLotId && lodat.projectLot?.address
          ? lodat.projectLot.address
          : lodat.address,
      );

    for (let i = 0; i < lodat.images.length; i += 1) {
      const img = lodat.images[i]!;
      const plan = await planSeoLotImageCopy(storage, img, {
        lodatId: lodat.id,
        title,
        location,
        index: i + 1,
      });
      if (!plan) {
        skipped += 1;
        continue;
      }
      if (apply && limit > 0 && planned >= limit) {
        hitLimit = true;
        break;
      }
      planned += 1;
      if (isChatLibraryObjectKey(plan.from)) fromChat += 1;
      console.log(`${apply ? 'MOVE' : 'DRY'} lodat ${lodat.id} ${plan.from} -> ${plan.to}`);
      if (!apply) continue;
      const result = await applySeoImageMove(prisma, storage, plan, 'lodat');
      moved += 1;
      if (result.deletedSource) deleted += 1;
    }
    if (hitLimit) break;

    const addr = lodat.projectLot?.address;
    if (!addr?.id) continue;
    if (seenAddress.has(addr.id)) continue;
    seenAddress.add(addr.id);

    const addrImages = await prisma.addressImage.findMany({
      where: { addressId: addr.id },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });
    for (let i = 0; i < addrImages.length; i += 1) {
      const img = addrImages[i]!;
      if (isChatLibraryObjectKey(img.objectKey)) continue;
      const project = projectAddressSeoFields(addr);
      const plan = await planSeoAddressImageCopy(storage, img, {
        addressId: addr.id,
        title: project.title,
        location: project.location,
        index: i + 1,
      });
      if (!plan) {
        skipped += 1;
        continue;
      }
      if (apply && limit > 0 && planned >= limit) {
        hitLimit = true;
        break;
      }
      planned += 1;
      console.log(`${apply ? 'MOVE' : 'DRY'} address ${addr.id} ${plan.from} -> ${plan.to}`);
      if (!apply) continue;
      const result = await applySeoImageMove(prisma, storage, plan, 'address');
      moved += 1;
      if (result.deletedSource) deleted += 1;
    }
  }

  console.log(
    `done planned=${planned} moved=${moved} deletedSource=${deleted} alreadySeo=${skipped} fromChat=${fromChat} apply=${apply} hitLimit=${hitLimit}`,
  );
  if (!apply && planned > 0) {
    console.log(
      'Chạy APPLY=1 — copy ảnh lô/dự án sang tên SEO. File chat gốc giữ nguyên.',
    );
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
