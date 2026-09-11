'use client';

import { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ListTodo,
  MessageCircle,
  MoreHorizontal,
  Pencil,
  Phone,
  Pin,
  RotateCcw,
} from 'lucide-react';
import type { TitleServiceDetail } from '@crmanhung/shared';
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
import { isTitleServiceMuted } from '../display';

type Props = {
  detail: TitleServiceDetail;
  onAddTask: () => void;
  onPin: () => void;
  onEdit: () => void;
  onRestore: () => void;
};

/**
 * FAB cụm phải dưới — mobile only (title-services.md §12.3.2).
 * 「⋯」 → công việc / ghim / sửa (hoặc Khôi phục khi muted).
 * Gọi: 1 số → tel thẳng; ≥2 số → modal chọn số. Zalo dùng số đầu.
 */
export function TitleServiceDetailFab({
  detail,
  onAddTask,
  onPin,
  onEdit,
  onRestore,
}: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(
    null,
  );
  const [callPickerOpen, setCallPickerOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const phones = uniqueCustomerPhones(detail.phones, detail.primaryPhone);
  const callPhone = phones[0]?.phone ?? null;
  const showCall = phones.length > 0;
  const showZalo = Boolean(callPhone);
  const showMessenger = Boolean(detail.facebook) && !detail.customerIsHidden;
  const mutedOnly = isTitleServiceMuted(detail.status);

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
    const url = messengerComUrl({ facebook: detail.facebook });
    if (!openExternalUrl(url)) {
      setAlertBox({
        title: 'Không mở được Messenger',
        message: detail.facebook
          ? 'Khách này chưa có thread / UID Messenger (mã số) để mở hội thoại.'
          : 'Khách này chưa gắn Facebook — không mở được Messenger.',
      });
    }
  }

  return (
    <>
      <div className="sd-detail-fab" role="group" aria-label="Thao tác hồ sơ sổ đỏ">
        <div className="sd-detail-fab-menu-wrap">
          {menuOpen ? (
            <div ref={menuRef} className="sd-detail-fab-popover" role="menu">
              {mutedOnly ? (
                <button
                  type="button"
                  role="menuitem"
                  className="sd-detail-fab-menu-item"
                  onClick={() => {
                    setMenuOpen(false);
                    onRestore();
                  }}
                >
                  <Icon icon={RotateCcw} size={16} />
                  Khôi phục
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    role="menuitem"
                    className="sd-detail-fab-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onAddTask();
                    }}
                  >
                    <Icon icon={ListTodo} size={16} />
                    Thêm công việc
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="sd-detail-fab-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onPin();
                    }}
                  >
                    <Icon icon={Pin} size={16} />
                    {detail.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                  </button>
                  <button
                    type="button"
                    role="menuitem"
                    className="sd-detail-fab-menu-item"
                    onClick={() => {
                      setMenuOpen(false);
                      onEdit();
                    }}
                  >
                    <Icon icon={Pencil} size={16} />
                    Sửa thông tin
                  </button>
                </>
              )}
            </div>
          ) : null}
          <button
            ref={btnRef}
            type="button"
            className="sd-detail-fab-btn sd-detail-fab-more"
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
            className="sd-detail-fab-btn sd-detail-fab-call"
            aria-label="Gọi điện khách"
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
            className="sd-detail-fab-btn sd-detail-fab-zalo"
            href={zaloMeUrl(callPhone)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Zalo ${callPhone}`}
            title="Zalo"
          >
            <span className="sd-detail-fab-zalo-label" aria-hidden>
              Zalo
            </span>
          </a>
        ) : null}
        {showMessenger ? (
          <button
            type="button"
            className="sd-detail-fab-btn sd-detail-fab-chat"
            onClick={openMessenger}
            aria-label="Mở Messenger"
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
