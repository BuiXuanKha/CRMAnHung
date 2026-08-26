import {
  LODAT_KIND_LABELS,
  LodatKind,
  type PublicListingPriceMode,
  type PublicWebStaffLotRow,
} from '@crmanhung/shared';
import { ANHUNG_BRAND } from '@/features/public/brand';

function parseVnd(n?: number | string | null): number | null {
  if (n == null || n === '') return null;
  const v = typeof n === 'string' ? Number(n) : n;
  return Number.isFinite(v) && v > 0 ? v : null;
}

/** Exact CRM amount — admin hint only, never guest-facing. */
export function crmAmountLabel(priceVnd?: number | string | null): string | null {
  const v = parseVnd(priceVnd);
  if (v == null) return null;
  if (v >= 1_000_000_000) {
    const ty = v / 1_000_000_000;
    const text = new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(ty);
    return `${text} tỷ`;
  }
  if (v >= 1_000_000) {
    return `${new Intl.NumberFormat('vi-VN').format(Math.round(v / 1_000_000))} triệu`;
  }
  return `${v.toLocaleString('vi-VN')} đ`;
}

/**
 * Guest-facing price suggestion.
 * CRM 3,2 tỷ → «3 tỷ xxx». Never the exact map amount.
 */
export function obfuscatePublicPriceLabel(priceVnd?: number | string | null): string | null {
  const v = parseVnd(priceVnd);
  if (v == null) return null;
  if (v >= 1_000_000_000) {
    const ty = Math.floor(v / 1_000_000_000);
    return `${ty.toLocaleString('vi-VN')} tỷ xxx`;
  }
  if (v >= 100_000_000) {
    const hundreds = Math.floor(v / 100_000_000);
    return `${hundreds.toLocaleString('vi-VN')}xx triệu`;
  }
  if (v >= 1_000_000) return 'xxx triệu';
  return null;
}

export function suggestPublicPrice(priceVnd?: number | string | null): {
  priceMode: PublicListingPriceMode;
  priceLabel: string | null;
} {
  const label = obfuscatePublicPriceLabel(priceVnd);
  if (!label) return { priceMode: 'CONTACT', priceLabel: null };
  return { priceMode: 'AMOUNT', priceLabel: label };
}

/**
 * Public body from title + location + specs + company hotline.
 * Must not include commission, price notes, owner negotiation, customer PII, or staff names.
 */
export function suggestPublicExcerpt(input: {
  title: string;
  location: string;
  kind: LodatKind;
  areaM2: number | null;
  frontageM: number | null;
  direction: string | null;
}): string {
  const loc = input.location.trim();
  const lead = loc ? `${input.title} tại ${loc}.` : `${input.title}.`;
  const specs: string[] = [LODAT_KIND_LABELS[input.kind]];
  if (input.areaM2 != null) specs.push(`DT ${input.areaM2.toLocaleString('vi-VN')} m²`);
  if (input.frontageM != null) specs.push(`MT ${input.frontageM.toLocaleString('vi-VN')} m`);
  if (input.direction?.trim()) specs.push(`hướng ${input.direction.trim()}`);
  return [
    lead,
    `${specs.join(' · ')}.`,
    'Pháp lý rõ, hỗ trợ xem đất thực tế.',
    `Liên hệ hotline An Hưng Land ${ANHUNG_BRAND.hotlineDisplay}.`,
  ].join(' ');
}

export function publicListingInternalsHint(priceVnd?: number | string | null): string {
  const crm = crmAmountLabel(priceVnd);
  const suggest = obfuscatePublicPriceLabel(priceVnd);
  if (crm && suggest) {
    return `Giá CRM nội bộ: ${crm} — không hiện đúng số này cho khách (gợi ý «${suggest}»). Hoa hồng, ghi chú chủ nhà và thông tin khách không được copy vào bài đăng.`;
  }
  return 'CRM chưa có giá — chọn Liên hệ hoặc nhập giá công khai đã làm mờ. Hoa hồng, ghi chú chủ nhà và thông tin khách không được copy vào bài đăng.';
}

export function suggestPublicListingFields(row: Pick<
  PublicWebStaffLotRow,
  'title' | 'location' | 'kind' | 'areaM2' | 'frontageM' | 'direction' | 'priceVnd'
>): {
  title: string;
  location: string;
  priceMode: PublicListingPriceMode;
  priceLabel: string | null;
  excerpt: string;
} {
  const price = suggestPublicPrice(row.priceVnd);
  return {
    title: row.title,
    location: row.location,
    priceMode: price.priceMode,
    priceLabel: price.priceLabel,
    excerpt: suggestPublicExcerpt(row),
  };
}
