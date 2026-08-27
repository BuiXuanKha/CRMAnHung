/**
 * Guest Facebook share.
 * Facebook sharer/share_channel often hangs, so we copy paste-ready text
 * (mô tả + URL) and open Facebook for one paste (desktop) / prefill (mobile).
 */

/** Max plain-text body length in the clipboard (Facebook post comfort). */
const SHARE_BODY_MAX = 1800;

export function buildShareClipboard(pageUrl: string, description?: string | null): string {
  const desc = (description ?? '').replace(/\u00a0/g, ' ').trim();
  if (!desc) return pageUrl;
  const clipped =
    desc.length > SHARE_BODY_MAX ? `${desc.slice(0, SHARE_BODY_MAX - 1).trim()}…` : desc;
  return `${clipped}\n\n${pageUrl}`;
}

export async function copySharePayload(
  pageUrl: string,
  description?: string | null,
): Promise<string> {
  const payload = buildShareClipboard(pageUrl, description);
  await navigator.clipboard.writeText(payload);
  return payload;
}

/** Open Facebook feed / mobile composer (must run from a user click). */
export function openFacebookForPaste(clipboardText: string): void {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const href = mobile
    ? `https://m.facebook.com/composer/?text=${encodeURIComponent(clipboardText)}`
    : 'https://www.facebook.com/';
  window.open(href, '_blank', 'noopener,noreferrer');
}

/** One gesture: copy mô tả + URL, then open Facebook. */
export async function shareToFacebook(
  pageUrl: string,
  description?: string | null,
): Promise<void> {
  const payload = await copySharePayload(pageUrl, description);
  openFacebookForPaste(payload);
}

/** @deprecated use copySharePayload — kept name for call-site clarity */
export async function copyPageUrl(pageUrl: string, description?: string | null): Promise<void> {
  await copySharePayload(pageUrl, description);
}
