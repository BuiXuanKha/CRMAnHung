'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AlertTriangle, FileText, Map, MessageCircle, MoreHorizontal, NotebookPen, Phone } from 'lucide-react';
import { UserRole, type CustomerDetail } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { CrmAlertDialog } from '@/shared/ui/dialog';
import { zaloMeUrl } from '@/shared/zalo-link';
import { useAuth } from '@/features/auth/auth-context';
import { messengerComUrl, openExternalUrl } from '../messenger';

type Props = {
  customer: CustomerDetail;
  /** Số dùng cho `tel:` / Zalo (số chính / số đầu). */
  callPhone: string | null;
};

/**
 * FAB góc phải dưới — chỉ CSS hiện trên mobile (§12.3.2).
 * «⋯» → popover (Cập nhật chăm sóc / Tạo lô đất / Dịch vụ sổ đỏ).
 * Gọi + Zalo khi có SĐT; Messenger = cùng menu list mobile.
 */
export function DetailMobileFab({ customer, callPhone }: Props) {
  const router = useRouter();
  const { user } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const [alertBox, setAlertBox] = useState<{ title: string; message: string } | null>(
    null,
  );
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  const showCall = Boolean(callPhone);
  const showZalo = Boolean(callPhone);
  const showMessenger = Boolean(customer.facebook) && !customer.isHidden;
  const showMore = !customer.isHidden;

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

  if (!showCall && !showZalo && !showMessenger && !showMore) return null;

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

  function goCare() {
    setMenuOpen(false);
    router.push(`/khach-hang/${customer.id}/cham-soc`);
  }

  function goLodat() {
    setMenuOpen(false);
    if (user?.role === UserRole.ADMIN) {
      setAlertBox({
        title: 'Không tạo lô từ khách',
        message:
          'Admin không tạo lô đất từ menu khách. Nhân viên tạo lô từ hồ sơ khách của mình.',
      });
      return;
    }
    router.push(`/khach-hang/${customer.id}/them-lo-dat`);
  }

  function goSodo() {
    setMenuOpen(false);
    router.push(`/khach-hang/${customer.id}/dich-vu-so-do`);
  }

  return (
    <>
      <div className="kh-detail-fab" role="group" aria-label="Thao tác nhanh">
        {showMore ? (
          <div className="kh-detail-fab-menu-wrap">
            {menuOpen ? (
              <div ref={menuRef} className="kh-detail-fab-popover" role="menu">
                <button
                  type="button"
                  role="menuitem"
                  className="kh-detail-fab-menu-item"
                  onClick={goCare}
                >
                  <Icon icon={NotebookPen} size={16} />
                  Cập nhật chăm sóc
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="kh-detail-fab-menu-item"
                  onClick={goLodat}
                >
                  <Icon icon={Map} size={16} />
                  Tạo lô đất
                </button>
                <button
                  type="button"
                  role="menuitem"
                  className="kh-detail-fab-menu-item"
                  onClick={goSodo}
                >
                  <Icon icon={FileText} size={16} />
                  Dịch vụ sổ đỏ
                </button>
              </div>
            ) : null}
            <button
              ref={btnRef}
              type="button"
              className="kh-detail-fab-btn kh-detail-fab-more"
              aria-haspopup="menu"
              aria-expanded={menuOpen}
              aria-label="Thêm thao tác"
              title="Thêm thao tác"
              onClick={() => setMenuOpen((v) => !v)}
            >
              <Icon icon={MoreHorizontal} size={22} />
            </button>
          </div>
        ) : null}

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
