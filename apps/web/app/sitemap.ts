import type { MetadataRoute } from 'next';

const SITE = 'https://anhungland.com';

/** URL public ổn định — bổ sung khi thêm trang khách. */
export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
  ];
}
