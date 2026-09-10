import { LodatSaleStatus, LODAT_SALE_STATUS_LABELS } from '@crmanhung/shared';

export type PublicSaleTone = 'open' | 'paused' | 'sold' | 'deposit' | 'not_for_sale';

function asSaleStatus(status?: LodatSaleStatus | string | null): LodatSaleStatus | null {
  if (!status) return null;
  if (status === LodatSaleStatus.DANG_BAN || status === 'DANG_BAN') return LodatSaleStatus.DANG_BAN;
  if (status === LodatSaleStatus.TAM_DUNG || status === 'TAM_DUNG') return LodatSaleStatus.TAM_DUNG;
  if (status === LodatSaleStatus.DA_BAN || status === 'DA_BAN') return LodatSaleStatus.DA_BAN;
  if (status === LodatSaleStatus.DAT_COC || status === 'DAT_COC') return LodatSaleStatus.DAT_COC;
  if (status === LodatSaleStatus.KHONG_BAN || status === 'KHONG_BAN') return LodatSaleStatus.KHONG_BAN;
  return null;
}

/** Guest cover badge — known CRM sale status. KHONG_BAN should not reach guests (API filters). */
export function saleStatusLabel(status?: LodatSaleStatus | string | null): string | null {
  const s = asSaleStatus(status);
  if (!s) return null;
  return LODAT_SALE_STATUS_LABELS[s];
}

export function saleStatusTone(status?: LodatSaleStatus | string | null): PublicSaleTone | null {
  const s = asSaleStatus(status);
  if (!s) return null;
  switch (s) {
    case LodatSaleStatus.DANG_BAN:
      return 'open';
    case LodatSaleStatus.TAM_DUNG:
      return 'paused';
    case LodatSaleStatus.DA_BAN:
      return 'sold';
    case LodatSaleStatus.DAT_COC:
      return 'deposit';
    case LodatSaleStatus.KHONG_BAN:
      return 'not_for_sale';
  }
}
