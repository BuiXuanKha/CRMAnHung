import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  avatarFileToken,
  avatarSourceKeyFromRawMeta,
  customerAvatarObjectKey,
  extractAvatarLibraryKey,
  extractAvatarSourceKey,
  ingestMessengerAvatar,
  resolveAvatarFromScan,
} from './messenger-avatar-ingest';
import type { StorageService } from '../../storage/storage.service';

function mockStorage(opts?: {
  exists?: boolean;
  upload?: (input: { objectKey?: string; contentType: string }) => Promise<{ objectKey: string }>;
}): StorageService {
  return {
    publicObjectExists: async () => opts?.exists ?? false,
    upload: async (input: { objectKey?: string; contentType: string }) => {
      if (opts?.upload) return opts.upload(input);
      return { objectKey: input.objectKey, url: 'https://cdn.example/x.webp', visibility: 'public' };
    },
  } as unknown as StorageService;
}

describe('messenger-avatar-ingest', () => {
  it('extracts FB CDN pathname as the stable source key', () => {
    assert.equal(
      extractAvatarSourceKey(
        'https://scontent-iad3-1.xx.fbcdn.net/v/t1.30497-1/foo_n.jpg?oh=abc&oe=def',
      ),
      '/v/t1.30497-1/foo_n.jpg',
    );
    assert.equal(extractAvatarSourceKey('/img/avatars/a.jpg'), null);
    assert.equal(extractAvatarSourceKey('data:image/jpeg;base64,AAAA'), null);
  });

  it('reuses customers/avatars keys from CDN URLs', () => {
    assert.equal(
      extractAvatarLibraryKey('https://cdn.anhungland.com/customers/avatars/c1/ab.webp'),
      'customers/avatars/c1/ab.webp',
    );
    assert.equal(extractAvatarLibraryKey('/img/avatars/a.jpg'), null);
  });

  it('builds a per-customer WebP key from the source pathname', () => {
    const source = '/v/t1.30497-1/foo_n.jpg';
    const key = customerAvatarObjectKey('clxyzCustomer', source);
    assert.equal(key, `customers/avatars/clxyzCustomer/${avatarFileToken(source)}.webp`);
  });

  it('reads avatarSourceKey from migrated rawMeta', () => {
    assert.equal(
      avatarSourceKeyFromRawMeta(JSON.stringify({ avatarSourceKey: '/v/t39.30808-1/x.jpg' })),
      '/v/t39.30808-1/x.jpg',
    );
    assert.equal(avatarSourceKeyFromRawMeta('not-json'), null);
  });

  it('skips re-download when FB pathname and R2 key already match', async () => {
    const stored = {
      avatarUrl: '/img/avatars/old.jpg',
      avatarObjectKey: 'customers/avatars/old.jpg',
      avatarSourceKey: '/v/t1.30497-1/foo_n.jpg',
    };
    const result = await resolveAvatarFromScan(
      mockStorage({
        upload: async () => {
          throw new Error('should not upload');
        },
      }),
      'https://scontent.xx.fbcdn.net/v/t1.30497-1/foo_n.jpg?oh=1',
      stored,
      'cust1',
    );
    assert.equal(result.changed, false);
    assert.equal(result.avatarObjectKey, stored.avatarObjectKey);
  });

  it('keeps the previous avatar when the scan sends an empty URL', async () => {
    const stored = {
      avatarUrl: null,
      avatarObjectKey: 'customers/avatars/cust1/ab.webp',
      avatarSourceKey: '/v/t1/a.jpg',
    };
    const result = await resolveAvatarFromScan(mockStorage(), '', stored, 'cust1');
    assert.equal(result.changed, false);
    assert.equal(result.avatarObjectKey, stored.avatarObjectKey);
  });

  it('uploads a remote FB avatar when fetch returns a raster', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () =>
      new Response(jpeg, {
        status: 200,
        headers: { 'content-type': 'image/jpeg' },
      })) as typeof fetch;
    try {
      const calls: string[] = [];
      const result = await resolveAvatarFromScan(
        mockStorage({
          upload: async (input) => {
            calls.push(input.objectKey ?? '');
            return { objectKey: input.objectKey ?? 'missing' };
          },
        }),
        'https://scontent.xx.fbcdn.net/v/t1.30497-1/foo_n.jpg',
        { avatarUrl: null, avatarObjectKey: null, avatarSourceKey: null },
        'cust1',
      );
      assert.ok(result.avatarObjectKey?.startsWith('customers/avatars/cust1/'));
      assert.equal(result.avatarSourceKey, '/v/t1.30497-1/foo_n.jpg');
      assert.equal(calls.length, 1);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('uploads a data-URL raster through storage.upload', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const calls: { objectKey?: string }[] = [];
    const storage = mockStorage({
      upload: async (input) => {
        calls.push({ objectKey: input.objectKey });
        return { objectKey: input.objectKey ?? 'missing' };
      },
    });
    const key = await ingestMessengerAvatar(
      storage,
      `data:image/jpeg;base64,${jpeg.toString('base64')}`,
      { customerId: 'cust1', sourceKey: null },
    );
    assert.equal(key, 'customers/avatars/cust1/avatar.webp');
    assert.equal(calls.length, 1);
  });

  it('falls back to the FB URL when fetch fails and no R2 object exists', async () => {
    const incoming = 'https://scontent.xx.fbcdn.net/v/t1.30497-1/new_n.jpg?oh=1';
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error('network');
    }) as typeof fetch;
    try {
      const result = await resolveAvatarFromScan(
        mockStorage(),
        incoming,
        { avatarUrl: null, avatarObjectKey: null, avatarSourceKey: null },
        'cust1',
      );
      assert.equal(result.avatarObjectKey, null);
      assert.equal(result.avatarUrl, incoming);
      assert.equal(result.avatarSourceKey, '/v/t1.30497-1/new_n.jpg');
      assert.equal(result.changed, true);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('keeps the previous R2 avatar when a new fetch fails', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error('network');
    }) as typeof fetch;
    try {
      const stored = {
        avatarUrl: null,
        avatarObjectKey: 'customers/avatars/cust1/old.webp',
        avatarSourceKey: '/v/t1/old.jpg',
      };
      const result = await resolveAvatarFromScan(
        mockStorage(),
        'https://scontent.xx.fbcdn.net/v/t1/new.jpg',
        stored,
        'cust1',
      );
      assert.equal(result.changed, false);
      assert.equal(result.avatarObjectKey, stored.avatarObjectKey);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
