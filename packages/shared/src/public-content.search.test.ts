import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PUBLIC_LISTING_PATH,
  listingCatalogSearchPath,
  matchPublicListingSearch,
} from './public-content.js';

describe('listingCatalogSearchPath', () => {
  it('returns the catalog path when the keyword is empty', () => {
    assert.equal(listingCatalogSearchPath('  '), PUBLIC_LISTING_PATH);
  });

  it('puts q on the catalog path', () => {
    assert.equal(
      listingCatalogSearchPath('Nam Trung'),
      `${PUBLIC_LISTING_PATH}?q=Nam+Trung`,
    );
  });
});

describe('matchPublicListingSearch', () => {
  const row = {
    title: 'Lô đất 158 m² tại Phù Liễn',
    location: 'Phù Liễn, Nam Sách, Hải Dương',
    areaLabel: '158 m²',
    placeLabel: 'KĐT Đông Khê',
    communeLabel: 'Hồng Phong',
    excerpt: 'Mặt đường liên xã, gần chợ.',
    kindLabel: 'Đất',
    priceLabel: '1 tỷ xxx',
  };

  it('matches title, address, area, and place', () => {
    assert.equal(matchPublicListingSearch(row, 'phù liễn'), true);
    assert.equal(matchPublicListingSearch(row, '158'), true);
    assert.equal(matchPublicListingSearch(row, 'Đông Khê'), true);
    assert.equal(matchPublicListingSearch(row, 'hồng phong'), true);
  });

  it('returns true when the keyword is empty', () => {
    assert.equal(matchPublicListingSearch(row, '  '), true);
  });

  it('returns false when nothing matches', () => {
    assert.equal(matchPublicListingSearch(row, 'Mạn Đê'), false);
  });
});
