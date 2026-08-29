import type { Metadata } from 'next';

function envFlagOn(name: string): boolean {
  const v = process.env[name]?.trim().toLowerCase();
  return v === '1' || v === 'true' || v === 'yes';
}

/**
 * Public HTML is `noindex` until the site is ready.
 * Turn on later: set `PUBLIC_SEO_INDEX=1` in `apps/web/.env.production` and rebuild.
 * Do not block Googlebot on the CDN — this only gates HTML metadata / sitemap.
 */
export function isPublicSearchIndexEnabled(): boolean {
  return envFlagOn('PUBLIC_SEO_INDEX') || envFlagOn('NEXT_PUBLIC_SEO_INDEX');
}

/** `follow` stays true so crawlers can still recrawl and apply `noindex` on every URL. */
export function publicSearchRobots(): Metadata['robots'] {
  const index = isPublicSearchIndexEnabled();
  return {
    index,
    follow: true,
    googleBot: { index, follow: true },
  };
}
