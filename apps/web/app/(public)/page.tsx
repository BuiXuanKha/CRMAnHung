import { listPublishedPublicLots } from '@/features/public-content/api';
import { JsonLd } from '@/features/public/json-ld';
import { organizationJsonLd, websiteJsonLd } from '@/features/public/listing-seo';
import { PublicHome } from '@/features/public/public-home';

/**
 * Web công khai — trang chủ khách.
 * IA: docs/PUBLIC-WEB.md · SEO: docs/PUBLIC-SEO.md
 * Lô: overlay Đăng web (`isPublished`) ∩ lô CRM đang Mở bán — không mock marketing.
 * On-demand ISR — Nest revalidate `/` khi đăng / gỡ lô.
 */
export const revalidate = false;

export default async function PublicHomePage() {
  const lots = await listPublishedPublicLots();
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <PublicHome initialLots={lots} />
    </>
  );
}
