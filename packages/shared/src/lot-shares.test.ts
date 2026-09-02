import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  PUBLIC_SHARE_COOKIE_TTL_MS,
  buildLotShareUrl,
  contactFromAuthUser,
  guestLotShareUrl,
  nextPublicShareCookie,
  normalizeShareCode,
  pickShareCode,
  resolvePublicShareOrigin,
  serializePublicShareCookie,
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

  it('reads shareCode from a JSON cookie payload', () => {
    const raw = serializePublicShareCookie({
      shareCode: 'AB2K9',
      employeeId: 'emp-a',
      expiresAtMs: 1_900_000_000_000,
    });
    assert.equal(pickShareCode('', raw), 'AB2K9');
  });

  it('returns empty when neither is a share code', () => {
    assert.equal(pickShareCode('?utm=1', 'nope'), '');
  });
});

describe('buildLotShareUrl', () => {
  it('puts share on the canonical catalog path', () => {
    assert.equal(
      buildLotShareUrl('https://anhungland.com', 'lo-33', 'ab2k9'),
      'https://anhungland.com/mua-ban-nha-dat-huyen-nam-sach/lo-33?share=AB2K9',
    );
  });

  it('rewrites loopback origin to the public site', () => {
    assert.equal(
      buildLotShareUrl('http://127.0.0.1:5001', 'lo-33', 'D4XD7'),
      'https://anhungland.com/mua-ban-nha-dat-huyen-nam-sach/lo-33?share=D4XD7',
    );
  });
});

describe('resolvePublicShareOrigin', () => {
  it('defaults empty and loopback to anhungland.com', () => {
    assert.equal(resolvePublicShareOrigin(undefined), 'https://anhungland.com');
    assert.equal(resolvePublicShareOrigin('http://127.0.0.1:5001'), 'https://anhungland.com');
    assert.equal(resolvePublicShareOrigin('http://localhost:5001'), 'https://anhungland.com');
  });
});

describe('guestLotShareUrl', () => {
  it('ignores a loopback origin override', () => {
    assert.equal(
      guestLotShareUrl('ban-dat-136m2-van-tai-dong-hong-phong', 'd4xd7', 'http://127.0.0.1:5001'),
      'https://anhungland.com/mua-ban-nha-dat-huyen-nam-sach/ban-dat-136m2-van-tai-dong-hong-phong?share=D4XD7',
    );
  });
});

describe('contactFromAuthUser', () => {
  it('returns name and phone when both are present', () => {
    assert.deepEqual(
      contactFromAuthUser({ fullName: 'Bùi Xuân Khả', phone: '0977656280' }),
      { fullName: 'Bùi Xuân Khả', phone: '0977656280' },
    );
  });

  it('passes through avatarUrl when present', () => {
    assert.deepEqual(
      contactFromAuthUser({
        fullName: 'Bùi Xuân Khả',
        phone: '0977656280',
        avatarUrl: 'https://cdn.anhungland.com/users/avatars/x.webp',
      }),
      {
        fullName: 'Bùi Xuân Khả',
        phone: '0977656280',
        avatarUrl: 'https://cdn.anhungland.com/users/avatars/x.webp',
      },
    );
  });

  it('returns null without a usable phone', () => {
    assert.equal(contactFromAuthUser({ fullName: 'B', phone: '' }), null);
    assert.equal(contactFromAuthUser({ fullName: 'B', phone: null }), null);
    assert.equal(contactFromAuthUser(null), null);
  });
});

describe('nextPublicShareCookie', () => {
  const now = 1_700_000_000_000;

  it('starts a 30-day window on first click', () => {
    const next = nextPublicShareCookie({
      nowMs: now,
      shareCode: 'ab2k9',
      employeeId: 'emp-a',
      existing: null,
    });
    assert.equal(next.shareCode, 'AB2K9');
    assert.equal(next.employeeId, 'emp-a');
    assert.equal(next.expiresAtMs, now + PUBLIC_SHARE_COOKIE_TTL_MS);
  });

  it('keeps expiry when the same employee shares another listing', () => {
    const existing = {
      shareCode: 'AB2K9',
      employeeId: 'emp-a',
      expiresAtMs: now + 10 * 24 * 60 * 60 * 1000,
    };
    const next = nextPublicShareCookie({
      nowMs: now,
      shareCode: 'xy34z',
      employeeId: 'emp-a',
      existing,
    });
    assert.equal(next.shareCode, 'XY34Z');
    assert.equal(next.expiresAtMs, existing.expiresAtMs);
  });

  it('restarts 30 days when the employee changes', () => {
    const existing = {
      shareCode: 'AB2K9',
      employeeId: 'emp-a',
      expiresAtMs: now + 10 * 24 * 60 * 60 * 1000,
    };
    const next = nextPublicShareCookie({
      nowMs: now,
      shareCode: 'xy34z',
      employeeId: 'emp-b',
      existing,
    });
    assert.equal(next.employeeId, 'emp-b');
    assert.equal(next.expiresAtMs, now + PUBLIC_SHARE_COOKIE_TTL_MS);
  });
});
