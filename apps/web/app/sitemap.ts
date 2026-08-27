import type { MetadataRoute } from 'next';
import { listSitemapListings } from '@/features/public/published-listings';
import {
  PUBLIC_LISTING_PATH,
  PUBLIC_SITE_ORIGIN,
  listingCanonicalUrl,
} from '@/features/public/site';

/** On-demand ISR — Nest revalidate `/sitemap.xml` khi đăng / gỡ lô. */
export const revalidate = false;

/** URL public ổn định + lô đã Đăng web. Không đưa nháp / đã gỡ. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const listings = await listSitemapListings();
  const products = listings.map((p) => ({
    url: listingCanonicalUrl(p.slug),
    ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));

  return [
    {
      url: PUBLIC_SITE_ORIGIN,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${PUBLIC_SITE_ORIGIN}${PUBLIC_LISTING_PATH}`,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    ...products,
    {
      url: `${PUBLIC_SITE_ORIGIN}/du-an`,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${PUBLIC_SITE_ORIGIN}/kien-thuc`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
    {
      url: `${PUBLIC_SITE_ORIGIN}/kinh-nghiem`,
      changeFrequency: 'weekly',
      priority: 0.6,
    },
  ];
}
