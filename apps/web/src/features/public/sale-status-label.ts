import { LodatSaleStatus } from '@crmanhung/shared';

/** Guest hangtag — null when Mở bán (no badge). */
export function saleStatusLabel(status?: LodatSaleStatus | string | null): string | null {
  if (!status || status === LodatSaleStatus.DANG_BAN || status === 'DANG_BAN') return null;
  if (status === LodatSaleStatus.TAM_DUNG || status === 'TAM_DUNG') return 'Tạm dừng bán';
  if (status === LodatSaleStatus.DA_BAN || status === 'DA_BAN') return 'Đã bán';
  if (status === LodatSaleStatus.DAT_COC || status === 'DAT_COC') return 'Đã cọc';
  return null;
}
