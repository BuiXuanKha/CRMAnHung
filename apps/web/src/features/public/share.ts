/**
 * Guest Facebook share.
 * Facebook sharer/share_channel often hangs, so we copy paste-ready text
 * (mô tả giữ xuống dòng + URL) and open Facebook for one paste / mobile prefill.
 */

/** Max plain-text body length in the clipboard (Facebook post comfort). */
const SHARE_BODY_MAX = 2200;

/**
 * TipTap/HTML → plain text for Facebook: giữ xuống dòng theo &lt;p&gt; / &lt;br&gt;,
 * bỏ thẻ (đậm…) vì FB paste không giữ HTML.
 */
export function htmlToSharePlainText(html: string): string {
  if (!html.trim()) return '';
  let s = html
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/\r\n?/g, '\n')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|h[1-6]|li|tr|blockquote)>/gi, '\n')
    .replace(/<(p|div|h[1-6]|li|tr|blockquote)(\s[^>]*)?>/gi, '')
    .replace(/<\/?(ul|ol|table|thead|tbody|span|strong|b|em|i|u|a)(\s[^>]*)?>/gi, '')
    .replace(/<[^>]+>/g, '')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#0?39;/gi, "'")
    .replace(/&#(\d+);/g, (_, n) => {
      const code = Number(n);
      return Number.isFinite(code) ? String.fromCodePoint(code) : '';
    });

  s = s
    .split('\n')
    .map((line) => line.replace(/[ \t\u00a0]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return s;
}

export function buildShareClipboard(pageUrl: string, description?: string | null): string {
  const desc = (description ?? '').replace(/\u00a0/g, ' ').trim();
  if (!desc) return pageUrl;
  const clipped =
    desc.length > SHARE_BODY_MAX ? `${desc.slice(0, SHARE_BODY_MAX - 1).trim()}…` : desc;
  // URL riêng dòng cuối — Facebook dễ nhận link / khách dễ thấy.
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

export async function copyPageUrl(pageUrl: string, description?: string | null): Promise<void> {
  await copySharePayload(pageUrl, description);
}
