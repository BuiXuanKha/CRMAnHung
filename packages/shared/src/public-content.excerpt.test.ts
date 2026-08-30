import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  META_DESCRIPTION_MAX,
  PUBLIC_POST_EXCERPT_MAX,
  clipMetaDescription,
  listingBodyToExcerpt,
  postBodyToExcerpt,
  shouldShowPostLead,
} from './public-content.js';

describe('clipMetaDescription (teaser UI)', () => {
  it('returns short text unchanged', () => {
    assert.equal(clipMetaDescription('Khu đô thị Tây Nam Sách'), 'Khu đô thị Tây Nam Sách');
  });

  it('clips to 160 chars on a word boundary', () => {
    const words = Array.from({ length: 40 }, (_, i) => `từ${i}`).join(' ');
    const clipped = clipMetaDescription(words);
    assert.ok(clipped.length <= META_DESCRIPTION_MAX);
    assert.ok(clipped.endsWith('…'));
    assert.equal(clipped.includes('  '), false);
  });
});

describe('listingBodyToExcerpt (lot listings)', () => {
  it('keeps up to 2000 chars of plain text', () => {
    const body = `<p>${'a'.repeat(1800)}</p>`;
    const excerpt = listingBodyToExcerpt(body);
    assert.equal(excerpt.length, 1800);
  });

  it('clips above 2000 with an ellipsis', () => {
    const excerpt = listingBodyToExcerpt(`<p>${'b'.repeat(2100)}</p>`);
    assert.equal(excerpt.length, 2000);
    assert.ok(excerpt.endsWith('…'));
  });
});

describe('postBodyToExcerpt (new posts)', () => {
  it('clips auto excerpt to schema max 320', () => {
    const html = `<p>${Array.from({ length: 80 }, (_, i) => `đoạn${i}`).join(' ')}</p>`;
    const excerpt = postBodyToExcerpt(html);
    assert.ok(excerpt.length <= PUBLIC_POST_EXCERPT_MAX);
    assert.ok(excerpt.endsWith('…'));
    assert.notEqual(excerpt, listingBodyToExcerpt(html));
  });

  it('returns empty for empty HTML', () => {
    assert.equal(postBodyToExcerpt('<p>  </p>'), '');
    assert.equal(postBodyToExcerpt(''), '');
  });
});

describe('shouldShowPostLead', () => {
  it('hides lead when excerpt is the full article and bodyHtml exists', () => {
    const body = Array.from({ length: 80 }, (_, i) => `đoạn${i}`).join(' ');
    assert.equal(
      shouldShowPostLead({ excerpt: body, bodyHtml: `<p>${body}</p>` }),
      false,
    );
  });

  it('shows a short excerpt even when bodyHtml exists', () => {
    assert.equal(
      shouldShowPostLead({
        excerpt: 'Khu đô thị Tây Nam Sách tại Nam Sách, Hải Dương.',
        bodyHtml: '<p>Nội dung bài dài hơn teaser.</p>',
      }),
      true,
    );
  });

  it('shows a long excerpt when there is no bodyHtml', () => {
    const excerpt = Array.from({ length: 80 }, (_, i) => `đoạn${i}`).join(' ');
    assert.equal(shouldShowPostLead({ excerpt, bodyHtml: '' }), true);
  });
});
