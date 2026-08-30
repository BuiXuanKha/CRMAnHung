import type { MetadataRoute } from 'next';
import { isPublicSearchIndexEnabled } from '@/features/public/search-index';

const SITE = 'https://anhungland.com';

/** Allow crawl of public HTML. Do not Disallow `/`. Sitemap line only when index is on. */
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
