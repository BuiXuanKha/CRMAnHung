/** Guest share helpers — Facebook sharer is more reliable than navigator.share → share_channel. */

export function facebookShareHref(pageUrl: string): string {
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(pageUrl)}`;
}

/** Open FB sharer in a centered popup (must run from a user click). */
export function openFacebookShare(pageUrl: string): void {
  const href = facebookShareHref(pageUrl);
  const width = 600;
  const height = 640;
  const left = Math.max(0, window.screenX + (window.outerWidth - width) / 2);
  const top = Math.max(0, window.screenY + (window.outerHeight - height) / 2);
  const features = `noopener,noreferrer,width=${width},height=${height},left=${left},top=${top}`;
  const popup = window.open(href, 'anhung-fb-share', features);
  if (!popup) {
    window.open(href, '_blank', 'noopener,noreferrer');
  }
}

export async function copyPageUrl(pageUrl: string): Promise<void> {
  await navigator.clipboard.writeText(pageUrl);
}
