import {
  publicPriceLabelToVnd,
  type LotGptLocation,
  type LotGptRequestDraft,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { lotPriceDisplay } from './display';

/** Default copy when listing has no public amount. */
export const LOT_GPT_DEFAULT_PRICE_TEXT =
  'Giá đẹp – thương lượng trực tiếp với chủ';

/**
 * Split public location string (detail, ward, district, province) into GPT parts.
 * Matches CRM `formatAddress` join order.
 */
export function parseLotGptLocation(location: string): LotGptLocation {
  const parts = location
    .split(',')
    .map((p) => p.trim())
    .filter(Boolean);

  if (parts.length >= 4) {
    return {
      village: parts.slice(0, -3).join(', '),
      commune: parts[parts.length - 3] ?? '',
      district: parts[parts.length - 2] ?? '',
      province: parts[parts.length - 1] ?? '',
    };
  }
  if (parts.length === 3) {
    return {
      village: '',
      commune: parts[0] ?? '',
      district: parts[1] ?? '',
      province: parts[2] ?? '',
    };
  }
  if (parts.length === 2) {
    return {
      village: '',
      commune: '',
      district: parts[0] ?? '',
      province: parts[1] ?? '',
    };
  }
  if (parts.length === 1) {
    return {
      village: parts[0] ?? '',
      commune: '',
      district: '',
      province: '',
    };
  }
  return { village: '', commune: '', district: '', province: '' };
}

/** Parse “Thổ cư 99m2” / “TC 99 m²” from title or excerpt when CRM has no field. */
export function parseResidentialAreaM2(...texts: Array<string | null | undefined>): number | null {
  for (const text of texts) {
    if (!text?.trim()) continue;
    const match = text.match(
      /(?:thổ\s*cư|tho\s*cu|tc)\s*[:：]?\s*([\d]+(?:[.,]\d+)?)\s*(?:m2|m²|m\b)?/i,
    );
    if (!match) continue;
    const n = Number(match[1].replace(',', '.'));
    if (Number.isFinite(n) && n > 0) return n;
  }
  return null;
}

/**
 * Build GPT request JSON from a staff open-lot row (public-safe fields only).
 */
export function buildLotGptRequestPayload(
  lot: PublicWebStaffLotRow,
  extraDescription?: string,
): LotGptRequestDraft {
  const priceDisplay = lotPriceDisplay(lot);
  const parsedPrice =
    lot.priceMode === 'AMOUNT' ? publicPriceLabelToVnd(lot.priceLabel) : null;
  const priceText = parsedPrice != null
    ? priceDisplay.text
    : priceDisplay.isMoney
      ? priceDisplay.text
      : lot.priceLabel?.trim() || LOT_GPT_DEFAULT_PRICE_TEXT;

  const payload: LotGptRequestDraft = {
    title: lot.title.trim(),
    location: parseLotGptLocation(lot.location),
    area: lot.areaM2 ?? null,
    residentialArea: parseResidentialAreaM2(lot.title, lot.excerpt),
    frontage: lot.frontageM ?? null,
    direction: lot.direction?.trim() || null,
    price: parsedPrice,
    priceText,
  };

  if (lot.kind) payload.kind = lot.kind;
  const excerpt = lot.excerpt?.trim();
  if (excerpt) payload.excerpt = excerpt;
  const slug = lot.slug?.trim();
  if (slug) payload.slug = slug;

  const extra = extraDescription?.trim();
  if (extra) payload.extraDescription = extra;

  return payload;
}

export function formatLotGptRequestJson(
  lot: PublicWebStaffLotRow,
  extraDescription?: string,
): string {
  return `${JSON.stringify(buildLotGptRequestPayload(lot, extraDescription), null, 2)}\n`;
}
