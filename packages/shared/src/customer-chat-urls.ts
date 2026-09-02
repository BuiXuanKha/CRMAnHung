/**
 * URLs for menu «Mở chat» / «Mở Messenger» — same rules as CRM cũ
 * (`customerRowUtils.resolveChatOpenUrl`), plus Page inbox + E2EE.
 */

export type FacebookChatOpenInput = {
  threadId?: string | null;
  customerUid?: string | null;
  scanSource?: string | null;
  pageUrl?: string | null;
};

/** Messenger/Inbox id: digits ≥ 5, or the longest digit run in a mixed string. */
export function numericMessengerId(raw?: string | null): string | null {
  const t = String(raw ?? '').trim();
  if (!t) return null;
  if (/^\d{5,}$/.test(t)) return t;
  const runs = t.match(/\d{5,}/g);
  if (!runs?.length) return null;
  return runs.reduce((a, b) => (b.length >= a.length ? b : a));
}

export function isFacebookHostedInboxUrl(url: string): boolean {
  const raw = String(url ?? '').trim();
  if (!/^https?:\/\//i.test(raw)) return false;
  try {
    const host = new URL(raw).hostname.replace(/^www\./i, '').toLowerCase();
    return host === 'facebook.com' || host.endsWith('.facebook.com');
  } catch {
    return false;
  }
}

function scanSource(fb: FacebookChatOpenInput | null | undefined): string {
  return String(fb?.scanSource ?? '').trim();
}

function pageUrlOf(fb: FacebookChatOpenInput | null | undefined): string {
  return String(fb?.pageUrl ?? '').trim();
}

function isPageInboxScan(fb: FacebookChatOpenInput | null | undefined): boolean {
  const source = scanSource(fb);
  const pageUrl = pageUrlOf(fb);
  if (source === 'business_suite') return true;
  if (/business\.facebook\.com/i.test(pageUrl)) return true;
  if (/facebook\.com\/.*inbox/i.test(pageUrl)) return true;
  return false;
}

function isE2eeScan(fb: FacebookChatOpenInput | null | undefined): boolean {
  const pageUrl = pageUrlOf(fb);
  return scanSource(fb) === 'messenger_e2ee' || /\/messages\/e2ee\//i.test(pageUrl);
}

/**
 * «Mở chat» — Facebook Inbox / Business Suite tab.
 * Page (Business Suite): scanned pageUrl (not facebook.com/messages/t/…).
 * E2EE Messenger: /messages/e2ee/t/{id}.
 * Personal Messenger: /messages/t/{id}, else pageUrl if it is a Facebook URL.
 */
export function facebookInboxChatUrl(
  fb: FacebookChatOpenInput | null | undefined,
): string | null {
  if (!fb) return null;
  const pageUrl = pageUrlOf(fb);
  const threadId = numericMessengerId(fb.threadId);

  if (isPageInboxScan(fb) && isFacebookHostedInboxUrl(pageUrl)) {
    return pageUrl;
  }

  if (threadId) {
    if (isE2eeScan(fb)) {
      return `https://www.facebook.com/messages/e2ee/t/${threadId}`;
    }
    return `https://www.facebook.com/messages/t/${threadId}`;
  }

  if (isFacebookHostedInboxUrl(pageUrl)) return pageUrl;
  return null;
}

export function extractThreadIdFromPageUrl(pageUrl?: string | null): string | null {
  const url = String(pageUrl ?? '').trim();
  if (!url) return null;
  const patterns = [
    /messenger\.com\/t\/(\d{5,})/i,
    /facebook\.com\/messages\/(?:e2ee\/)?t\/(\d{5,})/i,
  ];
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match?.[1]) return match[1];
  }
  return null;
}

/** «Mở Messenger» — messenger.com (CRM cũ). */
export function messengerComUrl(fb: FacebookChatOpenInput | null | undefined): string | null {
  if (!fb) return null;
  const fromThread = numericMessengerId(fb.threadId);
  if (fromThread) return `https://www.messenger.com/t/${fromThread}`;
  const fromUid = numericMessengerId(fb.customerUid);
  if (fromUid) return `https://www.messenger.com/t/${fromUid}`;
  const fromPage = extractThreadIdFromPageUrl(fb.pageUrl);
  if (fromPage) return `https://www.messenger.com/t/${fromPage}`;
  return null;
}

/** pageUrl stored in CustomerFacebook.rawMeta (migrate + extension ingest). */
export function facebookPageUrlFromRawMeta(raw?: string | null): string | null {
  if (!raw?.trim()) return null;
  try {
    const parsed = JSON.parse(raw) as { pageUrl?: unknown };
    const url = String(parsed?.pageUrl ?? '').trim();
    return url || null;
  } catch {
    return null;
  }
}
