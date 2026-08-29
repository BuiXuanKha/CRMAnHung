import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  chatImageObjectKey,
  extractChatLibraryKey,
  ingestMessengerChatImage,
  isAllowedMessengerImageHost,
  parseMediaDataUrl,
  safeChatFileToken,
} from './messenger-image-ingest';
import type { StorageService } from '../../storage/storage.service';

describe('messenger-image-ingest', () => {
  it('builds a WebP chat library key', () => {
    const key = chatImageObjectKey('clxyzCustomer', 'mid.abc-1', 3, 0);
    assert.equal(key, 'customers/chat/clxyzCustomer/mid.abc-1-3-0.webp');
  });

  it('sanitizes message tokens for object keys', () => {
    assert.equal(safeChatFileToken('mid.abc xyz'), 'mid.abc_xyz');
  });

  it('reuses customers/chat keys from CDN URLs', () => {
    assert.equal(
      extractChatLibraryKey(
        'https://cdn.anhungland.com/customers/chat/abc/mid.1-0-0.webp',
      ),
      'customers/chat/abc/mid.1-0-0.webp',
    );
    assert.equal(extractChatLibraryKey('customers/chat/abc/file.jpg'), 'customers/chat/abc/file.jpg');
    assert.equal(extractChatLibraryKey('/img/imgsmessenger/1/a.jpg'), null);
  });

  it('parses image data URLs and rejects video', () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const dataUrl = `data:image/jpeg;base64,${jpeg.toString('base64')}`;
    const parsed = parseMediaDataUrl(dataUrl);
    assert.ok(parsed);
    assert.equal(parsed?.mime, 'image/jpeg');
    assert.equal(parseMediaDataUrl('data:video/mp4;base64,AAAA'), null);
  });

  it('allows only Facebook image hosts', () => {
    assert.equal(isAllowedMessengerImageHost('scontent.xx.fbcdn.net'), true);
    assert.equal(isAllowedMessengerImageHost('127.0.0.1'), false);
    assert.equal(isAllowedMessengerImageHost('evil.example'), false);
  });

  it('uploads a data-URL raster through storage.upload', async () => {
    const jpeg = Buffer.from([0xff, 0xd8, 0xff, 0xd9]);
    const calls: { objectKey?: string; contentType: string }[] = [];
    const storage = {
      publicObjectExists: async () => false,
      upload: async (input: { objectKey?: string; contentType: string; buffer: Buffer }) => {
        calls.push({ objectKey: input.objectKey, contentType: input.contentType });
        return { objectKey: input.objectKey, url: 'https://cdn.example/x.webp', visibility: 'public' };
      },
    } as unknown as StorageService;

    const key = await ingestMessengerChatImage(
      storage,
      `data:image/jpeg;base64,${jpeg.toString('base64')}`,
      { customerId: 'cust1', messageId: 'mid.one', sortOrder: 0, imageIndex: 0 },
    );
    assert.equal(key, 'customers/chat/cust1/mid.one-0-0.webp');
    assert.equal(calls.length, 1);
    assert.equal(calls[0]?.objectKey, key);
    assert.equal(calls[0]?.contentType, 'image/jpeg');
  });

  it('skips legacy disk paths', async () => {
    const storage = {
      publicObjectExists: async () => false,
      upload: async () => {
        throw new Error('should not upload');
      },
    } as unknown as StorageService;
    const key = await ingestMessengerChatImage(storage, '/img/imgsmessenger/12/a.jpg', {
      customerId: 'cust1',
      messageId: 'mid.one',
      sortOrder: 0,
      imageIndex: 0,
    });
    assert.equal(key, null);
  });
});
