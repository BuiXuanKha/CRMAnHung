import { toPublicSlug } from '@crmanhung/shared';
import { parseLotGptLocation } from '@/features/public-content/lot-gpt-context';
import { withHubFieldsFromLocation } from './listing-hubs';
import type { PublicListingView } from './published-listings';
import { listingCommuneHubPath, listingPlaceHubPath } from './site';

export type RelatedListingSection = {
  title: string;
  items: PublicListingView[];
  /** Guest hub URL for «Xem tất cả». */
  hubHref?: string | null;
};

const RELATED_LIMIT = 9;

function normLocationPart(value: string): string {
  return value.trim().toLocaleLowerCase('vi-VN');
}

/** KĐT / thôn / dự án — phần đầu chuỗi địa chỉ public. */
function listingAreaKey(location: string): string {
  return parseLotGptLocation(location).village.trim();
}

function listingCommune(location: string): string {
  return parseLotGptLocation(location).commune.trim();
}

function sortRelatedListings(rows: PublicListingView[]): PublicListingView[] {
  return [...rows].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.title.localeCompare(b.title, 'vi');
  });
}

function busiestAreaKey(rows: PublicListingView[]): string | null {
  const counts = new Map<string, { label: string; count: number }>();
  for (const row of rows) {
    const label = listingAreaKey(row.location);
    if (!label) continue;
    const key = normLocationPart(label);
    const prev = counts.get(key);
    if (prev) prev.count += 1;
    else counts.set(key, { label, count: 1 });
  }
  let best: { label: string; count: number } | null = null;
  for (const entry of counts.values()) {
    if (!best || entry.count > best.count) best = entry;
  }
  return best?.label ?? null;
}

/**
 * Related block on lot detail:
 * 1) Same commune (max 9), title "Lô đất cùng xã …"
 * 2) Else lots in the KĐT/area with the most published listings (max 9)
 */
export function pickRelatedListingSection(
  listing: PublicListingView,
  catalog: PublicListingView[],
  limit = RELATED_LIMIT,
): RelatedListingSection | null {
  const self = withHubFieldsFromLocation(listing);
  const others = catalog
    .map(withHubFieldsFromLocation)
    .filter((row) => row.slug !== listing.slug);
  if (others.length === 0) return null;

  const commune = listingCommune(listing.location);
  if (commune) {
    const communeKey = normLocationPart(commune);
    const sameCommune = others.filter(
      (row) => normLocationPart(listingCommune(row.location)) === communeKey,
    );
    if (sameCommune.length > 0) {
      const communeSlug = self.communeSlug || toPublicSlug(commune, 60, 'xa');
      return {
        title: `Lô đất cùng xã ${commune}`,
        items: sortRelatedListings(sameCommune).slice(0, limit),
        hubHref: listingCommuneHubPath(communeSlug),
      };
    }
  }

  const areaLabel = busiestAreaKey(catalog);
  if (!areaLabel) return null;

  const areaKey = normLocationPart(areaLabel);
  const sameArea = others.filter(
    (row) => normLocationPart(listingAreaKey(row.location)) === areaKey,
  );
  if (sameArea.length === 0) return null;

  const sample = sameArea[0]!;
  const enrichedSample = withHubFieldsFromLocation(sample);
  const communeSlug =
    enrichedSample.communeSlug ||
    self.communeSlug ||
    (commune ? toPublicSlug(commune, 60, 'xa') : null);
  const placeSlug = enrichedSample.placeSlug || toPublicSlug(areaLabel, 60, 'khu');

  return {
    title: `Lô đất tại ${areaLabel}`,
    items: sortRelatedListings(sameArea).slice(0, limit),
    hubHref:
      communeSlug != null
        ? listingPlaceHubPath(communeSlug, placeSlug)
        : null,
  };
}
