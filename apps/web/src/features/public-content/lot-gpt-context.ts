import {
  formatArea,
  formatFrontageDir,
  kindLabel,
} from '@/features/lodats/display';
import type { PublicWebStaffLotRow } from '@crmanhung/shared';
import { lotPriceDisplay } from './display';

/**
 * Public-safe lot facts for a future GPT content request.
 * No customer PII, commission, or raw CRM VND.
 */
export type LotGptContextPayload = {
  lodatId: string;
  title: string;
  location: string;
  kindLabel: string;
  areaLabel: string;
  frontageDirectionLabel: string;
  priceLabel: string;
  excerpt: string;
  isPublished: boolean;
};

export function buildLotGptContext(lot: PublicWebStaffLotRow): LotGptContextPayload {
  return {
    lodatId: lot.lodatId,
    title: lot.title.trim(),
    location: lot.location.trim(),
    kindLabel: kindLabel(lot.kind),
    areaLabel: formatArea(lot.areaM2),
    frontageDirectionLabel: formatFrontageDir(lot.frontageM, lot.direction),
    priceLabel: lotPriceDisplay(lot).text,
    excerpt: lot.excerpt.trim(),
    isPublished: lot.isPublished,
  };
}
