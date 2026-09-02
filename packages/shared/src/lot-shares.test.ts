import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  buildLotShareUrl,
  normalizeShareCode,
  pickShareCode,
} from './lot-shares.js';

describe('normalizeShareCode', () => {
  it('uppercases a valid 5-char code', () => {
    assert.equal(normalizeShareCode('ab2k9'), 'AB2K9');
  });

  it('rejects letters I/O and digits 0/1', () => {
    assert.equal(normalizeShareCode('ABC0I'), '');
    assert.equal(normalizeShareCode('not-a-code'), '');
  });
});

describe('pickShareCode', () => {
  it('prefers query over cookie', () => {
    assert.equal(pickShareCode('xy34z', 'ab2k9'), 'XY34Z');
  });

  it('falls back to cookie when query is empty', () => {
    assert.equal(pickShareCode('', 'ab2k9'), 'AB2K9');
    assert.equal(pickShareCode(null, 'ab2k9'), 'AB2K9');
  });

  it('returns empty when neither is a share code', () => {
    assert.equal(pickShareCode('?utm=1', 'nope'), '');
  });
});

describe('buildLotShareUrl', () => {
  it('puts share on the short /dat path', () => {
    assert.equal(
      buildLotShareUrl('https://anhungland.com', 'lo-33', 'ab2k9'),
      'https://anhungland.com/dat/lo-33?share=AB2K9',
    );
  });
});
