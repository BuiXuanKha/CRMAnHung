import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  mergeFacebookRawMeta,
  messagesWithStableBubbleId,
  parseScan,
} from './from-extension-parse';

describe('from-extension-parse', () => {
  it('reads scan.avatarUrl', () => {
    const fields = parseScan({
      scan: {
        threadId: '12345',
        customerName: 'An',
        avatarUrl: 'https://scontent.xx.fbcdn.net/v/t1/foo_n.jpg?oh=1',
      },
    });
    assert.equal(fields.threadId, '12345');
    assert.equal(
      fields.avatarUrl,
      'https://scontent.xx.fbcdn.net/v/t1/foo_n.jpg?oh=1',
    );
  });

  it('keeps migrated avatarSourceKey when overlaying a new scanDebug', () => {
    const existing = JSON.stringify({
      avatarSourceKey: '/v/t1/old.jpg',
      pageUrl: 'https://www.facebook.com/messages/t/1',
    });
    const merged = mergeFacebookRawMeta(existing, 'https://www.facebook.com/messages/t/2', {
      mailboxId: 'mb-1',
      avatarSourceKey: '/v/t1/new.jpg',
    });
    assert.ok(merged);
    const obj = JSON.parse(merged ?? '{}') as {
      avatarSourceKey?: string;
      pageUrl?: string;
      mailboxId?: string;
    };
    assert.equal(obj.avatarSourceKey, '/v/t1/new.jpg');
    assert.equal(obj.pageUrl, 'https://www.facebook.com/messages/t/2');
    assert.equal(obj.mailboxId, 'mb-1');
  });

  it('keeps mid.$ and @msgr. bubbles and drops orphan payloads', () => {
    const kept = messagesWithStableBubbleId([
      { id: 'mid.$cAAAABw8DMliiztBzuWcnYsq7UqG7', text: 'ok' },
      { id: '61554658944796@msgr.7268147072476543043', text: 'e2ee' },
      { id: '', text: 'orphan', dedupeKey: 'orphan::0::x' },
      { text: 'no id' },
    ]);
    assert.equal(kept.length, 2);
    assert.equal(kept[0]?.id, 'mid.$cAAAABw8DMliiztBzuWcnYsq7UqG7');
    assert.equal(kept[1]?.id, '61554658944796@msgr.7268147072476543043');
  });

  it('does not drop avatarSourceKey when scanDebug omits it', () => {
    const existing = JSON.stringify({ avatarSourceKey: '/v/t1/keep.jpg', assetId: '1' });
    const merged = mergeFacebookRawMeta(existing, null, { mailboxId: 'mb-2' });
    const obj = JSON.parse(merged ?? '{}') as { avatarSourceKey?: string; mailboxId?: string };
    assert.equal(obj.avatarSourceKey, '/v/t1/keep.jpg');
    assert.equal(obj.mailboxId, 'mb-2');
  });
});
