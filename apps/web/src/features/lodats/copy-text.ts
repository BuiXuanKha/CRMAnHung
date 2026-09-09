/**
 * Copy text lô đất — nút «Copy gửi sales» (nội bộ NV, có giá / hoa hồng).
 * Không kèm footer công khai (hotline / địa chỉ VP).
 */
import type { LodatDetail } from '@crmanhung/shared';
import { formatArea, formatBrokerFee, formatPriceVnd } from './display';

const INTERNAL_COPY_HEADER = 'THÔNG TIN NỘI BỘ - KHÔNG GỬI KHÁCH';

export function buildLodatCopyText(detail: LodatDetail): string {
  const lines: string[] = [INTERNAL_COPY_HEADER, ''];

  const title = detail.title?.trim();
  if (title) lines.push(`📌 ${title}`);
  const address = detail.address?.trim();
  if (address) lines.push(`📍 ${address}`);

  const specs: string[] = [];
  if (detail.areaM2 != null) specs.push(`📐 Diện tích: ${formatArea(detail.areaM2)}`);
  if (detail.frontageM != null) {
    specs.push(`↔️ Mặt tiền: MT ${detail.frontageM.toLocaleString('vi-VN')} m`);
  }
  const direction = detail.direction?.trim();
  if (direction) specs.push(`🧭 Hướng: ${direction}`);
  if (specs.length) {
    lines.push('');
    lines.push(...specs);
  }

  const priceLines: string[] = [];
  if (detail.priceVnd != null && detail.priceVnd !== '') {
    priceLines.push(`💰 Giá bán: ${formatPriceVnd(detail.priceVnd)}`);
  }
  const priceNote = detail.priceNote?.trim();
  if (priceNote) priceLines.push(`📝 Ghi chú giá: ${priceNote}`);
  const broker = formatBrokerFee(detail.brokerFeeNote, detail.commissionPercent);
  if (broker) priceLines.push(`🤝 Hoa hồng: ${broker}`);
  if (priceLines.length) {
    lines.push('');
    lines.push(...priceLines);
  }

  return lines.join('\n').trim();
}

/** Copy Zalo/Facebook — mô tả lô + link share có mã NV. */
export function buildLodatShareClipboard(detail: LodatDetail, shareUrl: string): string {
  const lines: string[] = [];
  const title = detail.title?.trim();
  if (title) lines.push(title);
  const address = detail.address?.trim();
  if (address) lines.push(address);

  const specs: string[] = [];
  if (detail.areaM2 != null) specs.push(`Diện tích: ${formatArea(detail.areaM2)}`);
  if (detail.frontageM != null) {
    specs.push(`Mặt tiền: MT ${detail.frontageM.toLocaleString('vi-VN')} m`);
  }
  const direction = detail.direction?.trim();
  if (direction) specs.push(`Hướng: ${direction}`);
  if (specs.length) {
    if (lines.length) lines.push('');
    lines.push(...specs);
  }

  const body = lines.join('\n').trim();
  const prefix = body ? `${body}\n\n` : '';
  return `${prefix}${shareUrl.trim()}`;
}

export async function copyTextToClipboard(text: string): Promise<void> {
  if (!text) return;
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.left = '-9999px';
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand('copy');
  document.body.removeChild(textarea);
}
