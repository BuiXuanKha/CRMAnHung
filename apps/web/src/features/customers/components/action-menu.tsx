'use client';

import {
  ChevronDown,
  ChevronUp,
  FileText,
  Map,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Pin,
  RotateCcw,
  Trash2,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { CustomerListItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

export type CustomerAction =
  | 'chat'
  | 'messenger'
  | 'care'
  | 'lodat'
  | 'sodo'
  | 'pin'
  | 'delete'
  | 'restore';

type Props = {
  customer: CustomerListItem;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (action: CustomerAction) => void;
};

/**
 * Menu Thao tác portal ra document.body — tránh bị .kh-table-scroll /
 * .kh-page (overflow hidden|auto) cắt mất hit-test khi position:fixed.
 */
export function ActionMenu({ customer, open, onToggle, onClose, onAction }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  /* Bảng desktop + thẻ mobile cùng render menu này; chỉ hiện khi NÚT của
     instance này đang nhìn thấy — tránh menu «ma» tại 0,0 từ list đang ẩn. */
  const [triggerVisible, setTriggerVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const hasFacebook = Boolean(customer.facebook);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const mq = window.matchMedia('(max-width: 767px)');
    const apply = () => setIsMobile(mq.matches);
    apply();
    mq.addEventListener('change', apply);
    return () => mq.removeEventListener('change', apply);
  }, []);

  useLayoutEffect(() => {
    if (!open) {
      setTriggerVisible(false);
      return;
    }
    const btn = wrapRef.current?.querySelector('button');
    if (!btn || btn.getClientRects().length === 0) {
      setTriggerVisible(false);
      return;
    }
    const r = btn.getBoundingClientRect();
    const width = 220;
    const left = Math.min(r.right - width, window.innerWidth - width - 8);
    setPos({ top: r.bottom + 4, left: Math.max(8, left) });
    setTriggerVisible(true);
  }, [open]);

  useEffect(() => {
    /* Chỉ instance có nút đang hiện mới lắng nghe bấm-ngoài. Instance ẩn
       (bảng/thẻ còn lại) mà nghe sẽ đóng menu ngay tại mousedown → mục
       trong menu thật không bao giờ nhận được click. */
    if (!open || !triggerVisible) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, triggerVisible, onClose]);

  function run(action: CustomerAction) {
    onAction(action);
  }

  const menu =
    open && mounted && triggerVisible
      ? createPortal(
          <ul
            ref={menuRef}
            className="kh-action-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            {customer.isHidden ? (
              <li>
                <button type="button" role="menuitem" onClick={() => run('restore')}>
                  <Icon icon={RotateCcw} /> Khôi phục khách
                </button>
              </li>
            ) : (
              <>
                {hasFacebook && !isMobile ? (
                  <li>
                    <button type="button" role="menuitem" onClick={() => run('chat')}>
                      <Icon icon={MessageSquare} /> Mở chat
                    </button>
                  </li>
                ) : null}
                {hasFacebook ? (
                  <li>
                    <button type="button" role="menuitem" onClick={() => run('messenger')}>
                      <Icon icon={MessageCircle} /> Mở Messenger
                    </button>
                  </li>
                ) : null}
                <li>
                  <button type="button" role="menuitem" onClick={() => run('care')}>
                    <Icon icon={NotebookPen} /> Cập nhật chăm sóc
                  </button>
                </li>
                <li>
                  <button type="button" role="menuitem" onClick={() => run('lodat')}>
                    <Icon icon={Map} /> Tạo lô đất
                  </button>
                </li>
                <li>
                  <button type="button" role="menuitem" onClick={() => run('sodo')}>
                    <Icon icon={FileText} /> Dịch vụ sổ đỏ
                  </button>
                </li>
                <li>
                  <button type="button" role="menuitem" onClick={() => run('pin')}>
                    <Icon icon={Pin} /> {customer.isPinned ? 'Bỏ ghim khách' : 'Ghim khách'}
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    role="menuitem"
                    className="danger"
                    onClick={() => run('delete')}
                  >
                    <Icon icon={Trash2} /> Xóa khách
                  </button>
                </li>
              </>
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="kh-action" ref={wrapRef}>
      <button
        type="button"
        className="kh-action-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Thao tác ${customer.fullName}`}
        onClick={onToggle}
      >
        <Icon icon={open ? ChevronUp : ChevronDown} size={14} strokeWidth={2.4} />
      </button>
      {menu}
    </div>
  );
}
