import type { LotShareContact } from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';

export function formatPhoneDisplay(phone: string): string {
  const d = phone.replace(/\D/g, '');
  if (d.length === 10 && d.startsWith('0')) {
    return `${d.slice(0, 4)} ${d.slice(4, 7)} ${d.slice(7)}`;
  }
  return phone.trim();
}

export function phoneTelHref(phone: string): string {
  return `tel:${phone.replace(/\D/g, '')}`;
}

export function resolvedPublicContact(contact: LotShareContact | null): {
  contact: LotShareContact | null;
  name: string;
  phone: string;
  phoneDisplay: string;
  isStaff: boolean;
} {
  if (contact) {
    return {
      contact,
      name: contact.fullName,
      phone: contact.phone,
      phoneDisplay: formatPhoneDisplay(contact.phone),
      isStaff: true,
    };
  }
  return {
    contact: null,
    name: ANHUNG_BRAND.name,
    phone: ANHUNG_BRAND.hotlineTel,
    phoneDisplay: ANHUNG_BRAND.hotlineDisplay,
    isStaff: false,
  };
}
