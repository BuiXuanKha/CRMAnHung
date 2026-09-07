import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { nextUniqueLotGuestSlug } from './lot-guest-slug';

describe('nextUniqueLotGuestSlug', () => {
  it('keeps the root when nothing occupies the guest URL', async () => {
    const slug = await nextUniqueLotGuestSlug('lo-dat-nam-sach', async () => false);
    assert.equal(slug, 'lo-dat-nam-sach');
  });

  it('appends -2 when the root is a live listing or a 301 fromSlug', async () => {
    const occupied = new Set(['lo-dat-nam-sach']);
    const slug = await nextUniqueLotGuestSlug('lo-dat-nam-sach', async (candidate) =>
      occupied.has(candidate),
    );
    assert.equal(slug, 'lo-dat-nam-sach-2');
  });
});
