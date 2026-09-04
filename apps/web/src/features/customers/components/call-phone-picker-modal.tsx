'use client';

import { Phone } from 'lucide-react';
import type { CustomerPhone } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  open: boolean;
  title?: string;
  phones: CustomerPhone[];
  onClose: () => void;
  onPick: (phone: string) => void;
};

/** Chọn số khi khách có ≥2 SĐT (gọi điện). */
export function CallPhonePickerModal({
  open,
  title = 'Chọn số để gọi',
  phones,
  onClose,
  onPick,
}: Props) {
  if (!open) return null;

  return (
    <CrmDialog open={open} title={title} icon={Phone} onClose={onClose}>
      <ul className="kh-phone-manage-list">
        {phones.map((p) => (
          <li key={p.id} className="kh-phone-manage-row">
            <button
              type="button"
              className="crm-btn primary kh-phone-pick-btn"
              onClick={() => onPick(p.phone)}
            >
              {p.phone}
              {p.label ? ` (${p.label})` : ''}
            </button>
          </li>
        ))}
      </ul>
      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" onClick={onClose}>
          Huỷ
        </button>
      </div>
    </CrmDialog>
  );
}

type PhoneLike = {
  id?: string;
  phone: string;
  label?: string | null;
};

export function uniqueCustomerPhones(
  phones: PhoneLike[] | undefined | null,
  primaryPhone?: string | null,
): CustomerPhone[] {
  const list: PhoneLike[] =
    phones && phones.length > 0
      ? phones
      : primaryPhone
        ? [{ id: 'primary', phone: primaryPhone, label: null }]
        : [];
  const seen = new Set<string>();
  const out: CustomerPhone[] = [];
  for (const p of list) {
    const num = p.phone?.trim();
    if (!num || seen.has(num)) continue;
    seen.add(num);
    out.push({
      id: p.id?.trim() || `phone-${out.length}-${num}`,
      phone: num,
      label: p.label ?? null,
    });
  }
  return out;
}

/** 1 số → `tel:` thẳng; ≥2 → null (cần picker). */
export function directCallHref(phones: CustomerPhone[]): string | null {
  if (phones.length === 1) return `tel:${phones[0].phone}`;
  return null;
}

export function placeCall(phone: string) {
  window.location.href = `tel:${phone}`;
}
