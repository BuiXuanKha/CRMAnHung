import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { JsonLd } from '@/features/public/json-ld';
import {
  listingBreadcrumbJsonLd,
  listingJsonLd,
  listingMetadata,
  unpublishedListingMetadata,
} from '@/features/public/listing-seo';
import { ProductDetailView } from '@/features/public/product-detail';
import {
  getPublicListingBySlug,
  getPublicLotSlugRedirect,
  getRelatedListingSections,
} from '@/features/public/published-listings';
import { listingHref } from '@/features/public/site';

type Props = { params: Promise<{ slug: string }> };

/** On-demand ISR — Nest gọi /api/revalidate khi admin Lưu/Đăng/Gỡ. */
export const revalidate = false;

async function redirectIfLegacySlug(slug: string): Promise<void> {
  const toSlug = await getPublicLotSlugRedirect(slug);
  if (toSlug && toSlug !== slug) {
    permanentRedirect(listingHref(toSlug));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublicListingBySlug(slug);
  if (!listing) {
    await redirectIfLegacySlug(slug);
    return unpublishedListingMetadata();
  }
  return listingMetadata(listing);
}

export default async function MuaBanNhaDatDetailPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getPublicListingBySlug(slug);
  if (!listing) {
    await redirectIfLegacySlug(slug);
    notFound();
  }
  const relatedSections = await getRelatedListingSections(listing);
  return (
    <>
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd data={listingBreadcrumbJsonLd(listing)} />
      <ProductDetailView listing={listing} relatedSections={relatedSections} />
    </>
  );
}
