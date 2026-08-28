/**
 * Copy existing lot / project-address photos to SEO CDN filenames.
 * Does NOT delete source keys (chat + old Google URLs keep working).
 *
 * Default: dry-run, published listings only.
 *
 * Usage (VPS, from apps/api):
 *   pnpm images:seo-copy
 *   APPLY=1 pnpm images:seo-copy
 *   APPLY=1 SCOPE=all pnpm images:seo-copy
 */
import { existsSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { StorageService } from '../src/storage/storage.service';
import {
  applySeoImageCopy,
  planSeoAddressImageCopy,
  planSeoLotImageCopy,
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
  const scope = process.env.SCOPE === 'all' ? 'all' : 'published';
  const storage = new StorageService(new ConfigService());
  if (!storage.isConfigured()) {
    throw new Error('R2 chưa cấu hình (R2_ENDPOINT / keys / bucket / public URL).');
  }

  const listings =
    scope === 'published'
      ? await prisma.publicLotListing.findMany({
          where: { isPublished: true },
          select: { lodatId: true, title: true, location: true },
        })
      : [];
  const publishedLodatIds = new Set(listings.map((r) => r.lodatId));

  const lodats = await prisma.lodat.findMany({
    where: scope === 'published' ? { id: { in: [...publishedLodatIds] } } : undefined,
    include: {
      address: { select: ADDR_INCLUDE },
      projectLot: { include: { address: { select: { id: true, ...ADDR_INCLUDE } } } },
      images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  let planned = 0;
  let copied = 0;
  let skipped = 0;
  const seenAddress = new Set<string>();

  console.log(`seo-copy-lot-images scope=${scope} apply=${apply} lodats=${lodats.length}`);

  for (const lodat of lodats) {
    const listing = listings.find((l) => l.lodatId === lodat.id);
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
      planned += 1;
      console.log(`${apply ? 'COPY' : 'DRY'} lodat ${lodat.id} ${plan.from} -> ${plan.to}`);
      if (!apply) continue;
      await applySeoImageCopy(storage, plan);
      await prisma.lodatImage.update({
        where: { id: plan.id },
        data: { objectKey: plan.to },
      });
      copied += 1;
    }

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
      const plan = await planSeoAddressImageCopy(storage, img, {
        addressId: addr.id,
        title: lodat.projectLot?.title?.trim() || addr.detail?.trim() || title,
        location,
        index: i + 1,
      });
      if (!plan) {
        skipped += 1;
        continue;
      }
      planned += 1;
      console.log(`${apply ? 'COPY' : 'DRY'} address ${addr.id} ${plan.from} -> ${plan.to}`);
      if (!apply) continue;
      await applySeoImageCopy(storage, plan);
      await prisma.addressImage.update({
        where: { id: plan.id },
        data: { objectKey: plan.to },
      });
      copied += 1;
    }
  }

  console.log(
    `done planned=${planned} copied=${copied} alreadySeo=${skipped} apply=${apply}`,
  );
  if (!apply && planned > 0) {
    console.log('Chạy lại với APPLY=1 để copy R2 + cập nhật DB. Không xóa file cũ.');
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
