import { randomUUID } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import {
  objectKeyMatchesSeoStem,
  PUBLIC_SEO_IMAGE_EXT,
  seoAddressImageObjectKey,
  seoImageFileName,
  seoImageObjectKeyNeedsRetarget,
  seoImageSlugStem,
  seoLotImageObjectKey,
} from '../public-content/public-slug';
import type { StorageService } from '../../storage/storage.service';
import { toPublicWebp } from '../../storage/to-public-webp';
import {
  deletePublicOgJpegForWebp,
  ensurePublicOgJpegForWebp,
} from '../../storage/ensure-public-og-jpeg';
import { countPublicImageKeyRefs } from '../../storage/retarget-public-key';

export async function uniqueSeoLotImageKey(
  storage: StorageService,
  input: {
    lodatId: string;
    title: string;
    location?: string | null;
    index: number;
    originalName?: string | null;
    mime?: string | null;
  },
): Promise<{ objectKey: string; fileName: string }> {
  const ext = PUBLIC_SEO_IMAGE_EXT;
  let suffix: string | undefined;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const fileName = seoImageFileName({
      title: input.title,
      location: input.location,
      index: input.index,
      ext,
      suffix,
    });
    const objectKey = seoLotImageObjectKey(input.lodatId, fileName);
    const taken = await storage.publicObjectExists(objectKey);
    if (!taken) return { objectKey, fileName };
    suffix = randomUUID().replace(/-/g, '').slice(0, 6);
  }
  const fileName = seoImageFileName({
    title: input.title,
    location: input.location,
    index: input.index,
    ext,
    suffix: randomUUID().replace(/-/g, '').slice(0, 8),
  });
  return { objectKey: seoLotImageObjectKey(input.lodatId, fileName), fileName };
}

export async function uniqueSeoAddressImageKey(
  storage: StorageService,
  input: {
    addressId: string;
    title: string;
    location?: string | null;
    index: number;
    originalName?: string | null;
    mime?: string | null;
  },
): Promise<{ objectKey: string; fileName: string }> {
  const ext = PUBLIC_SEO_IMAGE_EXT;
  let suffix: string | undefined;
  for (let attempt = 0; attempt < 6; attempt += 1) {
    const fileName = seoImageFileName({
      title: input.title,
      location: input.location,
      index: input.index,
      ext,
      suffix,
    });
    const objectKey = seoAddressImageObjectKey(input.addressId, fileName);
    const taken = await storage.publicObjectExists(objectKey);
    if (!taken) return { objectKey, fileName };
    suffix = randomUUID().replace(/-/g, '').slice(0, 6);
  }
  const fileName = seoImageFileName({
    title: input.title,
    location: input.location,
    index: input.index,
    ext,
    suffix: randomUUID().replace(/-/g, '').slice(0, 8),
  });
  return { objectKey: seoAddressImageObjectKey(input.addressId, fileName), fileName };
}

/** Messenger originals (WebP from extension, JPEG from migrate) — keep on R2. */
export function isChatLibraryObjectKey(objectKey: string): boolean {
  return objectKey.replace(/^\/+/, '').startsWith('customers/chat/');
}

/** Filename stem for project-address photos: Address.detail + ward/district/province. */
export function projectAddressSeoFields(addr: {
  detail?: string | null;
  ward?: { name: string; isHidden?: boolean } | null;
  district?: { name: string; isHidden?: boolean } | null;
  province?: { name: string; isHidden?: boolean } | null;
}): { title: string; location: string } {
  const title = addr.detail?.trim() || 'du-an';
  const location = [
    addr.ward && !addr.ward.isHidden ? addr.ward.name : null,
    addr.district && !addr.district.isHidden ? addr.district.name : null,
    addr.province && !addr.province.isHidden ? addr.province.name : null,
  ]
    .filter((part): part is string => Boolean(part))
    .join(', ');
  return { title, location };
}

export type SeoCopyPlan = {
  id: string;
  from: string;
  to: string;
  fileName: string;
};

/**
 * Canonical SEO key for an existing object.
 * Skip only when the file is already the desired key (or a unique suffix of the
 * same title+location stem). A `*-anh-n.webp` with an *old* slug still copies.
 */
export async function planSeoLotImageCopy(
  storage: StorageService,
  row: { id: string; objectKey: string },
  dest: {
    lodatId: string;
    title: string;
    location?: string | null;
    index: number;
  },
): Promise<SeoCopyPlan | null> {
  const fileName = seoImageFileName({
    title: dest.title,
    location: dest.location,
    index: dest.index,
    ext: PUBLIC_SEO_IMAGE_EXT,
  });
  const to = seoLotImageObjectKey(dest.lodatId, fileName);
  if (!seoImageObjectKeyNeedsRetarget(row.objectKey, to)) return null;

  const destTaken = await storage.publicObjectExists(to);
  if (!destTaken) {
    return { id: row.id, from: row.objectKey, to, fileName };
  }

  const stem = seoImageSlugStem(dest.title, dest.location);
  if (objectKeyMatchesSeoStem(row.objectKey, stem)) return null;

  const unique = await uniqueSeoLotImageKey(storage, {
    lodatId: dest.lodatId,
    title: dest.title,
    location: dest.location,
    index: dest.index,
  });
  if (!seoImageObjectKeyNeedsRetarget(row.objectKey, unique.objectKey)) return null;
  return {
    id: row.id,
    from: row.objectKey,
    to: unique.objectKey,
    fileName: unique.fileName,
  };
}

export async function planSeoAddressImageCopy(
  storage: StorageService,
  row: { id: string; objectKey: string },
  dest: {
    addressId: string;
    title: string;
    location?: string | null;
    index: number;
  },
): Promise<SeoCopyPlan | null> {
  if (isChatLibraryObjectKey(row.objectKey)) return null;
  const fileName = seoImageFileName({
    title: dest.title,
    location: dest.location,
    index: dest.index,
    ext: PUBLIC_SEO_IMAGE_EXT,
  });
  const to = seoAddressImageObjectKey(dest.addressId, fileName);
  if (!seoImageObjectKeyNeedsRetarget(row.objectKey, to)) return null;

  const destTaken = await storage.publicObjectExists(to);
  if (!destTaken) {
    return { id: row.id, from: row.objectKey, to, fileName };
  }

  const stem = seoImageSlugStem(dest.title, dest.location);
  if (objectKeyMatchesSeoStem(row.objectKey, stem)) return null;

  const unique = await uniqueSeoAddressImageKey(storage, {
    addressId: dest.addressId,
    title: dest.title,
    location: dest.location,
    index: dest.index,
  });
  if (!seoImageObjectKeyNeedsRetarget(row.objectKey, unique.objectKey)) return null;
  return {
    id: row.id,
    from: row.objectKey,
    to: unique.objectKey,
    fileName: unique.fileName,
  };
}

/** Copy/move lodat photos onto `{title+location}-anh-n.webp` after create/edit. */
export async function retargetLodatSeoImages(
  db: PrismaClient,
  storage: StorageService,
  input: {
    lodatId: string;
    title: string;
    location?: string | null;
    images: { id: string; objectKey: string }[];
  },
): Promise<number> {
  if (!storage.isConfigured() || !input.images.length) return 0;
  let moved = 0;
  const keysAfter: string[] = [];
  for (let i = 0; i < input.images.length; i += 1) {
    const img = input.images[i]!;
    const plan = await planSeoLotImageCopy(storage, img, {
      lodatId: input.lodatId,
      title: input.title,
      location: input.location,
      index: i + 1,
    });
    if (!plan) {
      keysAfter.push(img.objectKey);
      continue;
    }
    await applySeoImageMove(db, storage, plan, 'lodat');
    keysAfter.push(plan.to);
    moved += 1;
  }
  // Cover (first gallery key) always gets an OG JPEG for social scrapers.
  if (keysAfter[0]) {
    await ensurePublicOgJpegForWebp(storage, keysAfter[0]);
  }
  return moved;
}

export async function applySeoImageCopy(
  storage: StorageService,
  plan: Pick<SeoCopyPlan, 'from' | 'to' | 'fileName'>,
): Promise<void> {
  if (plan.from !== plan.to) {
    const destExists = await storage.publicObjectExists(plan.to);
    if (!destExists) {
      const src = await storage.getPublicObject(plan.from);
      if (!src) throw new Error(`Không đọc được ảnh ${plan.from}`);
      let buffer = src.buffer;
      let contentType = src.contentType;
      try {
        const webp = await toPublicWebp(src.buffer);
        buffer = webp.buffer;
        contentType = webp.contentType;
      } catch (err) {
        throw new Error(
          `Không chuyển được ảnh ${plan.from} sang WebP${err instanceof Error ? `: ${err.message}` : ''}`,
        );
      }
      await storage.uploadPublicAtKey(plan.to, {
        buffer,
        contentType,
        contentFileName: plan.fileName,
      });
    }
  }
  // Gallery stays WebP; sibling .og.jpg is for Facebook/Zalo link preview only.
  await ensurePublicOgJpegForWebp(storage, plan.to);
}

/**
 * Copy to SEO key, retarget this row (+ transaction snapshots), then delete the
 * source object when nothing in DB still points at it (chat originals stay).
 */
export async function applySeoImageMove(
  db: PrismaClient,
  storage: StorageService,
  plan: SeoCopyPlan,
  kind: 'lodat' | 'address',
): Promise<{ deletedSource: boolean }> {
  await applySeoImageCopy(storage, plan);
  if (kind === 'lodat') {
    await db.lodatImage.update({
      where: { id: plan.id },
      data: { objectKey: plan.to },
    });
  } else {
    await db.addressImage.update({
      where: { id: plan.id },
      data: { objectKey: plan.to },
    });
  }
  // Same chat file can be on two lots — only retarget snapshots of *this* lodat image.
  const fromChat = isChatLibraryObjectKey(plan.from);
  await db.transactionSnapshotImage.updateMany({
    where: fromChat ? { sourceLodatImageId: plan.id } : { objectKey: plan.from },
    data: { objectKey: plan.to },
  });
  if (fromChat) return { deletedSource: false };
  const leftover = await countPublicImageKeyRefs(db, plan.from);
  if (leftover === 0 && plan.from !== plan.to) {
    await storage.delete(plan.from, 'public');
    await deletePublicOgJpegForWebp(storage, plan.from);
    return { deletedSource: true };
  }
  return { deletedSource: false };
}

export async function copyPublicImageToSeoLotKey(
  storage: StorageService,
  sourceKey: string,
  dest: {
    lodatId: string;
    title: string;
    location?: string | null;
    index: number;
  },
): Promise<string> {
  const plan = await planSeoLotImageCopy(
    storage,
    { id: 'tmp', objectKey: sourceKey },
    dest,
  );
  if (!plan) return sourceKey;
  await applySeoImageCopy(storage, plan);
  return plan.to;
}
