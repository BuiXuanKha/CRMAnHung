'use client';

import { useState } from 'react';
import { AlertTriangle, MessageSquare, Phone } from 'lucide-react';
import type { CustomerDetail } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { facebookInboxChatUrl, openExternalUrl } from '../messenger';

type Props = {
  customer: CustomerDetail;
  /** Số dùng cho `tel:` (số chính / số đầu). */
  callPhone: string | null;
};

/**
 * FAB góc phải dưới — chỉ CSS hiện trên mobile (§12.3.2).
 * «Mở chat» = cùng handler menu list (không invent rule riêng).
 */
export function DetailMobileFab({ customer, callPhone }: Props) {
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(
    null,
  );
  const showCall = Boolean(callPhone);
  const showChat = Boolean(customer.facebook) && !customer.isHidden;

  if (!showCall && !showChat) return null;

  function openChat() {
    const url = facebookInboxChatUrl(customer);
    if (!openExternalUrl(url)) {
      setAlertBox({
        title: 'Không mở được chat',
        message: customer.facebook?.threadId
          ? 'Thread Facebook của khách không phải mã số Inbox hợp lệ để mở hội thoại.'
          : 'Khách này chưa có thread Facebook Inbox để mở hội thoại.',
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
        {showChat ? (
          <button
            type="button"
            className="kh-detail-fab-btn kh-detail-fab-chat"
            onClick={openChat}
            aria-label="Mở chat"
            title="Mở chat"
          >
            <Icon icon={MessageSquare} size={22} />
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
