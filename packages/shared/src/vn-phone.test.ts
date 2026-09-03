import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { digitsFromPhoneRaw } from './vn-phone.js';

describe('digitsFromPhoneRaw', () => {
  it('keeps 10 digits when paste includes spaces', () => {
    assert.equal(digitsFromPhoneRaw('0977 656 280'), '0977656280');
  });

  it('strips dots and dashes', () => {
    assert.equal(digitsFromPhoneRaw('0977.656.280'), '0977656280');
    assert.equal(digitsFromPhoneRaw('0977-656-280'), '0977656280');
  });

  it('maps +84 to leading 0', () => {
    assert.equal(digitsFromPhoneRaw('+84 977 656 280'), '0977656280');
  });

  it('maps 84 + 9 subscriber digits to leading 0', () => {
    assert.equal(digitsFromPhoneRaw('84977656280'), '0977656280');
  });

  it('caps at 10 digits', () => {
    assert.equal(digitsFromPhoneRaw('0977656280999'), '0977656280');
  });

  it('returns empty for blank', () => {
    assert.equal(digitsFromPhoneRaw('   '), '');
  });
});
