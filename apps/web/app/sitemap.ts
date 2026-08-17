import type { MetadataRoute } from 'next';
import { PUBLIC_PRODUCTS } from '@/features/public/mock-data';

const SITE = 'https://anhungland.com';

/** URL public ổn định — bổ sung khi thêm trang khách. */
export default function sitemap(): MetadataRoute.Sitemap {
  const products = PUBLIC_PRODUCTS.map((p) => ({
    url: `${SITE}/san-pham/${p.slug}`,
    lastModified: new Date(),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  return [
    {
      url: SITE,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${SITE}/san-pham`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...products,
    {
      url: `${SITE}/du-an`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${SITE}/kien-thuc`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${SITE}/kinh-nghiem`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
