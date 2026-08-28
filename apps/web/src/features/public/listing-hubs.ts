import {
  toPublicSlug,
  type PublicListingCard,
  type PublicListingHub,
  type PublicListingHubDetail,
} from '@crmanhung/shared';
import { parseLotGptLocation } from '@/features/public-content/lot-gpt-context';
import { listPublicCatalog, type PublicListingView } from './published-listings';

/** Enrich catalog row with hub fields from public location string (until API fills them). */
export function withHubFieldsFromLocation<T extends PublicListingCard | PublicListingView>(
  row: T,
): T {
  if (row.communeSlug && row.communeLabel) return row;
  const parts = parseLotGptLocation(row.location ?? '');
  const communeLabel = parts.commune.trim();
  const placeLabel = parts.village.trim();
  if (!communeLabel) return row;
  return {
    ...row,
    communeSlug: row.communeSlug ?? toPublicSlug(communeLabel, 60, 'xa'),
    communeLabel: row.communeLabel ?? communeLabel,
    ...(placeLabel
      ? {
          placeSlug: row.placeSlug ?? toPublicSlug(placeLabel, 60, 'khu'),
          placeLabel: row.placeLabel ?? placeLabel,
        }
      : {}),
  };
}

function sortListings(rows: PublicListingView[]): PublicListingView[] {
  return [...rows].sort((a, b) => {
    const aTime = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const bTime = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    if (bTime !== aTime) return bTime - aTime;
    return a.title.localeCompare(b.title, 'vi');
  });
}

export async function listCommuneHubs(): Promise<PublicListingHub[]> {
  const catalog = (await listPublicCatalog()).map(withHubFieldsFromLocation);
  const bySlug = new Map<
    string,
    { label: string; district: string; province: string; count: number; updatedAt?: string }
  >();

  for (const row of catalog) {
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
}

export async function getCommuneHubDetail(
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
