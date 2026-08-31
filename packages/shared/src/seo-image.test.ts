import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  isSeoNamedImageKey,
  seoPostImageFileName,
  seoPostImageObjectKey,
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
