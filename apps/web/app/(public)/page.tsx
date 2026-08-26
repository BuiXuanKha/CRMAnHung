import { listPublishedPublicLots } from '@/features/public-content/api';
import { PublicHome } from '@/features/public/public-home';

/**
 * Web công khai — trang chủ khách.
 * IA: docs/PUBLIC-WEB.md · SEO: docs/PUBLIC-SEO.md
 * Lô: overlay Đăng web (`isPublished`) ∩ lô CRM đang Mở bán — không mock marketing.
 */
export const dynamic = 'force-dynamic';

export default async function PublicHomePage() {
  const lots = await listPublishedPublicLots();
  return <PublicHome initialLots={lots} />;
}
