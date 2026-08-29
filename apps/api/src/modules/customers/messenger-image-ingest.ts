import { Logger } from '@nestjs/common';
import { PUBLIC_SEO_IMAGE_EXT } from '@crmanhung/shared';
import type { StorageService } from '../../storage/storage.service';
import { isPublicRasterImage } from '../../storage/to-public-webp';

export const CHAT_IMAGE_MAX_BYTES = 4_000_000;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_REDIRECTS = 8;

const logger = new Logger('MessengerImageIngest');

export function isStableMessengerMessageId(messageId: string): boolean {
  const v = messageId.trim();
  return /^mid\./i.test(v) || /^\d+@msgr\./i.test(v);
}

export function safeChatFileToken(value: string, maxLen = 56): string {
  const token = value.replace(/[^a-zA-Z0-9._-]+/g, '_').replace(/^_+|_+$/g, '');
  return (token || 'msg').slice(0, maxLen);
}

export function chatImageObjectKey(
  customerId: string,
  messageId: string,
  sortOrder: number,
  imageIndex: number,
): string {
  const folder = customerId.replace(/[^a-zA-Z0-9_-]/g, '') || 'khach';
  const base = `${safeChatFileToken(messageId)}-${sortOrder}-${imageIndex}`;
  return `customers/chat/${folder}/${base}${PUBLIC_SEO_IMAGE_EXT}`;
}

export function extractChatLibraryKey(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const pathOnly = value.replace(/^\/+/, '').split('?')[0] ?? '';
  if (pathOnly.startsWith('customers/chat/') && !pathOnly.includes('..')) {
    return pathOnly;
  }
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/^\/+/, '');
    if (path.startsWith('customers/chat/') && !path.includes('..')) {
      return path;
    }
  } catch {
    return null;
  }
  return null;
}

export function parseMediaDataUrl(dataUrl: string): { buffer: Buffer; mime: string } | null {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/i.exec(dataUrl.trim());
  if (!match) return null;
  const mime = match[1].toLowerCase();
  const buffer = Buffer.from(match[2], 'base64');
  if (!buffer.length || buffer.length > CHAT_IMAGE_MAX_BYTES) return null;
  if (!isPublicRasterImage(mime, null)) return null;
  return { buffer, mime };
}

export function isAllowedMessengerImageHost(hostname: string): boolean {
  const h = hostname.toLowerCase();
  if (!h || h === 'localhost' || h === '127.0.0.1' || h.endsWith('.local')) {
    return false;
  }
  return (
    h === 'facebook.com' ||
    h.endsWith('.facebook.com') ||
    h.endsWith('.fbcdn.net') ||
    h.endsWith('.fb.net') ||
    h.endsWith('.fbsbx.com')
  );
}

async function fetchRemoteImageBuffer(
  remoteUrl: string,
): Promise<{ buffer: Buffer; mime: string } | null> {
  let url = remoteUrl;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop += 1) {
    let parsed: URL;
    try {
      parsed = new URL(url);
    } catch {
      return null;
    }
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return null;
    if (!isAllowedMessengerImageHost(parsed.hostname)) return null;

    const controller = new AbortController();
    const kill = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    try {
      const res = await fetch(url, {
        redirect: 'manual',
        signal: controller.signal,
        headers: {
          'User-Agent': 'CRMAnHung-messenger-image/1.0',
          Accept: 'image/*,*/*;q=0.8',
        },
      });
      if (res.status >= 300 && res.status < 400) {
        const loc = res.headers.get('location');
        if (!loc) return null;
        url = new URL(loc, parsed.href).href;
        continue;
      }
      if (!res.ok) return null;
      const contentType = (res.headers.get('content-type') || '')
        .split(';')[0]
        .trim()
        .toLowerCase();
      if (!contentType.startsWith('image/')) return null;
      const buffer = Buffer.from(await res.arrayBuffer());
      if (!buffer.length || buffer.length > CHAT_IMAGE_MAX_BYTES) return null;
      if (!isPublicRasterImage(contentType, null)) return null;
      return { buffer, mime: contentType };
    } catch {
      return null;
    } finally {
      clearTimeout(kill);
    }
  }
  return null;
}

/** Raster → WebP via StorageService.upload. Reuses customers/chat/ keys; skips legacy disk paths. */
export async function ingestMessengerChatImage(
  storage: StorageService,
  rawUrl: string,
  ctx: { customerId: string; messageId: string; sortOrder: number; imageIndex: number },
): Promise<string | null> {
  const value = rawUrl.trim();
  if (!value) return null;

  const existingKey = extractChatLibraryKey(value);
  if (existingKey) return existingKey;
  if (value.startsWith('/img/imgsmessenger/')) return null;

  let parsed: { buffer: Buffer; mime: string } | null = null;
  if (value.startsWith('data:')) {
    parsed = parseMediaDataUrl(value);
  } else if (/^https?:\/\//i.test(value)) {
    parsed = await fetchRemoteImageBuffer(value);
  }
  if (!parsed) return null;

  const objectKey = chatImageObjectKey(
    ctx.customerId,
    ctx.messageId,
    ctx.sortOrder,
    ctx.imageIndex,
  );
  if (await storage.publicObjectExists(objectKey)) return objectKey;

  try {
    const uploaded = await storage.upload({
      folder: `customers/chat/${ctx.customerId}`,
      buffer: parsed.buffer,
      contentType: parsed.mime,
      originalName: `${safeChatFileToken(ctx.messageId)}.jpg`,
      objectKey,
      contentFileName: objectKey.split('/').pop(),
    });
    return uploaded.objectKey;
  } catch (err) {
    logger.warn(`Chat image upload failed for ${objectKey}`, err as Error);
    return null;
  }
}
