import {
  toPublicSlug,
  type PublicListingCard,
  type PublicListingHub,
  type PublicListingHubDetail,
} from '@crmanhung/shared';
import {
  getCommuneHubDetailFromApi,
  getPlaceHubDetailFromApi,
  listCommuneHubsFromApi,
  listPlaceHubsFromApi,
} from '@/features/public-content/api';
import { parseLotGptLocation } from '@/features/public-content/lot-gpt-context';
import { listPublicCatalog, type PublicListingView } from './published-listings';

/** Enrich catalog row with hub fields from public location string (mock / fallback). */
export function withHubFieldsFromLocation<T extends PublicListingCard | PublicListingView>(
  row: T,
): T {
  const parts = parseLotGptLocation(row.location ?? '');
  const communeLabel = parts.commune.trim();
  const placeLabel = parts.village.trim();
  const next = { ...row };
  if (communeLabel) {
    if (!next.communeSlug) next.communeSlug = toPublicSlug(communeLabel, 60, 'xa');
    if (!next.communeLabel) next.communeLabel = communeLabel;
  }
  if (placeLabel) {
    if (!next.placeSlug) next.placeSlug = toPublicSlug(placeLabel, 60, 'khu');
    if (!next.placeLabel) next.placeLabel = placeLabel;
  }
  return next as T;
}

function sortListings(rows: PublicListingView[]): PublicListingView[] {
  return [...rows].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.title.localeCompare(b.title, 'vi');
  });
}

function hubDetailItemsToViews(items: PublicListingHubDetail['items']): PublicListingView[] {
  return sortListings(items as PublicListingView[]);
}

function listCommuneHubsFromCatalog(): Promise<PublicListingHub[]> {
  return listPublicCatalog().then((catalog) => {
    const enriched = catalog.map(withHubFieldsFromLocation);
    const bySlug = new Map<
      string,
      { label: string; district: string; province: string; count: number; updatedAt?: string }
    >();

    for (const row of enriched) {
      const slug = row.communeSlug?.trim();
      const label = row.communeLabel?.trim();
      if (!slug || !label) continue;
      const parts = parseLotGptLocation(row.location ?? '');
      const prev = bySlug.get(slug);
      const updatedAt = row.updatedAt;
      if (prev) {
        prev.count += 1;
        if (updatedAt && (!prev.updatedAt || updatedAt > prev.updatedAt)) {
          prev.updatedAt = updatedAt;
        }
      } else {
        bySlug.set(slug, {
          label,
          district: parts.district.trim(),
          province: parts.province.trim(),
          count: 1,
          ...(updatedAt ? { updatedAt } : {}),
        });
      }
    }

    return [...bySlug.entries()]
      .map(([slug, meta]) => ({
        kind: 'commune' as const,
        slug,
        label: meta.label,
        listingCount: meta.count,
        ...(meta.district ? { districtLabel: meta.district } : {}),
        ...(meta.province ? { provinceLabel: meta.province } : {}),
        ...(meta.updatedAt ? { updatedAt: meta.updatedAt } : {}),
      }))
      .filter((h) => h.listingCount > 0)
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  });
}

export async function listCommuneHubs(): Promise<PublicListingHub[]> {
  const fromApi = await listCommuneHubsFromApi();
  if (fromApi != null) return fromApi;
  return listCommuneHubsFromCatalog();
}

async function getCommuneHubDetailFromCatalog(
  communeSlug: string,
): Promise<PublicListingHubDetail | null> {
  const slug = communeSlug.trim();
  if (!slug) return null;
  const catalog = (await listPublicCatalog()).map(withHubFieldsFromLocation);
  const items = sortListings(catalog.filter((row) => row.communeSlug === slug));
  if (items.length === 0) return null;

  const sample = items[0]!;
  const parts = parseLotGptLocation(sample.location ?? '');
  const label = sample.communeLabel?.trim() || parts.commune.trim() || slug;
  const updatedAt = items
    .map((r) => r.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    kind: 'commune',
    slug,
    label,
    listingCount: items.length,
    ...(parts.district.trim() ? { districtLabel: parts.district.trim() } : {}),
    ...(parts.province.trim() ? { provinceLabel: parts.province.trim() } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    items,
  };
}

export async function getCommuneHubDetail(
  communeSlug: string,
): Promise<PublicListingHubDetail | null> {
  const fromApi = await getCommuneHubDetailFromApi(communeSlug);
  if (fromApi === null) return null;
  if (fromApi) {
    return { ...fromApi, items: hubDetailItemsToViews(fromApi.items) };
  }
  return getCommuneHubDetailFromCatalog(communeSlug);
}

export function communeHubHeadline(hub: PublicListingHub): string {
  if (hub.districtLabel?.trim()) {
    return `Nhà đất ${hub.label}, ${hub.districtLabel.trim()}`;
  }
  return `Nhà đất ${hub.label}`;
}

export function communeHubDescription(hub: PublicListingHub): string {
  const n = hub.listingCount;
  const where = hub.districtLabel?.trim()
    ? `${hub.label}, ${hub.districtLabel.trim()}`
    : hub.label;
  return `${n} lô đang giới thiệu tại ${where} trên An Hưng Land. Xem và chia sẻ không cần đăng nhập.`;
}

type PlaceHubKey = `${string}/${string}`;

function placeHubMapKey(communeSlug: string, placeSlug: string): PlaceHubKey {
  return `${communeSlug}/${placeSlug}`;
}

function listPlaceHubsFromCatalog(communeSlug?: string): Promise<PublicListingHub[]> {
  return listPublicCatalog().then((catalog) => {
    const filter = communeSlug?.trim();
    const enriched = catalog.map(withHubFieldsFromLocation);
    const byKey = new Map<
      PlaceHubKey,
      PublicListingHub & { district: string; province: string; updatedAt?: string }
    >();

    for (const row of enriched) {
      const cSlug = row.communeSlug?.trim();
      const cLabel = row.communeLabel?.trim();
      const pSlug = row.placeSlug?.trim();
      const pLabel = row.placeLabel?.trim();
      if (!cSlug || !cLabel || !pSlug || !pLabel) continue;
      if (filter && cSlug !== filter) continue;
      const parts = parseLotGptLocation(row.location ?? '');
      const key = placeHubMapKey(cSlug, pSlug);
      const prev = byKey.get(key);
      const updatedAt = row.updatedAt;
      if (prev) {
        prev.listingCount += 1;
        if (updatedAt && (!prev.updatedAt || updatedAt > prev.updatedAt)) {
          prev.updatedAt = updatedAt;
        }
      } else {
        byKey.set(key, {
          kind: 'place',
          slug: pSlug,
          label: pLabel,
          communeSlug: cSlug,
          communeLabel: cLabel,
          listingCount: 1,
          district: parts.district.trim(),
          province: parts.province.trim(),
          ...(updatedAt ? { updatedAt } : {}),
        });
      }
    }

    return [...byKey.values()]
      .filter((h) => h.listingCount > 0)
      .map(({ district, province, updatedAt, ...hub }) => ({
        ...hub,
        ...(district ? { districtLabel: district } : {}),
        ...(province ? { provinceLabel: province } : {}),
        ...(updatedAt ? { updatedAt } : {}),
      }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  });
}

/** Place hubs (cấp 4 — thôn/KĐT/dự án trong xã). Optional filter by commune slug. */
export async function listPlaceHubs(communeSlug?: string): Promise<PublicListingHub[]> {
  const fromApi = await listPlaceHubsFromApi(communeSlug);
  if (fromApi != null) return fromApi;
  return listPlaceHubsFromCatalog(communeSlug);
}

async function getPlaceHubDetailFromCatalog(
  communeSlug: string,
  placeSlug: string,
): Promise<PublicListingHubDetail | null> {
  const cSlug = communeSlug.trim();
  const pSlug = placeSlug.trim();
  if (!cSlug || !pSlug) return null;

  const catalog = (await listPublicCatalog()).map(withHubFieldsFromLocation);
  const items = sortListings(
    catalog.filter((row) => row.communeSlug === cSlug && row.placeSlug === pSlug),
  );
  if (items.length === 0) return null;

  const sample = items[0]!;
  const parts = parseLotGptLocation(sample.location ?? '');
  const label = sample.placeLabel?.trim() || parts.village.trim() || pSlug;
  const communeLabel = sample.communeLabel?.trim() || parts.commune.trim() || cSlug;
  const updatedAt = items
    .map((r) => r.updatedAt)
    .filter(Boolean)
    .sort()
    .at(-1);

  return {
    kind: 'place',
    slug: pSlug,
    label,
    communeSlug: cSlug,
    communeLabel,
    listingCount: items.length,
    ...(parts.district.trim() ? { districtLabel: parts.district.trim() } : {}),
    ...(parts.province.trim() ? { provinceLabel: parts.province.trim() } : {}),
    ...(updatedAt ? { updatedAt } : {}),
    items,
  };
}

export async function getPlaceHubDetail(
  communeSlug: string,
  placeSlug: string,
): Promise<PublicListingHubDetail | null> {
  const fromApi = await getPlaceHubDetailFromApi(communeSlug, placeSlug);
  if (fromApi === null) return null;
  if (fromApi) {
    return { ...fromApi, items: hubDetailItemsToViews(fromApi.items) };
  }
  return getPlaceHubDetailFromCatalog(communeSlug, placeSlug);
}

export function placeHubHeadline(hub: PublicListingHub): string {
  const place = hub.label.trim();
  const commune = hub.communeLabel?.trim();
  if (commune) return `Lô đất ${place}, ${commune}`;
  return `Lô đất ${place}`;
}

export function placeHubDescription(hub: PublicListingHub): string {
  const n = hub.listingCount;
  const where =
    hub.communeLabel?.trim() && hub.districtLabel?.trim()
      ? `${hub.label}, ${hub.communeLabel.trim()}, ${hub.districtLabel.trim()}`
      : hub.communeLabel?.trim()
        ? `${hub.label}, ${hub.communeLabel.trim()}`
        : hub.label;
  return `${n} lô đang giới thiệu tại ${where} trên An Hưng Land. Xem và chia sẻ không cần đăng nhập.`;
}
