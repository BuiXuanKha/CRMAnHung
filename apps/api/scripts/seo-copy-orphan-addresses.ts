/**
 * Move leftover **project-address** photos (no Lodat on /lo-dat) to SEO keys
 * named from the project (Address.detail), not the lot number.
 *
 * Usage (VPS, apps/api):
 *   pnpm images:seo-copy-addresses
 *   APPLY=1 pnpm images:seo-copy-addresses
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

async function main() {
  loadDotEnv(path.join(process.cwd(), '.env'));
  const apply = process.env.APPLY === '1';
  const storage = new StorageService(new ConfigService());
  if (!storage.isConfigured()) {
    throw new Error('R2 chưa cấu hình (R2_ENDPOINT / keys / bucket / public URL).');
  }

  const addresses = await prisma.address.findMany({
    where: { kind: 'PROJECT', images: { some: {} } },
    select: {
      id: true,
      detail: true,
      ward: { select: { name: true, isHidden: true } },
      district: { select: { name: true, isHidden: true } },
      province: { select: { name: true, isHidden: true } },
      images: { orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }] },
    },
  });

  let planned = 0;
  let moved = 0;
  let deleted = 0;
  let skipped = 0;
  let skippedChat = 0;

  console.log(`seo-copy-orphan-addresses apply=${apply} projects=${addresses.length}`);

  for (const addr of addresses) {
    const { title, location } = projectAddressSeoFields(addr);
    for (let i = 0; i < addr.images.length; i += 1) {
      const img = addr.images[i]!;
      if (isChatLibraryObjectKey(img.objectKey)) {
        skippedChat += 1;
        continue;
      }
      const plan = await planSeoAddressImageCopy(storage, img, {
        addressId: addr.id,
        title,
        location,
        index: i + 1,
      });
      if (!plan) {
        skipped += 1;
        continue;
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
    `done planned=${planned} moved=${moved} deletedSource=${deleted} alreadySeo=${skipped} skippedChat=${skippedChat} apply=${apply}`,
  );
  if (!apply && planned > 0) {
    console.log('Chạy APPLY=1 — tên file = tên dự án. Không đụng lodats/ hay chat.');
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
