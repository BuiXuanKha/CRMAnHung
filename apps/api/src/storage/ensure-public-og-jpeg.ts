import { basename } from 'node:path';
import { publicOgJpegObjectKeyFromWebp } from '@crmanhung/shared';
import type { StorageService } from './storage.service';
import { toPublicOgJpeg } from './to-public-webp';

/**
 * Ensure a sibling `….og.jpg` exists for a gallery WebP (social OG / Twitter).
 * Idempotent — skips when the JPEG is already on R2.
 */
export async function ensurePublicOgJpegForWebp(
  storage: StorageService,
  webpObjectKey: string,
): Promise<string | null> {
  if (!storage.isConfigured()) return null;
  const ogKey = publicOgJpegObjectKeyFromWebp(webpObjectKey);
  if (!ogKey) return null;
  if (await storage.publicObjectExists(ogKey)) return ogKey;

  const src = await storage.getPublicObject(webpObjectKey);
  if (!src?.buffer?.length) return null;

  const jpeg = await toPublicOgJpeg(src.buffer);
  await storage.uploadPublicAtKey(ogKey, {
    buffer: jpeg.buffer,
    contentType: jpeg.contentType,
    contentFileName: basename(ogKey),
  });
  return ogKey;
}

/** Best-effort delete of the sibling OG JPEG when its WebP source is removed. */
export async function deletePublicOgJpegForWebp(
  storage: StorageService,
  webpObjectKey: string,
): Promise<void> {
  const ogKey = publicOgJpegObjectKeyFromWebp(webpObjectKey);
  if (!ogKey || !storage.isConfigured()) return;
  try {
    await storage.delete(ogKey, 'public');
  } catch {
    // orphan ok
  }
}
