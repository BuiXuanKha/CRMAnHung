import { AddressKind, toPublicSlug } from '@crmanhung/shared';
import { parseLotGptLocation } from '@/features/public-content/lot-gpt-context';
import { withHubFieldsFromLocation } from './listing-hubs';
import type { PublicListingView } from './published-listings';
import { listingCommuneHubPath, listingPlaceHubPath, PUBLIC_LISTING_PATH } from './site';

export type RelatedListingSection = {
  title: string;
  items: PublicListingView[];
  /** Guest hub URL for «Xem tất cả». */
  hubHref?: string | null;
};

const RELATED_LIMIT = 9;
const PROJECT_RELATED_HUB_LIMIT = 3;
export const PROJECT_RELATED_TITLE = 'Đất dự án khu vực Nam Sách';

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

function placeGroupKey(row: PublicListingView): string | null {
  const commune = row.communeSlug?.trim();
  const place = row.placeSlug?.trim();
  if (commune && place) return `${commune}/${place}`;
  const label = row.placeLabel?.trim() || listingAreaKey(row.location);
  return label ? normLocationPart(label) : null;
}

/** Prefer Address.kind; if guest payload lacks it, KĐT-style labels only. */
export function isProjectListing(row: PublicListingView): boolean {
  if (row.addressKind === AddressKind.PROJECT) return true;
  if (row.addressKind === AddressKind.REGULAR) return false;
  const hay = `${row.placeLabel ?? ''} ${row.location ?? ''}`;
  return /khu\s*đô\s*thị|khu do thi|\bkđt\b|\bkdt\b/i.test(hay);
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

function pickSameCommuneSection(
  listing: PublicListingView,
  others: PublicListingView[],
  limit: number,
): RelatedListingSection | null {
  const commune = listingCommune(listing.location);
  if (!commune) return null;
  const communeKey = normLocationPart(commune);
  const sameCommune = others.filter(
    (row) => normLocationPart(listingCommune(row.location)) === communeKey,
  );
  if (sameCommune.length === 0) return null;
  const self = withHubFieldsFromLocation(listing);
  const communeSlug = self.communeSlug || toPublicSlug(commune, 60, 'xa');
  return {
    title: `Lô đất cùng xã ${commune}`,
    items: sortRelatedListings(sameCommune).slice(0, limit),
    hubHref: listingCommuneHubPath(communeSlug),
  };
}

function pickBusiestAreaFallback(
  listing: PublicListingView,
  catalog: PublicListingView[],
  others: PublicListingView[],
  limit: number,
): RelatedListingSection | null {
  const areaLabel = busiestAreaKey(catalog);
  if (!areaLabel) return null;
  const areaKey = normLocationPart(areaLabel);
  const sameArea = others.filter(
    (row) => normLocationPart(listingAreaKey(row.location)) === areaKey,
  );
  if (sameArea.length === 0) return null;

  const commune = listingCommune(listing.location);
  const sample = sameArea[0]!;
  const enrichedSample = withHubFieldsFromLocation(sample);
  const self = withHubFieldsFromLocation(listing);
  const communeSlug =
    enrichedSample.communeSlug ||
    self.communeSlug ||
    (commune ? toPublicSlug(commune, 60, 'xa') : null);
  const placeSlug = enrichedSample.placeSlug || toPublicSlug(areaLabel, 60, 'khu');

  return {
    title: `Lô đất tại ${areaLabel}`,
    items: sortRelatedListings(sameArea).slice(0, limit),
    hubHref: communeSlug != null ? listingPlaceHubPath(communeSlug, placeSlug) : null,
  };
}

function topProjectPlaceKeys(catalog: PublicListingView[], limit: number): Set<string> {
  const groups = new Map<string, { key: string; count: number; latest: number; label: string }>();
  for (const row of catalog) {
    if (!isProjectListing(row)) continue;
    const key = placeGroupKey(row);
    if (!key) continue;
    const t = row.publishedAt ? Date.parse(row.publishedAt) : 0;
    const prev = groups.get(key);
    if (prev) {
      prev.count += 1;
      prev.latest = Math.max(prev.latest, Number.isFinite(t) ? t : 0);
    } else {
      groups.set(key, {
        key,
        count: 1,
        latest: Number.isFinite(t) ? t : 0,
        label: row.placeLabel?.trim() || key,
      });
    }
  }
  return new Set(
    [...groups.values()]
      .sort(
        (a, b) =>
          b.count - a.count || b.latest - a.latest || a.label.localeCompare(b.label, 'vi'),
      )
      .slice(0, limit)
      .map((g) => g.key),
  );
}

export function pickProjectRelatedSection(
  listing: PublicListingView,
  catalog: PublicListingView[],
  excludeSlugs: ReadonlySet<string>,
  limit = RELATED_LIMIT,
): RelatedListingSection | null {
  const topKeys = topProjectPlaceKeys(catalog, PROJECT_RELATED_HUB_LIMIT);
  if (topKeys.size === 0) return null;
  const items = sortRelatedListings(
    catalog
      .map(withHubFieldsFromLocation)
      .filter((row) => {
        if (excludeSlugs.has(row.slug) || row.slug === listing.slug) return false;
        if (!isProjectListing(row)) return false;
        const key = placeGroupKey(row);
        return key != null && topKeys.has(key);
      }),
  ).slice(0, limit);
  if (items.length === 0) return null;
  return {
    title: PROJECT_RELATED_TITLE,
    items,
    hubHref: PUBLIC_LISTING_PATH,
  };
}

/**
 * Related blocks on lot detail:
 * 1) Same commune (max 9)
 * 2) Project lots from the 3 busiest PROJECT place hubs (max 9)
 * 3) If no commune block: lots in the KĐT/area with the most listings
 */
export function pickRelatedListingSections(
  listing: PublicListingView,
  catalog: PublicListingView[],
  limit = RELATED_LIMIT,
): RelatedListingSection[] {
  const others = catalog
    .map(withHubFieldsFromLocation)
    .filter((row) => row.slug !== listing.slug);
  if (others.length === 0) return [];

  const sections: RelatedListingSection[] = [];
  const commune = pickSameCommuneSection(listing, others, limit);
  if (commune) sections.push(commune);
  else {
    const area = pickBusiestAreaFallback(listing, catalog, others, limit);
    if (area) sections.push(area);
  }

  const seen = new Set<string>([listing.slug, ...sections.flatMap((s) => s.items.map((i) => i.slug))]);
  const project = pickProjectRelatedSection(listing, catalog, seen, limit);
  if (project) sections.push(project);
  return sections;
}

export function pickRelatedListingSection(
  listing: PublicListingView,
  catalog: PublicListingView[],
  limit = RELATED_LIMIT,
): RelatedListingSection | null {
  return pickRelatedListingSections(listing, catalog, limit)[0] ?? null;
}
