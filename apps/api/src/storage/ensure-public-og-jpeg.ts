import { basename } from 'node:path';
import { publicOgJpegObjectKeyFromWebp } from '@crmanhung/shared';
import type { StorageService } from './storage.service';
import { toPublicOgPng } from './to-public-webp';

/**
 * Ensure a sibling `….og.png` exists for a gallery WebP (social OG / Twitter).
 * Idempotent — skips when the PNG is already on R2 unless FORCE=1.
 */
export async function ensurePublicOgJpegForWebp(
  storage: StorageService,
  webpObjectKey: string,
): Promise<string | null> {
  if (!storage.isConfigured()) return null;
  const ogKey = publicOgJpegObjectKeyFromWebp(webpObjectKey);
  if (!ogKey) return null;
  const force = process.env.FORCE === '1';
  if (!force && (await storage.publicObjectExists(ogKey))) return ogKey;

  const src = await storage.getPublicObject(webpObjectKey);
  if (!src?.buffer?.length) return null;

  const png = await toPublicOgPng(src.buffer);
  await storage.uploadPublicAtKey(ogKey, {
    buffer: png.buffer,
    contentType: png.contentType,
    contentFileName: basename(ogKey),
  });
  return ogKey;
}

/** Best-effort delete of the sibling OG PNG when its WebP source is removed. */
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
