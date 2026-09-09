import { describe, expect, it } from 'vitest';
import {
  obfuscatePublicPriceLabel,
  resolveStaffListingPublicPrice,
  suggestPublicPrice,
} from './public-content.js';

describe('obfuscatePublicPriceLabel / suggestPublicPrice', () => {
  it('maps tỷ and triệu brackets', () => {
    expect(obfuscatePublicPriceLabel(3_700_000_000)).toBe('3 tỷ xxx');
    expect(obfuscatePublicPriceLabel(950_000_000)).toBe('9xx triệu');
    expect(obfuscatePublicPriceLabel(50_000_000)).toBe('xxx triệu');
    expect(suggestPublicPrice(0)).toEqual({ priceMode: 'CONTACT', priceLabel: null });
    expect(suggestPublicPrice(null)).toEqual({ priceMode: 'CONTACT', priceLabel: null });
  });
});

describe('resolveStaffListingPublicPrice', () => {
  it('prefills CRM suggestion when chưa soạn', () => {
    expect(
      resolveStaffListingPublicPrice({
        crmPriceVnd: 3_700_000_000,
        listingPriceMode: 'CONTACT',
        listingPriceLabel: null,
        needsCompose: true,
      }),
    ).toEqual({ priceMode: 'AMOUNT', priceLabel: '3 tỷ xxx' });
  });

  it('keeps Liên hệ after staff đã soạn CONTACT', () => {
    expect(
      resolveStaffListingPublicPrice({
        crmPriceVnd: 3_700_000_000,
        listingPriceMode: 'CONTACT',
        listingPriceLabel: null,
        needsCompose: false,
      }),
    ).toEqual({ priceMode: 'CONTACT', priceLabel: null });
  });

  it('keeps staff AMOUNT label', () => {
    expect(
      resolveStaffListingPublicPrice({
        crmPriceVnd: 3_700_000_000,
        listingPriceMode: 'AMOUNT',
        listingPriceLabel: '3 tỷ xxx',
        needsCompose: false,
      }),
    ).toEqual({ priceMode: 'AMOUNT', priceLabel: '3 tỷ xxx' });
  });
});
