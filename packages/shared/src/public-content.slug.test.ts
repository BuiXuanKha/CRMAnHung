import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { toListingPublicSlug, toPublicPostSlug, toPublicSlug } from './public-content.js';

describe('toPublicPostSlug', () => {
  it('keeps a long Vietnamese title without the default 60-char cut', () => {
    const title =
      'LICOGI 18 Riverside tổng quan khu đô thị Bắc Cầu Hàn ven sông Thái Bình';
    const slug = toPublicPostSlug(title);
    const truncated = toPublicSlug(title);
    assert.ok(slug.length > truncated.length);
    assert.equal(
      slug,
      'licogi-18-riverside-tong-quan-khu-do-thi-bac-cau-han-ven-song-thai-binh',
    );
    assert.ok(!slug.endsWith('thai-b'));
  });

  it('does not slice mid-word at 80 characters', () => {
    const title =
      'Khu dân cư mới Đồng Khê không gian sống hiện đại tại Nam Sách Hải Dương quý 3 năm 2026';
    const slug = toPublicPostSlug(title);
    const cut80 = toPublicSlug(title, 80);
    assert.ok(slug.length > 80);
    assert.ok(cut80.length <= 80);
    assert.ok(slug.length > cut80.length);
    assert.equal(slug.includes('hai-duong'), true);
    assert.ok(!slug.endsWith('-'));
  });

  it('falls back when the title has no latin letters', () => {
    assert.equal(toPublicPostSlug('!!!'), 'bai-viet');
  });
});

describe('toListingPublicSlug', () => {
  it('keeps m2 when the title uses m²', () => {
    assert.equal(
      toListingPublicSlug('Lô đất 105m² tại Nham Cáp, Đồng Lạc', 'Nham Cáp, Đồng Lạc, Nam Sách, Hải Dương'),
      'lo-dat-105m2-tai-nham-cap-dong-lac-nam-sach-hai-duong',
    );
  });
});
