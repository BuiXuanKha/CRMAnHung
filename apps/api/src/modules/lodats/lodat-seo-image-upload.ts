import { randomUUID } from 'node:crypto';
import {
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
  const src = await storage.getPublicObject(sourceKey);
  if (!src) return sourceKey;
  const { objectKey, fileName } = await uniqueSeoLotImageKey(storage, {
    ...dest,
    originalName: sourceKey,
    mime: src.contentType,
  });
  await storage.uploadPublicAtKey(objectKey, {
    buffer: src.buffer,
    contentType: src.contentType,
    contentFileName: fileName,
  });
  return objectKey;
}
