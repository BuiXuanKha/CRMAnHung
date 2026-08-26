import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
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
  getRelatedListings,
} from '@/features/public/published-listings';

type Props = { params: Promise<{ slug: string }> };

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const listing = await getPublicListingBySlug(slug);
  if (!listing) return unpublishedListingMetadata();
  return listingMetadata(listing);
}

export default async function SanPhamDetailPage({ params }: Props) {
  const { slug } = await params;
  const listing = await getPublicListingBySlug(slug);
  if (!listing) notFound();
  const related = await getRelatedListings(listing.slug);
  return (
    <>
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd data={listingBreadcrumbJsonLd(listing)} />
      <ProductDetailView listing={listing} related={related} />
    </>
  );
}
