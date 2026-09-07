import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  applyPersistedCommuneSlugs,
  nextUniqueHubSlug,
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
