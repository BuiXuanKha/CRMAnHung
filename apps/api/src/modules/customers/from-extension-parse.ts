import type { FromExtensionDraft } from '@crmanhung/shared';
import { isStableMessengerMessageId } from './messenger-image-ingest';

export const MAX_MESSAGES = 200;
export const MAX_IMAGES_PER_MESSAGE = 12;

const MESSAGE_SENDERS = new Set(['customer', 'me', 'page', 'unknown']);

export type ScanFields = {
  threadId: string;
  customerUid: string;
  customerName: string;
  scanSource: string;
  scanSourceLabel: string;
  employeeUid: string;
  pageUrl: string;
  rawMeta: string | null;
  messages: FromExtensionDraft['chatMessages'];
};

export type ExistingMessage = {
  id: string;
  externalMessageId: string | null;
  dedupeKey: string | null;
  sender: string | null;
  body: string | null;
  sortOrder: number;
  images: { objectKey: string }[];
};

export function trimText(value: unknown): string {
  return String(value ?? '').trim();
}

/** Keep existing rawMeta keys (pageUrl, assetId, …) and stamp the latest inbox URL. */
export function mergeFacebookRawMeta(
  existing: string | null | undefined,
  pageUrl?: string | null,
): string | null {
  let obj: Record<string, unknown> = {};
  if (existing?.trim()) {
    try {
      const parsed = JSON.parse(existing) as unknown;
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        obj = { ...(parsed as Record<string, unknown>) };
      }
    } catch {
      obj = {};
    }
  }
  const url = trimText(pageUrl);
  if (url) obj.pageUrl = url;
  if (!Object.keys(obj).length) return existing?.trim() || null;
  return JSON.stringify(obj).slice(0, 8000);
}

export function parseScan(draft: FromExtensionDraft): ScanFields {
  const scan = draft.scan ?? {};
  const scanSource = trimText(draft.scanSource || scan.scanSource) || 'unknown';
  const threadId = trimText(scan.threadId);
  const rawUid = trimText(scan.customerUid);
  const isE2ee = scanSource === 'messenger_e2ee';
  let rawMeta: string | null = null;
  if (scan.scanDebug != null) {
    try {
      rawMeta = JSON.stringify(scan.scanDebug).slice(0, 8000);
    } catch {
      rawMeta = null;
    }
  }
  return {
    scanSource,
    scanSourceLabel: trimText(draft.scanSourceLabel),
    customerName: trimText(scan.customerName),
    customerUid: isE2ee ? rawUid : rawUid || threadId,
    threadId,
    employeeUid: trimText(scan.employeeUid) || trimText(scan.myPageUid),
    pageUrl: trimText(draft.pageUrl),
    rawMeta,
    messages: draft.chatMessages,
  };
}

export function toSender(raw: string): string {
  const v = raw.trim();
  if (MESSAGE_SENDERS.has(v)) return v;
  return 'unknown';
}

export function isPlaceholder(text: string): boolean {
  return text === '[Đính kèm]' || text === '[Ảnh]' || text === '[Video]';
}

export function messageStorageKey(input: {
  id?: string;
  dedupeKey?: string;
  sender?: string;
  text?: string;
}): string {
  const id = trimText(input.id);
  if (isStableMessengerMessageId(id)) return `mid:${id}`;
  const dedupe = trimText(input.dedupeKey);
  if (dedupe) return dedupe;
  return `${id || 'no-id'}::${trimText(input.sender)}::${trimText(input.text)}`;
}

export function fullNameSeed(fields: ScanFields): string {
  if (fields.customerName) return fields.customerName.slice(0, 120);
  if (fields.customerUid) return `Khách ${fields.customerUid}`.slice(0, 120);
  if (fields.threadId) return `Khách ${fields.threadId}`.slice(0, 120);
  return 'Khách mới';
}

export function incomingImageUrls(msg: { imageUrls?: string[] }): string[] {
  return (msg.imageUrls ?? [])
    .map((v) => trimText(v))
    .filter(Boolean)
    .slice(0, MAX_IMAGES_PER_MESSAGE);
}

export function originalPathHint(raw: string | undefined): string | null {
  const value = trimText(raw);
  if (!value) return null;
  if (value.startsWith('data:')) return 'data:image';
  return value.slice(0, 500);
}
