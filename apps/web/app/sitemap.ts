import type { MetadataRoute } from 'next';
import { PublicPostCategory } from '@crmanhung/shared';
import { listSitemapListings } from '@/features/public/published-listings';
import { listSitemapPosts, postHref } from '@/features/public/published-posts';
import {
  PUBLIC_LISTING_PATH,
  PUBLIC_SITE_ORIGIN,
  listingCanonicalUrl,
} from '@/features/public/site';

/** On-demand ISR — Nest revalidate `/sitemap.xml` khi đăng / gỡ lô hoặc bài. */
export const revalidate = false;

/** URL public ổn định + lô/bài đã xuất bản. Không đưa nháp / đã gỡ. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [listings, posts] = await Promise.all([
    listSitemapListings(),
    listSitemapPosts(),
  ]);
  const products = listings.map((p) => ({
    url: listingCanonicalUrl(p.slug),
    ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
    changeFrequency: 'daily' as const,
    priority: 0.85,
  }));
  const articles = posts.map((p) => ({
    url: `${PUBLIC_SITE_ORIGIN}${postHref(p.category, p.slug)}`,
    ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
    changeFrequency: 'weekly' as const,
    priority: 0.65,
  }));
  const categoryPages = Object.values(PublicPostCategory).map((category) => ({
    url: `${PUBLIC_SITE_ORIGIN}/${category}`,
    changeFrequency: 'weekly' as const,
    priority: 0.6,
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
    ...categoryPages,
    ...articles,
  ];
}
