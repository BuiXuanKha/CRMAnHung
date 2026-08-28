import { randomUUID } from 'node:crypto';
import {
  isSeoNamedImageKey,
  seoAddressImageObjectKey,
  seoImageExt,
  seoImageFileName,
  seoLotImageObjectKey,
} from '../public-content/public-slug';
import type { StorageService } from '../../storage/storage.service';

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
  const ext = seoImageExt(input.originalName, input.mime);
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
  const ext = seoImageExt(input.originalName, input.mime);
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

function alreadySeoUnder(prefix: string, objectKey: string): boolean {
  return isSeoNamedImageKey(objectKey) && objectKey.startsWith(`${prefix}/`);
}

export type SeoCopyPlan = {
  id: string;
  from: string;
  to: string;
  fileName: string;
};

/** Canonical SEO key for an existing object. Reuses dest if already copied (idempotent). */
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
  const prefix = `lodats/${dest.lodatId}`;
  if (alreadySeoUnder(prefix, row.objectKey)) return null;
  const ext = seoImageExt(row.objectKey, null);
  const fileName = seoImageFileName({
    title: dest.title,
    location: dest.location,
    index: dest.index,
    ext,
  });
  const to = seoLotImageObjectKey(dest.lodatId, fileName);
  if (to === row.objectKey) return null;
  return { id: row.id, from: row.objectKey, to, fileName };
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
  const prefix = `addresses/${dest.addressId}`;
  if (alreadySeoUnder(prefix, row.objectKey)) return null;
  const ext = seoImageExt(row.objectKey, null);
  const fileName = seoImageFileName({
    title: dest.title,
    location: dest.location,
    index: dest.index,
    ext,
  });
  const to = seoAddressImageObjectKey(dest.addressId, fileName);
  if (to === row.objectKey) return null;
  return { id: row.id, from: row.objectKey, to, fileName };
}

export async function applySeoImageCopy(
  storage: StorageService,
  plan: Pick<SeoCopyPlan, 'from' | 'to' | 'fileName'>,
): Promise<void> {
  if (plan.from === plan.to) return;
  const destExists = await storage.publicObjectExists(plan.to);
  if (destExists) return;
  try {
    await storage.copyPublicObject(plan.from, plan.to, plan.fileName);
  } catch {
    const src = await storage.getPublicObject(plan.from);
    if (!src) throw new Error(`Không đọc được ảnh ${plan.from}`);
    await storage.uploadPublicAtKey(plan.to, {
      buffer: src.buffer,
      contentType: src.contentType,
      contentFileName: plan.fileName,
    });
  }
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
