'use client';

import { Phone } from 'lucide-react';
import type { LotShareContact } from '@crmanhung/shared';
import { ANHUNG_BRAND } from './brand';
import { formatPhoneDisplay, phoneTelHref } from './public-contact';
import { usePublicContact } from './use-public-contact';

function zaloLink(telDigits: string): string {
  return `https://zalo.me/${telDigits}`;
}

function phoneToTelDigits(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('84')) return digits;
  if (digits.startsWith('0')) return `84${digits.slice(1)}`;
  return digits;
}

function StaffContactAvatar({
  name,
  url,
  className,
}: {
  name: string;
  url?: string | null;
  className: string;
}) {
  return (
    <span className={className} aria-hidden>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        name.slice(0, 1).toUpperCase()
      )}
    </span>
  );
}

function ListingZaloBtn({ label, phone }: { label: string; phone: string }) {
  return (
    <a
      className="pd-zalo-btn"
      href={zaloLink(phoneToTelDigits(phone))}
      target="_blank"
      rel="noopener noreferrer"
    >
      {label}
    </a>
  );
}

function ListingPhoneBtn({ phone }: { phone: string }) {
  const display = formatPhoneDisplay(phone);
  return (
    <a className="pd-phone-btn" href={phoneTelHref(phone)} aria-label={`Gọi ${display}`}>
      <Phone className="pd-phone-btn-icon" size={18} strokeWidth={2} aria-hidden />
      <span className="pd-phone-btn-copy">
        <span className="pd-phone-btn-action">Bấm là gọi:</span>
        <span className="pd-phone-btn-num">{display}</span>
      </span>
    </a>
  );
}

export function ListingContactAside({ shareContact }: { shareContact?: LotShareContact | null }) {
  const { name, phone, isStaff, contact } = usePublicContact(shareContact);
  const role = isStaff ? 'Nhân viên tư vấn An Hưng Land' : ANHUNG_BRAND.legalLine;
  const lead = isStaff ? `Liên hệ ${name}` : 'Xem đất thực tế · tư vấn miễn phí';
  return (
    <aside className="pd-aside" aria-label="Liên hệ tư vấn">
      <div className="pd-agent">
        <StaffContactAvatar name={name} url={contact?.avatarUrl} className="pd-agent-avatar" />
        <div className="pd-agent-meta">
          <p className="pd-agent-name">{name}</p>
          <p className="pd-agent-role">{role}</p>
        </div>
      </div>
      <p className="pd-aside-lead">{lead}</p>
      <ListingZaloBtn label="Chat qua Zalo" phone={phone} />
      <ListingPhoneBtn phone={phone} />
    </aside>
  );
}

export function ListingContactMobileBar({
  shareContact,
}: {
  shareContact?: LotShareContact | null;
}) {
  const { phone } = usePublicContact(shareContact);
  return (
    <div className="pd-mobile-bar">
      <ListingZaloBtn label="Liên hệ Zalo" phone={phone} />
      <ListingPhoneBtn phone={phone} />
    </div>
  );
}

/** Name + phone on listing cards — logged-in staff or guest share cookie. */
export function PublicCardContact() {
  const { name, phoneDisplay, phone, isStaff, contact } = usePublicContact();
  if (!isStaff) return null;
  return (
    <p className="ph-product-staff">
      <a href={phoneTelHref(phone)}>
        <StaffContactAvatar
          name={name}
          url={contact?.avatarUrl}
          className="ph-product-staff-avatar"
        />
        <span>
          {name} · {phoneDisplay}
        </span>
      </a>
    </p>
  );
}
