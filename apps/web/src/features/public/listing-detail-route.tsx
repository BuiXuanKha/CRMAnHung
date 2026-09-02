import type { Metadata } from 'next';
import { notFound, permanentRedirect } from 'next/navigation';
import { JsonLd } from '@/features/public/json-ld';
import { LotShareVisitTracker } from '@/features/public/lot-share-visit-tracker';
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
import { resolvePublicLotShare } from '@/features/lot-shares/api';
import { listingHref } from '@/features/public/site';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ share?: string }>;
};

export const revalidate = false;

async function redirectIfLegacySlug(slug: string): Promise<void> {
  const toSlug = await getPublicLotSlugRedirect(slug);
  if (toSlug && toSlug !== slug) {
    permanentRedirect(listingHref(toSlug));
  }
}

export async function buildListingDetailMetadata(slug: string): Promise<Metadata> {
  const listing = await getPublicListingBySlug(slug);
  if (!listing) {
    await redirectIfLegacySlug(slug);
    return unpublishedListingMetadata();
  }
  return listingMetadata(listing);
}

export async function ListingDetailRoute({ params, searchParams }: Props) {
  const { slug } = await params;
  const { share: shareRaw } = await searchParams;
  const shareCode = shareRaw?.trim() ?? '';

  const listing = await getPublicListingBySlug(slug);
  if (!listing) {
    await redirectIfLegacySlug(slug);
    notFound();
  }

  const shareResolved = shareCode ? await resolvePublicLotShare(shareCode) : null;
  if (shareCode && (!shareResolved || shareResolved.listingSlug !== slug)) {
    notFound();
  }

  const relatedSections = await getRelatedListingSections(listing);

  return (
    <>
      {shareCode ? <LotShareVisitTracker shareCode={shareCode} /> : null}
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd data={listingBreadcrumbJsonLd(listing)} />
      <ProductDetailView
        listing={listing}
        relatedSections={relatedSections}
        shareContact={shareResolved?.employee ?? null}
      />
    </>
  );
}
