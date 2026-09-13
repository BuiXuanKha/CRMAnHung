import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isSeoNamedImageKey,
  seoPostImageFileName,
  seoPostImageObjectKey,
  canonicalSeoLotImageObjectKey,
  seoImageObjectKeyNeedsRetarget,
  objectKeyMatchesSeoStem,
  seoImageSlugStem,
  publicOgImageObjectKeyFromWebp,
  publicOgImageUrlFromCoverUrl,
  publicOgLegacyJpegUrlFromCoverUrl,
  publicCdnUrlToSameOriginOgPath,
} from './seo-image.js';

describe('seoPostImageFileName', () => {
  it('names CDN files from the uncut post slug', () => {
    const title =
      'LICOGI 18 Riverside tổng quan khu đô thị Bắc Cầu Hàn ven sông Thái Bình';
    const fileName = seoPostImageFileName({ title, index: 1 });
    assert.equal(
      fileName,
      'licogi-18-riverside-tong-quan-khu-do-thi-bac-cau-han-ven-song-thai-binh-anh-1.webp',
    );
    assert.equal(seoPostImageObjectKey(fileName), `public-web/${fileName}`);
    assert.equal(isSeoNamedImageKey(`public-web/${fileName}`), true);
  });
});

describe('lot image SEO keys at create/edit', () => {
  const lodatId = 'lot1';
  const title = 'Lô đất 105m² Nham Cáp';
  const location = 'Đồng Lạc, Nam Sách, Hải Dương';

  it('builds the canonical CDN key from title + address', () => {
    const key = canonicalSeoLotImageObjectKey({
      lodatId,
      title,
      location,
      index: 1,
    });
    assert.equal(
      key,
      'lodats/lot1/lo-dat-105m-nham-cap-dong-lac-nam-sach-hai-duong-anh-1.webp',
    );
    assert.equal(isSeoNamedImageKey(key), true);
  });

  it('retargets when the key still has an old title slug', () => {
    const desired = canonicalSeoLotImageObjectKey({
      lodatId,
      title,
      location,
      index: 1,
    });
    const oldKey =
      'lodats/lot1/lo-dat-cu-ten-cu-dong-lac-nam-sach-hai-duong-anh-1.webp';
    assert.equal(isSeoNamedImageKey(oldKey), true);
    assert.equal(seoImageObjectKeyNeedsRetarget(oldKey, desired), true);
    assert.equal(objectKeyMatchesSeoStem(oldKey, seoImageSlugStem(title, location)), false);
  });

  it('does not retarget when the key already matches the current slug', () => {
    const desired = canonicalSeoLotImageObjectKey({
      lodatId,
      title,
      location,
      index: 2,
    });
    assert.equal(seoImageObjectKeyNeedsRetarget(desired, desired), false);
    assert.equal(
      objectKeyMatchesSeoStem(desired, seoImageSlugStem(title, location)),
      true,
    );
  });
});


describe('public OG PNG sibling keys', () => {
  it('derives ….og.png from a gallery WebP object key', () => {
    assert.equal(
      publicOgImageObjectKeyFromWebp(
        'lodats/lot1/lo-dat-105m-nham-cap-dong-lac-nam-sach-hai-duong-anh-1.webp',
      ),
      'lodats/lot1/lo-dat-105m-nham-cap-dong-lac-nam-sach-hai-duong-anh-1.og.png',
    );
    assert.equal(publicOgImageObjectKeyFromWebp('lodats/lot1/photo.jpg'), null);
  });

  it('rewrites cover CDN WebP URLs for og:image', () => {
    assert.equal(
      publicOgImageUrlFromCoverUrl(
        'https://cdn.anhungland.com/lodats/lot1/foo-anh-1.webp',
      ),
      'https://cdn.anhungland.com/lodats/lot1/foo-anh-1.og.png',
    );
    assert.equal(publicOgImageUrlFromCoverUrl('/og-default.png'), null);
  });

  it('rewrites cover CDN WebP URLs to legacy ….og.jpg', () => {
    assert.equal(
      publicOgLegacyJpegUrlFromCoverUrl(
        'https://cdn.anhungland.com/lodats/lot1/foo-anh-1.webp',
      ),
      'https://cdn.anhungland.com/lodats/lot1/foo-anh-1.og.jpg',
    );
  });

  it('maps CDN URLs onto same-origin /og-media proxy paths', () => {
    assert.equal(
      publicCdnUrlToSameOriginOgPath(
        'https://cdn.anhungland.com/lodats/lot1/foo-anh-1.og.jpg',
      ),
      '/og-media/lodats/lot1/foo-anh-1.og.jpg',
    );
    assert.equal(publicCdnUrlToSameOriginOgPath('/og-default.png'), null);
    assert.equal(
      publicCdnUrlToSameOriginOgPath('https://evil.example/lodats/x.webp'),
      null,
    );
  });
});
