import { createHash } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { PUBLIC_SEO_IMAGE_EXT } from '@crmanhung/shared';
import type { StorageService } from '../../storage/storage.service';
import {
  fetchRemoteMessengerImage,
  isAllowedMessengerImageHost,
  parseMediaDataUrl,
  safeChatFileToken,
} from './messenger-image-ingest';

export const AVATAR_MAX_BYTES = 2_000_000;
const logger = new Logger('MessengerAvatarIngest');

export type StoredCustomerAvatar = {
  avatarUrl: string | null;
  avatarObjectKey: string | null;
  avatarSourceKey: string | null;
};

export type AvatarResolveResult = StoredCustomerAvatar & {
  changed: boolean;
  previousObjectKey: string | null;
};

export function avatarSourceKeyFromRawMeta(raw: string | null | undefined): string | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { avatarSourceKey?: unknown };
    const key = String(parsed?.avatarSourceKey ?? '').trim();
    return key || null;
  } catch {
    return null;
  }
}

/**
 * Stable Facebook CDN avatar identity: pathname only.
 * Hostname and `oh`/`oe`/`_nc_*` query params change per request.
 */
export function extractAvatarSourceKey(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  if (value.startsWith('/img/avatars/')) return null;
  if (value.startsWith('data:')) return null;
  if (!/^https?:\/\//i.test(value)) return null;
  try {
    const parsed = new URL(value);
    const pathname = parsed.pathname?.trim();
    return pathname || null;
  } catch {
    return null;
  }
}

export function extractAvatarLibraryKey(raw: string): string | null {
  const value = raw.trim();
  if (!value) return null;
  const pathOnly = value.replace(/^\/+/, '').split('?')[0] ?? '';
  if (pathOnly.startsWith('customers/avatars/') && !pathOnly.includes('..')) {
    return pathOnly;
  }
  try {
    const url = new URL(value);
    const path = url.pathname.replace(/^\/+/, '');
    if (path.startsWith('customers/avatars/') && !path.includes('..')) {
      return path;
    }
  } catch {
    return null;
  }
  return null;
}

export function avatarFileToken(sourceKey: string | null): string {
  if (!sourceKey) return 'avatar';
  return createHash('sha256').update(sourceKey).digest('hex').slice(0, 16);
}

export function customerAvatarObjectKey(customerId: string, sourceKey: string | null): string {
  const folder = safeChatFileToken(customerId, 48) || 'khach';
  return `customers/avatars/${folder}/${avatarFileToken(sourceKey)}${PUBLIC_SEO_IMAGE_EXT}`;
}

function keepStored(stored: StoredCustomerAvatar): AvatarResolveResult {
  return {
    avatarUrl: stored.avatarUrl,
    avatarObjectKey: stored.avatarObjectKey,
    avatarSourceKey: stored.avatarSourceKey,
    changed: false,
    previousObjectKey: null,
  };
}

function isAllowedRemoteAvatarUrl(raw: string): boolean {
  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') return false;
    return isAllowedMessengerImageHost(parsed.hostname);
  } catch {
    return false;
  }
}

export async function ingestMessengerAvatar(
  storage: StorageService,
  rawUrl: string,
  ctx: { customerId: string; sourceKey: string | null },
): Promise<string | null> {
  const value = rawUrl.trim();
  if (!value) return null;

  const existingKey = extractAvatarLibraryKey(value);
  if (existingKey) return existingKey;
  if (value.startsWith('/img/avatars/')) return null;

  let parsed: { buffer: Buffer; mime: string } | null = null;
  if (value.startsWith('data:')) {
    parsed = parseMediaDataUrl(value, AVATAR_MAX_BYTES);
  } else if (/^https?:\/\//i.test(value)) {
    parsed = await fetchRemoteMessengerImage(value, AVATAR_MAX_BYTES);
  }
  if (!parsed) return null;

  const objectKey = customerAvatarObjectKey(ctx.customerId, ctx.sourceKey);
  if (await storage.publicObjectExists(objectKey)) return objectKey;

  try {
    const uploaded = await storage.upload({
      folder: `customers/avatars/${ctx.customerId}`,
      buffer: parsed.buffer,
      contentType: parsed.mime,
      originalName: `avatar.jpg`,
      objectKey,
      contentFileName: objectKey.split('/').pop(),
    });
    return uploaded.objectKey;
  } catch (err) {
    logger.warn(`Avatar upload failed for ${objectKey}`, err as Error);
    return null;
  }
}

/**
 * Same rules as CRM cũ `resolveAvatarFromScan`: empty → keep; same FB pathname
 * + already on R2 → skip; else fetch → WebP → public R2. Fetch fail keeps the
 * previous R2 object, or stores the FB URL so the list can still show something.
 */
export async function resolveAvatarFromScan(
  storage: StorageService,
  incomingUrl: string,
  stored: StoredCustomerAvatar,
  customerId: string,
): Promise<AvatarResolveResult> {
  const incoming = incomingUrl.trim();
  if (!incoming) return keepStored(stored);

  const libraryKey = extractAvatarLibraryKey(incoming);
  if (libraryKey) {
    if (libraryKey === stored.avatarObjectKey) return keepStored(stored);
    return {
      avatarUrl: stored.avatarUrl,
      avatarObjectKey: libraryKey,
      avatarSourceKey: stored.avatarSourceKey,
      changed: true,
      previousObjectKey:
        stored.avatarObjectKey && stored.avatarObjectKey !== libraryKey
          ? stored.avatarObjectKey
          : null,
    };
  }

  if (incoming.startsWith('/img/avatars/')) return keepStored(stored);

  const newSourceKey = extractAvatarSourceKey(incoming);
  if (
    newSourceKey &&
    stored.avatarSourceKey &&
    newSourceKey === stored.avatarSourceKey &&
    stored.avatarObjectKey
  ) {
    return keepStored(stored);
  }

  const objectKey = await ingestMessengerAvatar(storage, incoming, {
    customerId,
    sourceKey: newSourceKey,
  });
  if (objectKey) {
    return {
      avatarUrl: stored.avatarUrl,
      avatarObjectKey: objectKey,
      avatarSourceKey: newSourceKey ?? stored.avatarSourceKey,
      changed: objectKey !== stored.avatarObjectKey || newSourceKey !== stored.avatarSourceKey,
      previousObjectKey:
        stored.avatarObjectKey && stored.avatarObjectKey !== objectKey
          ? stored.avatarObjectKey
          : null,
    };
  }

  if (stored.avatarObjectKey) return keepStored(stored);

  if (isAllowedRemoteAvatarUrl(incoming)) {
    return {
      avatarUrl: incoming.slice(0, 2000),
      avatarObjectKey: null,
      avatarSourceKey: newSourceKey,
      changed: incoming !== (stored.avatarUrl ?? ''),
      previousObjectKey: null,
    };
  }

  return keepStored(stored);
}
