import type { MetadataRoute } from 'next';
import { isPublicSearchIndexEnabled } from '@/features/public/search-index';

const SITE = 'https://anhungland.com';

/** Crawl public HTML so bots can see `noindex`. Do not Disallow `/`. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        '/login',
        '/khach-hang',
        '/lo-dat',
        '/giao-dich',
        '/dich-vu-so-do',
        '/dashboard',
        '/dashbroad',
        '/quan-tri',
        '/api',
      ],
    },
    ...(isPublicSearchIndexEnabled() ? { sitemap: `${SITE}/sitemap.xml` } : {}),
    host: SITE,
  };
}
