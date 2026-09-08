import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  existingCustomerLookupPlan,
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

  it('Messenger thường uses URL thread as customerUid when scan omits UID', () => {
    const fields = parseScan({
      scanSource: 'messenger_standard',
      scan: { threadId: '100006413621569', employeeUid: '100003051909934' },
    });
    assert.equal(fields.customerUid, '100006413621569');
    assert.equal(fields.threadId, '100006413621569');
  });

  it('E2EE does not treat thread id as customerUid', () => {
    const fields = parseScan({
      scanSource: 'messenger_e2ee',
      scan: {
        threadId: '6846994922073317',
        employeeUid: '100003051909934',
      },
    });
    assert.equal(fields.customerUid, '');
    assert.equal(fields.threadId, '6846994922073317');
  });

  it('E2EE drops customerUid when it equals the thread id', () => {
    const fields = parseScan({
      scanSource: 'messenger_e2ee',
      scan: {
        threadId: '6846994922073317',
        customerUid: '6846994922073317',
      },
    });
    assert.equal(fields.customerUid, '');
  });

  it('E2EE keeps a real Facebook person UID distinct from thread', () => {
    const fields = parseScan({
      scanSource: 'messenger_e2ee',
      scan: {
        threadId: '6846994922073317',
        customerUid: '100015038463287',
        employeeUid: '100003051909934',
      },
    });
    assert.equal(fields.customerUid, '100015038463287');
    const plan = existingCustomerLookupPlan(fields);
    assert.equal(plan[0]?.kind, 'uidPage');
    assert.equal(plan[0] && plan[0].kind === 'uidPage' ? plan[0].customerUid : '', '100015038463287');
    assert.equal(
      plan[0] && plan[0].kind === 'uidPage' ? plan[0].employeeFacebookUid : '',
      '100003051909934',
    );
  });
});
