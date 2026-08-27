/**
 * Guest Facebook share.
 * Facebook's sharer.php now redirects to share_channel (often hangs on «Đang đăng»),
 * so we copy the canonical URL and open Facebook for a single paste.
 */

export async function copyPageUrl(pageUrl: string): Promise<void> {
  await navigator.clipboard.writeText(pageUrl);
}

/** Open Facebook feed / mobile composer (must run from a user click). */
export function openFacebookForPaste(pageUrl: string): void {
  const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
  const href = mobile
    ? `https://m.facebook.com/composer/?text=${encodeURIComponent(pageUrl)}`
    : 'https://www.facebook.com/';
  window.open(href, '_blank', 'noopener,noreferrer');
}

/** One gesture: copy URL + open Facebook. */
export async function shareToFacebook(pageUrl: string): Promise<void> {
  await copyPageUrl(pageUrl);
  openFacebookForPaste(pageUrl);
}
