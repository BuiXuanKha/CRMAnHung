import type { MetadataRoute } from 'next';
import { PublicPostCategory, listingCommuneHubPath, listingPlaceHubPath } from '@crmanhung/shared';
import { listingSeoImageUrls, postSeoImageUrls } from '@/features/public/listing-image-seo';
import { listCommuneHubs, listPlaceHubs } from '@/features/public/listing-hubs';
import { listSitemapListings } from '@/features/public/published-listings';
import { listSitemapPosts, postHref } from '@/features/public/published-posts';
import { isPublicSearchIndexEnabled } from '@/features/public/search-index';
import {
  PUBLIC_LISTING_PATH,
  PUBLIC_SITE_ORIGIN,
  listingCanonicalUrl,
} from '@/features/public/site';

/** On-demand ISR — Nest revalidate `/sitemap.xml` khi đăng / gỡ lô hoặc bài. */
export const revalidate = false;

/** URL public ổn định + lô/bài đã xuất bản. Không đưa nháp / đã gỡ. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  if (!isPublicSearchIndexEnabled()) return [];

  const [listings, posts, communeHubs, placeHubs] = await Promise.all([
    listSitemapListings(),
    listSitemapPosts(),
    listCommuneHubs(),
    listPlaceHubs(),
  ]);
  const products = listings.map((p) => {
    const images = listingSeoImageUrls(p);
    return {
      url: listingCanonicalUrl(p.slug),
      ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
      changeFrequency: 'daily' as const,
      priority: 0.85,
      ...(images.length ? { images } : {}),
    };
  });
  const communePages = communeHubs.map((h) => ({
    url: `${PUBLIC_SITE_ORIGIN}${listingCommuneHubPath(h.slug)}`,
    ...(h.updatedAt ? { lastModified: new Date(h.updatedAt) } : {}),
    changeFrequency: 'daily' as const,
    priority: 0.75,
  }));
  const placePages = placeHubs
    .filter((h) => h.communeSlug?.trim())
    .map((h) => ({
      url: `${PUBLIC_SITE_ORIGIN}${listingPlaceHubPath(h.communeSlug!, h.slug)}`,
      ...(h.updatedAt ? { lastModified: new Date(h.updatedAt) } : {}),
      changeFrequency: 'daily' as const,
      priority: 0.7,
    }));
  const articles = posts.map((p) => {
    const images = postSeoImageUrls(p);
    return {
      url: `${PUBLIC_SITE_ORIGIN}${postHref(p.category, p.slug)}`,
      ...(p.updatedAt ? { lastModified: new Date(p.updatedAt) } : {}),
      changeFrequency: 'weekly' as const,
      priority: 0.65,
      ...(images.length ? { images } : {}),
    };
  });
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
    ...communePages,
    ...placePages,
    ...categoryPages,
    ...articles,
  ];
}
