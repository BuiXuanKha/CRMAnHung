import { JsonLd } from '@/features/public/json-ld';
import { organizationJsonLd, websiteJsonLd } from '@/features/public/listing-seo';
import { PublicHome } from '@/features/public/public-home';

/**
 * Web công khai — trang chủ khách.
 * IA: docs/PUBLIC-WEB.md · SEO: docs/PUBLIC-SEO.md
 */
export default function PublicHomePage() {
  return (
    <>
      <JsonLd data={organizationJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <PublicHome />
    </>
  );
}
