import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound, permanentRedirect } from 'next/navigation';
import { JsonLd } from '@/features/public/json-ld';
import {
  communeHubBreadcrumbJsonLd,
  communeHubItemListJsonLd,
  communeHubMetadata,
  unpublishedHubMetadata,
} from '@/features/public/listing-hub-seo';
import {
  communeHubDescription,
  communeHubHeadline,
  getCommuneHubDetail,
  getCommuneHubRedirect,
  listPlaceHubs,
} from '@/features/public/listing-hubs';
import { ListingProductGrid } from '@/features/public/listing-product-grid';
import {
  listingCommuneHubPath,
  listingPlaceHubPath,
  PUBLIC_LISTING_PATH,
} from '@/features/public/site';
import '@/features/public/public-home.css';

type Props = { params: Promise<{ commune: string }> };

export const revalidate = false;

async function redirectIfLegacyCommuneSlug(slug: string): Promise<void> {
  const toSlug = await getCommuneHubRedirect(slug);
  if (toSlug && toSlug !== slug) {
    permanentRedirect(listingCommuneHubPath(toSlug));
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { commune } = await params;
  const hub = await getCommuneHubDetail(commune);
  if (!hub) {
    await redirectIfLegacyCommuneSlug(commune);
    return unpublishedHubMetadata();
  }
  return communeHubMetadata(hub);
}

export default async function CommuneListingHubPage({ params }: Props) {
  const { commune } = await params;
  const hub = await getCommuneHubDetail(commune);
  if (!hub) {
    await redirectIfLegacyCommuneSlug(commune);
    notFound();
  }

  const placeHubs = await listPlaceHubs(commune);
  const headline = communeHubHeadline(hub);

  return (
    <div className="ph">
      <JsonLd data={communeHubBreadcrumbJsonLd(hub)} />
      {hub.items.length > 0 ? <JsonLd data={communeHubItemListJsonLd(hub)} /> : null}
      <div className="ph-list-page">
        <nav className="ph-detail-back" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden> · </span>
          <Link href={PUBLIC_LISTING_PATH}>Nhà đất đang bán</Link>
          <span aria-hidden> · </span>
          <span>{hub.label}</span>
        </nav>
        <h1>{headline}</h1>
        <p>{communeHubDescription(hub)}</p>
        {placeHubs.length > 0 ? (
          <nav className="ph-hub-places" aria-label="Khu vực trong xã">
            <p className="ph-hub-places-label">Theo thôn / KĐT / dự án:</p>
            <ul>
              {placeHubs.map((place) => (
                <li key={place.slug}>
                  <Link href={listingPlaceHubPath(commune, place.slug)}>
                    {place.label}
                    <span className="ph-hub-places-count"> ({place.listingCount})</span>
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        ) : null}
        <ListingProductGrid
          listings={hub.items}
          emptyText={`Hiện không có lô đang bán tại ${hub.label}.`}
        />
      </div>
    </div>
  );
}
