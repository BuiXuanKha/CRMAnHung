'use client';

import { useState } from 'react';
import { AlertTriangle, MessageCircle, Phone } from 'lucide-react';
import type { LodatOwner } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { zaloMeUrl } from '@/shared/zalo-link';
import {
  messengerComUrl,
  openExternalUrl,
} from '@/features/customers/messenger';

type Props = {
  owner: LodatOwner;
};

/**
 * FAB liên hệ chủ đất — mobile only (§12.3.2 lodats).
 * Gọi + Zalo khi có SĐT; Messenger = cùng menu list khách mobile.
 */
export function LodatOwnerFab({ owner }: Props) {
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(
    null,
  );
  const callPhone = owner.phones[0]?.phone?.trim() || null;
  const showCall = Boolean(callPhone);
  const showZalo = Boolean(callPhone);
  const showMessenger = Boolean(owner.facebook) && !owner.isHidden;

  if (!showCall && !showZalo && !showMessenger) return null;

  function openMessenger() {
    const url = messengerComUrl({ facebook: owner.facebook });
    if (!openExternalUrl(url)) {
      setAlertBox({
        title: 'Không mở được Messenger',
        message: owner.facebook
          ? 'Khách này chưa có thread / UID Messenger (mã số) để mở hội thoại.'
          : 'Khách này chưa gắn Facebook — không mở được Messenger.',
      });
    }
  }

  return (
    <>
      <div className="ld-owner-fab" role="group" aria-label="Liên hệ chủ đất">
        {showCall ? (
          <a
            className="ld-owner-fab-btn ld-owner-fab-call"
            href={`tel:${callPhone}`}
            aria-label={`Gọi chủ đất ${callPhone}`}
            title="Gọi điện"
          >
            <Icon icon={Phone} size={22} />
          </a>
        ) : null}
        {showZalo && callPhone ? (
          <a
            className="ld-owner-fab-btn ld-owner-fab-zalo"
            href={zaloMeUrl(callPhone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Zalo chủ đất ${callPhone}`}
            title="Zalo"
          >
            <span className="ld-owner-fab-zalo-label" aria-hidden>
              Zalo
            </span>
          </a>
        ) : null}
        {showMessenger ? (
          <button
            type="button"
            className="ld-owner-fab-btn ld-owner-fab-chat"
            onClick={openMessenger}
            aria-label="Mở Messenger chủ đất"
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
