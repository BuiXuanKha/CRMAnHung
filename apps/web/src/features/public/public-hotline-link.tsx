'use client';

import type { LotShareContact } from '@crmanhung/shared';
import { phoneTelHref } from './public-contact';
import { usePublicContact } from './use-public-contact';

type Props = {
  className?: string;
  shareContact?: LotShareContact | null;
  /** Shown before the number — default «Hotline». Empty = number only. */
  prefix?: string;
};

export function PublicHotlineLink({
  className = 'ph-hotline',
  shareContact = null,
  prefix = 'Hotline',
}: Props) {
  const { phone, phoneDisplay } = usePublicContact(shareContact);
  const label = prefix ? `${prefix} ${phoneDisplay}` : phoneDisplay;
  return (
    <a className={className} href={phoneTelHref(phone)}>
      {label}
    </a>
  );
}
