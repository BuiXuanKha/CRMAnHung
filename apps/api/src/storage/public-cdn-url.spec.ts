import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { isAllowedPublicCdnImageUrl } from './public-cdn-url';

describe('isAllowedPublicCdnImageUrl', () => {
  const base = 'https://cdn.anhungland.com';

  it('allows CDN object URLs', () => {
    assert.equal(
      isAllowedPublicCdnImageUrl(
        'https://cdn.anhungland.com/lodats/abc/lo-anh-1.webp',
        base,
      ),
      true,
    );
  });

  it('allows hostname from R2_PUBLIC_BASE_URL', () => {
    assert.equal(
      isAllowedPublicCdnImageUrl(
        'https://media.example.com/lodats/a.webp',
        'https://media.example.com',
      ),
      true,
    );
  });

  it('allows r2.dev public URLs', () => {
    assert.equal(
      isAllowedPublicCdnImageUrl(
        'https://pub-abc.r2.dev/lodats/a.webp',
        base,
      ),
      true,
    );
  });

  it('rejects other hosts and schemes', () => {
    assert.equal(isAllowedPublicCdnImageUrl('https://evil.example/x.webp', base), false);
    assert.equal(isAllowedPublicCdnImageUrl('http://cdn.anhungland.com/a.webp', base), false);
    assert.equal(isAllowedPublicCdnImageUrl('https://cdn.anhungland.com/', base), false);
    assert.equal(
      isAllowedPublicCdnImageUrl('https://user:pass@cdn.anhungland.com/a.webp', base),
      false,
    );
  });
});
