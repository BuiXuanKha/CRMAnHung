import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { JsonLd } from '@/features/public/json-ld';
import {
  placeHubBreadcrumbJsonLd,
  placeHubItemListJsonLd,
  placeHubMetadata,
  unpublishedHubMetadata,
} from '@/features/public/listing-hub-seo';
import {
  getCommuneHubDetail,
  getPlaceHubDetail,
  placeHubDescription,
  placeHubHeadline,
} from '@/features/public/listing-hubs';
import { ListingProductGrid } from '@/features/public/listing-product-grid';
import { listingCommuneHubPath, PUBLIC_LISTING_PATH } from '@/features/public/site';
import '@/features/public/public-home.css';

type Props = { params: Promise<{ commune: string; place: string }> };

export const revalidate = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { commune, place } = await params;
  const hub = await getPlaceHubDetail(commune, place);
  if (!hub) return unpublishedHubMetadata();
  return placeHubMetadata(hub);
}

export default async function PlaceListingHubPage({ params }: Props) {
  const { commune, place } = await params;
  const hub = await getPlaceHubDetail(commune, place);
  if (!hub) notFound();

  const communeHub = await getCommuneHubDetail(commune);
  const communeLabel = hub.communeLabel ?? communeHub?.label ?? commune;
  const headline = placeHubHeadline(hub);

  return (
    <div className="ph">
      <JsonLd data={placeHubBreadcrumbJsonLd(hub)} />
      <JsonLd data={placeHubItemListJsonLd(hub)} />
      <div className="ph-list-page">
        <nav className="ph-detail-back" aria-label="Đường dẫn">
          <Link href="/">Trang chủ</Link>
          <span aria-hidden> · </span>
          <Link href={PUBLIC_LISTING_PATH}>Nhà đất đang bán</Link>
          <span aria-hidden> · </span>
          <Link href={listingCommuneHubPath(commune)}>{communeLabel}</Link>
          <span aria-hidden> · </span>
          <span>{hub.label}</span>
        </nav>
        <h1>{headline}</h1>
        <p>{placeHubDescription(hub)}</p>
        <ListingProductGrid listings={hub.items} />
      </div>
    </div>
  );
}
