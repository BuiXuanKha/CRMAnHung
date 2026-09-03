/** Hosts CRM may fetch for same-origin gallery download (CDN has no CORS). */

const DEFAULT_CDN_HOST = 'cdn.anhungland.com';

export function isAllowedPublicCdnImageUrl(
  raw: string,
  publicBaseUrl = `https://${DEFAULT_CDN_HOST}`,
): boolean {
  const trimmed = raw.trim();
  if (!trimmed || trimmed.length > 2048) return false;

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return false;
  }

  if (parsed.protocol !== 'https:') return false;
  if (parsed.username || parsed.password) return false;
  if (parsed.port && parsed.port !== '443') return false;
  if (!parsed.pathname || parsed.pathname === '/') return false;

  const host = parsed.hostname.toLowerCase();
  const allowed = new Set<string>([DEFAULT_CDN_HOST]);
  try {
    const base = new URL(publicBaseUrl);
    if (base.hostname) allowed.add(base.hostname.toLowerCase());
  } catch {
    // ignore bad env; still allow default CDN
  }

  if (allowed.has(host)) return true;
  return host.endsWith('.r2.dev');
}

export function fileNameFromPublicImageUrl(url: string): string {
  try {
    const base = new URL(url).pathname.split('/').pop() || 'anh-lo.jpg';
    return base.includes('.') ? base : `${base}.jpg`;
  } catch {
    return 'anh-lo.jpg';
  }
}
