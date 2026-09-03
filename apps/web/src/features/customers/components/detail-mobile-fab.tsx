'use client';

import { useState } from 'react';
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react';
import type { CustomerDetail } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { messengerComUrl, openExternalUrl } from '../messenger';

type Props = {
  customer: CustomerDetail;
  /** Số dùng cho `tel:` (số chính / số đầu). */
  callPhone: string | null;
};

/**
 * FAB góc phải dưới — chỉ CSS hiện trên mobile (§12.3.2).
 * «Mở Messenger» = cùng handler menu list mobile (không dùng «Mở chat» desktop).
 */
export function DetailMobileFab({ customer, callPhone }: Props) {
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(
    null,
  );
  const showCall = Boolean(callPhone);
  const showMessenger = Boolean(customer.facebook) && !customer.isHidden;

  if (!showCall && !showMessenger) return null;

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
