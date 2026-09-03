'use client';

import { useState } from 'react';
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react';
import type { CustomerDetail } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { messengerComUrl, openExternalUrl } from '../messenger';

type Props = {
  customer: CustomerDetail;
  /** Số dùng cho `tel:` / Zalo (số chính / số đầu). */
  callPhone: string | null;
};

/** Cùng quy tắc trang public: `zalo.me/84…` từ SĐT VN. */
function zaloMeUrl(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  const id = digits.startsWith('84')
    ? digits
    : digits.startsWith('0')
      ? `84${digits.slice(1)}`
      : digits;
  return `https://zalo.me/${id}`;
}

/**
 * FAB góc phải dưới — chỉ CSS hiện trên mobile (§12.3.2).
 * Gọi + Zalo khi có SĐT; Messenger = cùng menu list mobile.
 */
export function DetailMobileFab({ customer, callPhone }: Props) {
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(
    null,
  );
  const showCall = Boolean(callPhone);
  const showZalo = Boolean(callPhone);
  const showMessenger = Boolean(customer.facebook) && !customer.isHidden;

  if (!showCall && !showZalo && !showMessenger) return null;

  function openMessenger() {
    const url = messengerComUrl(customer);
    if (!openExternalUrl(url)) {
      setAlertBox({
        title: 'Không mở được Messenger',
        message: customer.facebook
          ? 'Khách này chưa có thread / UID Messenger (mã số) để mở hội thoại.'
          : 'Khách này chưa gắn Facebook — không mở được Messenger.',
      });
    }
  }

  return (
    <>
      <div className="kh-detail-fab" role="group" aria-label="Thao tác nhanh">
        {showCall ? (
          <a
            className="kh-detail-fab-btn kh-detail-fab-call"
            href={`tel:${callPhone}`}
            aria-label={`Gọi ${callPhone}`}
            title="Gọi điện"
          >
            <Icon icon={Phone} size={22} />
          </a>
        ) : null}
        {showZalo && callPhone ? (
          <a
            className="kh-detail-fab-btn kh-detail-fab-zalo"
            href={zaloMeUrl(callPhone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Zalo ${callPhone}`}
            title="Zalo"
          >
            <span className="kh-detail-fab-zalo-label" aria-hidden>
              Zalo
            </span>
          </a>
        ) : null}
        {showMessenger ? (
          <button
            type="button"
            className="kh-detail-fab-btn kh-detail-fab-chat"
            onClick={openMessenger}
            aria-label="Mở Messenger"
            title="Mở Messenger"
          >
            <Icon icon={MessageCircle} size={22} />
          </button>
        ) : null}
      </div>

      <CrmAlertDialog
        open={Boolean(alertBox)}
        title={alertBox?.title ?? ''}
        icon={AlertTriangle}
        message={alertBox?.message ?? ''}
        onClose={() => setAlertBox(null)}
      />
    </>
  );
}
