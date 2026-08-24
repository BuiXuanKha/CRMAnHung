/**
 * Copy text lô đất gửi Zalo — theo CRM cũ (không copy giá).
 */
import type { LodatDetail } from '@crmanhung/shared';
import { formatArea } from './display';

const LODAT_COPY_FOOTER = `💰 Giá đẹp – thương lượng trực tiếp với chủ.

☎️☎️☎️: 0977 656 280 Xuân Khả - VP BĐS AN HƯNG LAND
📍 Địa chỉ: BT6.8 Tây Nam Sách - TT Nam Sách - HD`;

export function buildLodatCopyText(detail: LodatDetail): string {
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
  if (!body) return LODAT_COPY_FOOTER;
  return `${body}\n\n${LODAT_COPY_FOOTER}`;
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
