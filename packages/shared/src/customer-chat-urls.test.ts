import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  facebookInboxChatUrl,
  facebookPageUrlFromRawMeta,
  messengerComUrl,
  numericMessengerId,
} from './customer-chat-urls.js';

describe('facebookInboxChatUrl', () => {
  it('opens Business Suite pageUrl for Page inbox (not facebook.com/messages/t/)', () => {
    const pageUrl =
      'https://business.facebook.com/latest/inbox/all/?asset_id=1&selected_item_id=999';
    assert.equal(
      facebookInboxChatUrl({
        scanSource: 'business_suite',
        threadId: '12345678901',
        pageUrl,
      }),
      pageUrl,
    );
  });

  it('opens e2ee inbox path for messenger_e2ee', () => {
    assert.equal(
      facebookInboxChatUrl({
        scanSource: 'messenger_e2ee',
        threadId: '1430292848506081',
      }),
      'https://www.facebook.com/messages/e2ee/t/1430292848506081',
    );
  });

  it('opens personal Messenger inbox for standard thread id', () => {
    assert.equal(
      facebookInboxChatUrl({
        scanSource: 'messenger_standard',
        threadId: '100012345678901',
      }),
      'https://www.facebook.com/messages/t/100012345678901',
    );
  });

  it('falls back to facebook pageUrl when thread id is missing', () => {
    const pageUrl = 'https://www.facebook.com/messages/t/5555566666';
    assert.equal(
      facebookInboxChatUrl({
        scanSource: 'messenger_standard',
        threadId: '',
        pageUrl,
      }),
      pageUrl,
    );
  });

  it('returns null when there is no usable inbox URL', () => {
    assert.equal(
      facebookInboxChatUrl({
        scanSource: 'hotline',
        threadId: 'abc',
        pageUrl: 'https://example.com',
      }),
      null,
    );
  });
});

describe('messengerComUrl', () => {
  it('prefers thread id then customer uid', () => {
    assert.equal(
      messengerComUrl({ threadId: '12345678', customerUid: '99999999' }),
      'https://www.messenger.com/t/12345678',
    );
    assert.equal(
      messengerComUrl({ customerUid: '99999999' }),
      'https://www.messenger.com/t/99999999',
    );
  });
});

describe('numericMessengerId / rawMeta pageUrl', () => {
  it('picks the longest digit run', () => {
    assert.equal(numericMessengerId('fb:10001234567'), '10001234567');
    assert.equal(numericMessengerId('x'), null);
  });

  it('reads pageUrl from migrate rawMeta JSON', () => {
    assert.equal(
      facebookPageUrlFromRawMeta(
        JSON.stringify({ threadType: 'user', pageUrl: 'https://www.facebook.com/messages/e2ee/t/1' }),
      ),
      'https://www.facebook.com/messages/e2ee/t/1',
    );
    assert.equal(facebookPageUrlFromRawMeta('not-json'), null);
  });
});
