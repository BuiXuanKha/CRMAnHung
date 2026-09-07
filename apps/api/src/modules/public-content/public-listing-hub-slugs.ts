import { toPublicSlug } from './public-slug';

export type AddressGeo = {
  wardId: string;
  wardName: string;
  districtName: string;
  provinceName: string;
  detail: string | null;
};

export type CommuneSlugMeta = {
  slug: string;
  label: string;
  districtLabel: string;
  provinceLabel: string;
};

export type PlaceSlugMeta = {
  slug: string;
  label: string;
  communeSlug: string;
  communeLabel: string;
};

export type HubSlugMaps = {
  communeByWardId: Map<string, CommuneSlugMeta>;
  placeByWardDetail: Map<string, PlaceSlugMeta>;
};

type AddrLike = {
  detail?: string | null;
  ward?: { id: string; name: string; isHidden?: boolean } | null;
  district?: { name: string; isHidden?: boolean } | null;
  province?: { name: string; isHidden?: boolean } | null;
};

export function addressGeo(addr: AddrLike | null | undefined): AddressGeo | null {
  if (!addr?.ward?.id || addr.ward.isHidden) return null;
  const wardName = addr.ward.name.trim();
  if (!wardName) return null;
  const districtName =
    addr.district && !addr.district.isHidden ? addr.district.name.trim() : '';
  const provinceName =
    addr.province && !addr.province.isHidden ? addr.province.name.trim() : '';
  const detail = addr.detail?.trim() || null;
  return {
    wardId: addr.ward.id,
    wardName,
    districtName,
    provinceName,
    detail,
  };
}

function placeDetailKey(wardId: string, detail: string): string {
  return `${wardId}|${detail.trim().toLowerCase()}`;
}

/** Stable commune slug; suffix district when same ward name appears in multiple districts. */
export function buildHubSlugMaps(geos: AddressGeo[]): HubSlugMaps {
  const communeByWardId = new Map<string, CommuneSlugMeta>();
  const placeByWardDetail = new Map<string, PlaceSlugMeta>();
  /** placeSlug taken per communeSlug — URL …/xa/{commune}/{place} must be unique. */
  const placeSlugsTakenByCommune = new Map<string, Set<string>>();

  const wardNameDistricts = new Map<string, Set<string>>();
  for (const geo of geos) {
    if (!wardNameDistricts.has(geo.wardName)) {
      wardNameDistricts.set(geo.wardName, new Set());
    }
    if (geo.districtName) {
      wardNameDistricts.get(geo.wardName)!.add(geo.districtName);
    }
  }

  for (const geo of geos) {
    if (!communeByWardId.has(geo.wardId)) {
      const base = toPublicSlug(geo.wardName, 60, 'xa');
      const districts = wardNameDistricts.get(geo.wardName);
      const slug =
        districts && districts.size > 1 && geo.districtName
          ? `${base}-${toPublicSlug(geo.districtName, 30, 'huyen')}`
          : base;
      communeByWardId.set(geo.wardId, {
        slug,
        label: geo.wardName,
        districtLabel: geo.districtName,
        provinceLabel: geo.provinceName,
      });
    }

    if (geo.detail) {
      const commune = communeByWardId.get(geo.wardId)!;
      const key = placeDetailKey(geo.wardId, geo.detail);
      if (!placeByWardDetail.has(key)) {
        // BUG-077: unique placeSlug within each commune URL (…/xa/{commune}/{place}).
        let taken = placeSlugsTakenByCommune.get(commune.slug);
        if (!taken) {
          taken = new Set();
          placeSlugsTakenByCommune.set(commune.slug, taken);
        }
        const base = toPublicSlug(geo.detail, 60, 'khu');
        const slug = nextUniqueHubSlug(base, taken);
        taken.add(slug);
        placeByWardDetail.set(key, {
          slug,
          label: geo.detail,
          communeSlug: commune.slug,
          communeLabel: commune.label,
        });
      }
    }
  }

  return { communeByWardId, placeByWardDetail };
}

/** First-insert slug for a ward — match the live derived URL when seeding existing hubs. */
export function preferredCommuneSlugByWardId(geos: AddressGeo[]): Map<string, string> {
  const preferred = new Map<string, string>();
  for (const [wardId, meta] of buildHubSlugMaps(geos).communeByWardId) {
    preferred.set(wardId, meta.slug);
  }
  return preferred;
}

/**
 * Guest listing + hub URLs: derive maps from Mở bán geos only (BUG-069), then overlay
 * persisted commune slugs so breadcrumb `/xa/{slug}` matches catalog/sitemap.
 */
export function guestCatalogHubMaps(
  openSaleGeos: AddressGeo[],
  persisted: Map<string, CommuneSlugMeta>,
): HubSlugMaps {
  return applyPersistedCommuneSlugs(buildHubSlugMaps(openSaleGeos), persisted);
}

/**
 * Persist wins: catalog/listing communeSlug follows stored hub, not the live derived map.
 * Also copies persisted slug onto place hub parent fields.
 */
export function applyPersistedCommuneSlugs(
  maps: HubSlugMaps,
  persisted: Map<string, CommuneSlugMeta>,
): HubSlugMaps {
  const communeByWardId = new Map(maps.communeByWardId);
  for (const [wardId, meta] of persisted) {
    communeByWardId.set(wardId, meta);
  }

  const placeByWardDetail = new Map<string, PlaceSlugMeta>();
  for (const [key, place] of maps.placeByWardDetail) {
    const wardId = key.slice(0, key.indexOf('|'));
    const commune = communeByWardId.get(wardId);
    placeByWardDetail.set(
      key,
      commune
        ? { ...place, communeSlug: commune.slug, communeLabel: commune.label }
        : place,
    );
  }

  return { communeByWardId, placeByWardDetail };
}

export function nextUniqueHubSlug(base: string, taken: ReadonlySet<string>): string {
  const root = base.trim();
  if (!root) return 'xa';
  if (!taken.has(root)) return root;
  let n = 2;
  let slug = `${root}-${n}`;
  while (taken.has(slug)) {
    n += 1;
    slug = `${root}-${n}`;
  }
  return slug;
}

export function communeMetaForGeo(
  maps: HubSlugMaps,
  geo: AddressGeo | null,
): CommuneSlugMeta | null {
  if (!geo) return null;
  return maps.communeByWardId.get(geo.wardId) ?? null;
}

export function placeMetaForGeo(
  maps: HubSlugMaps,
  geo: AddressGeo | null,
): PlaceSlugMeta | null {
  if (!geo?.detail) return null;
  return maps.placeByWardDetail.get(placeDetailKey(geo.wardId, geo.detail)) ?? null;
}
