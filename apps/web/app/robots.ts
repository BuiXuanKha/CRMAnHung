import type { MetadataRoute } from 'next';

const SITE = 'https://anhungland.com';

/** Cho phép crawl web công khai; chặn CRM + login. */
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
        '/quan-tri',
      ],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
