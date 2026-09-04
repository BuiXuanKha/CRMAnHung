'use client';

import { useEffect, useRef, useState } from 'react';
import { AlertTriangle, MessageCircle, MoreHorizontal, Phone } from 'lucide-react';
import type { LodatOwner } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { zaloMeUrl } from '@/shared/zalo-link';
import {
  messengerComUrl,
  openExternalUrl,
} from '@/features/customers/messenger';
import {
  CallPhonePickerModal,
  uniqueCustomerPhones,
  directCallHref,
  placeCall,
} from '@/features/customers/components/call-phone-picker-modal';

type Props = {
  owner: LodatOwner | null;
  onTransaction: () => void;
  onEdit: () => void;
};

/**
 * FAB cụm phải dưới — mobile only (§12.3.2 lodats).
 * «⋯» → popover Giao dịch / Sửa lô đất (thay footer dính).
 * Gọi: 1 số → tel thẳng; ≥2 số → modal chọn số. Zalo dùng số đầu.
 */
export function LodatOwnerFab({ owner, onTransaction, onEdit }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(null);
  const [callPickerOpen, setCallPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const phones = uniqueCustomerPhones(owner?.phones ?? []);
  const callPhone = phones[0]?.phone ?? null;
  const showCall = phones.length > 0;
  const showZalo = Boolean(callPhone);
  const showMessenger = Boolean(owner?.facebook) && !owner?.isHidden;

  /* Đóng khi bấm ngoài */
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || btnRef.current?.contains(t)) return;
      setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  function openMessenger() {
    if (!owner) return;
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
      <div className="ld-owner-fab" role="group" aria-label="Thao tác lô đất">
        {/* «⋯» — luôn hiện (dù không có chủ, vẫn cần Giao dịch / Sửa) */}
        <div className="ld-owner-fab-menu-wrap">
          {menuOpen ? (
            <div ref={menuRef} className="ld-owner-fab-popover" role="menu">
              <button
                type="button"
                role="menuitem"
                className="ld-owner-fab-menu-item"
                onClick={() => { setMenuOpen(false); onTransaction(); }}
              >
                Giao dịch
              </button>
              <button
                type="button"
                role="menuitem"
                className="ld-owner-fab-menu-item"
                onClick={() => { setMenuOpen(false); onEdit(); }}
              >
                Sửa lô đất
              </button>
            </div>
          ) : null}
          <button
            ref={btnRef}
            type="button"
            className="ld-owner-fab-btn ld-owner-fab-more"
            aria-haspopup="menu"
            aria-expanded={menuOpen}
            aria-label="Thêm thao tác"
            title="Thêm thao tác"
            onClick={() => setMenuOpen((v) => !v)}
          >
            <Icon icon={MoreHorizontal} size={22} />
          </button>
        </div>

        {showCall ? (
          <button
            type="button"
            className="ld-owner-fab-btn ld-owner-fab-call"
            aria-label="Gọi điện chủ đất"
            title="Gọi điện"
            onClick={() => {
              const href = directCallHref(phones);
              if (href) {
                window.location.href = href;
                return;
              }
              setCallPickerOpen(true);
            }}
          >
            <Icon icon={Phone} size={22} />
          </button>
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

      <CallPhonePickerModal
        open={callPickerOpen}
        phones={phones}
        onClose={() => setCallPickerOpen(false)}
        onPick={(phone) => {
          setCallPickerOpen(false);
          placeCall(phone);
        }}
      />

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
