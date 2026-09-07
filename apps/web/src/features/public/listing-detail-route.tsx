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
import { isNextProductionBuild } from '@/features/public/next-production-build';
import {
  getShareAttribution,
  shareContactFrom,
} from '@/features/lot-shares/share-referrer';
import { listingHref } from '@/features/public/site';

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ share?: string }>;
};

export const revalidate = false;

async function redirectIfLegacySlug(slug: string, shareCode?: string): Promise<void> {
  try {
    const toSlug = await getPublicLotSlugRedirect(slug);
    if (toSlug && toSlug !== slug) {
      permanentRedirect(listingHref(toSlug, shareCode));
    }
  } catch (err) {
    // Build collect without Nest; runtime outages must not look like "no redirect".
    if (isNextProductionBuild()) return;
    throw err;
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
  const shareFromQuery = shareRaw?.trim() ?? '';

  const listing = await getPublicListingBySlug(slug);
  if (!listing) {
    await redirectIfLegacySlug(slug, shareFromQuery);
    notFound();
  }

  const attribution = await getShareAttribution(shareFromQuery);
  const shareContact = shareContactFrom(attribution);

  const relatedSections = await getRelatedListingSections(listing);

  return (
    <>
      <JsonLd data={listingJsonLd(listing)} />
      <JsonLd data={listingBreadcrumbJsonLd(listing)} />
      <ProductDetailView
        listing={listing}
        relatedSections={relatedSections}
        shareContact={shareContact}
      />
    </>
  );
}
