import { listPublishedPublicLots } from '@/features/public-content/api';
import { JsonLd } from '@/features/public/json-ld';
import { organizationJsonLd, websiteJsonLd } from '@/features/public/listing-seo';
import { listHomeProjectPosts, listHomeTeaserPosts } from '@/features/public/published-posts';
import { PublicHome } from '@/features/public/public-home';

/**
 * Web công khai — trang chủ khách.
 * IA: docs/PUBLIC-WEB.md · SEO: docs/PUBLIC-SEO.md
 * Lô + teaser bài từ API published. On-demand ISR.
 */
export const revalidate = false;

export default async function PublicHomePage() {
  const [lots, projectPosts, posts] = await Promise.all([
    listPublishedPublicLots(),
    listHomeProjectPosts(3),
    listHomeTeaserPosts(6),
  ]);
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <PublicHome initialLots={lots} initialProjectPosts={projectPosts} initialPosts={posts} />
    </>
  );
}
