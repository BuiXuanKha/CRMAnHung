import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyPersistedCommuneSlugs,
  buildHubSlugMaps,
  guestCatalogHubMaps,
  nextUniqueHubSlug,
  type AddressGeo,
  type CommuneSlugMeta,
  type HubSlugMaps,
} from './public-listing-hub-slugs';

describe('nextUniqueHubSlug', () => {
  it('keeps the base when free', () => {
    assert.equal(nextUniqueHubSlug('dong-lac', new Set()), 'dong-lac');
  });

  it('appends -2 at the end of the path when the base is taken', () => {
    assert.equal(
      nextUniqueHubSlug('dong-lac', new Set(['dong-lac'])),
      'dong-lac-2',
    );
    assert.equal(
      nextUniqueHubSlug('dong-lac', new Set(['dong-lac', 'dong-lac-2'])),
      'dong-lac-3',
    );
  });
});

describe('applyPersistedCommuneSlugs', () => {
  it('overrides derived commune slug and parent place slug', () => {
    const maps: HubSlugMaps = {
      communeByWardId: new Map([
        [
          'w1',
          {
            slug: 'dong-lac-nam-sach',
            label: 'Đồng Lạc',
            districtLabel: 'Nam Sách',
            provinceLabel: 'Hải Dương',
          },
        ],
      ]),
      placeByWardDetail: new Map([
        [
          'w1|nham cap',
          {
            slug: 'nham-cap',
            label: 'Nham Cáp',
            communeSlug: 'dong-lac-nam-sach',
            communeLabel: 'Đồng Lạc',
          },
        ],
      ]),
    };
    const persisted = new Map<string, CommuneSlugMeta>([
      [
        'w1',
        {
          slug: 'dong-lac',
          label: 'Đồng Lạc',
          districtLabel: 'Nam Sách',
          provinceLabel: 'Hải Dương',
        },
      ],
    ]);
    const next = applyPersistedCommuneSlugs(maps, persisted);
    assert.equal(next.communeByWardId.get('w1')?.slug, 'dong-lac');
    assert.equal(next.placeByWardDetail.get('w1|nham cap')?.communeSlug, 'dong-lac');
  });
});

describe('buildHubSlugMaps place uniqueness (BUG-077)', () => {
  it('suffixes -2 when two different details collapse to the same placeSlug in one commune', () => {
    const geos: AddressGeo[] = [
      {
        wardId: 'w-an-lam',
        wardName: 'An Lâm',
        districtName: 'Nam Sách',
        provinceName: 'Hải Dương',
        detail: 'KĐT ABC',
      },
      {
        wardId: 'w-an-lam',
        wardName: 'An Lâm',
        districtName: 'Nam Sách',
        provinceName: 'Hải Dương',
        detail: 'KDT ABC',
      },
    ];
    const maps = buildHubSlugMaps(geos);
    const a = maps.placeByWardDetail.get('w-an-lam|kđt abc');
    const b = maps.placeByWardDetail.get('w-an-lam|kdt abc');
    assert.ok(a);
    assert.ok(b);
    assert.equal(a!.communeSlug, 'an-lam');
    assert.equal(b!.communeSlug, 'an-lam');
    assert.equal(a!.label, 'KĐT ABC');
    assert.equal(b!.label, 'KDT ABC');
    assert.notEqual(a!.slug, b!.slug);
    const slugs = new Set([a!.slug, b!.slug]);
    assert.ok(slugs.has('kdt-abc'));
    assert.ok(slugs.has('kdt-abc-2'));
  });

  it('allows the same placeSlug in two different communes', () => {
    const geos: AddressGeo[] = [
      {
        wardId: 'w1',
        wardName: 'An Lâm',
        districtName: 'Nam Sách',
        provinceName: 'Hải Dương',
        detail: 'Nham Cáp',
      },
      {
        wardId: 'w2',
        wardName: 'Đồng Lạc',
        districtName: 'Nam Sách',
        provinceName: 'Hải Dương',
        detail: 'Nham Cáp',
      },
    ];
    const maps = buildHubSlugMaps(geos);
    assert.equal(maps.placeByWardDetail.get('w1|nham cáp')?.slug, 'nham-cap');
    assert.equal(maps.placeByWardDetail.get('w2|nham cáp')?.slug, 'nham-cap');
  });
});

describe('guestCatalogHubMaps', () => {
  const hongPhongNamSach: AddressGeo = {
    wardId: 'w-hp-ns',
    wardName: 'Hồng Phong',
    districtName: 'Nam Sách',
    provinceName: 'Hải Dương',
    detail: 'Trúc Khê',
  };
  const hongPhongOtherDistrict: AddressGeo = {
    wardId: 'w-hp-km',
    wardName: 'Hồng Phong',
    districtName: 'Kinh Môn',
    provinceName: 'Hải Dương',
    detail: null,
  };

  it('all-published maps suffix the district when a paused listing lives in another district of the same ward name', () => {
    const allPublished = buildHubSlugMaps([hongPhongNamSach, hongPhongOtherDistrict]);
    const openSale = buildHubSlugMaps([hongPhongNamSach]);
    assert.equal(allPublished.communeByWardId.get('w-hp-ns')?.slug, 'hong-phong-nam-sach');
    assert.equal(openSale.communeByWardId.get('w-hp-ns')?.slug, 'hong-phong');
  });

  it('guest maps follow Mở bán geos so listing breadcrumb matches the catalog hub', () => {
    const persisted = new Map<string, CommuneSlugMeta>([
      [
        'w-hp-ns',
        {
          slug: 'hong-phong',
          label: 'Hồng Phong',
          districtLabel: 'Nam Sách',
          provinceLabel: 'Hải Dương',
        },
      ],
    ]);
    const maps = guestCatalogHubMaps([hongPhongNamSach], persisted);
    assert.equal(maps.communeByWardId.get('w-hp-ns')?.slug, 'hong-phong');
    assert.equal(
      maps.placeByWardDetail.get('w-hp-ns|trúc khê')?.communeSlug,
      'hong-phong',
    );
  });
});
