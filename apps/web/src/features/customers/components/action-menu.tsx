'use client';

import {
  ChevronDown,
  ChevronUp,
  FileText,
  ListTodo,
  Map,
  MessageCircle,
  MessageSquare,
  NotebookPen,
  Phone,
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
  | 'task'
  | 'phone'
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

const MENU_WIDTH = 220;
const GAP = 4;
const EDGE = 8;

function clampLeft(right: number): number {
  const left = Math.min(right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - EDGE);
  return Math.max(EDGE, left);
}

/**
 * Menu Thao tác portal ra document.body — tránh bị .kh-table-scroll /
 * .kh-page (overflow hidden|auto) cắt mất hit-test khi position:fixed.
 *
 * Vị trí: ưu tiên dưới nút; thiếu chỗ → trên. Không khóa cuộn; cuộn /
 * resize → đóng (để kéo list tới khách khác không cần đóng tay).
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
    setPos({ top: r.bottom + GAP, left: clampLeft(r.right) });
    setTriggerVisible(true);
  }, [open]);

  /* Đo chiều cao menu sau khi portal mount — lật lên trên nếu thiếu chỗ dưới. */
  useLayoutEffect(() => {
    if (!open || !triggerVisible) return;
    const btn = wrapRef.current?.querySelector('button');
    const menu = menuRef.current;
    if (!btn || !menu) return;

    const r = btn.getBoundingClientRect();
    const menuH = menu.getBoundingClientRect().height;
    const spaceBelow = window.innerHeight - r.bottom - GAP - EDGE;
    const spaceAbove = r.top - GAP - EDGE;
    const left = clampLeft(r.right);

    let top: number;
    if (menuH <= spaceBelow) {
      top = r.bottom + GAP;
    } else if (menuH <= spaceAbove) {
      top = r.top - GAP - menuH;
    } else if (spaceAbove > spaceBelow) {
      top = Math.max(EDGE, r.top - GAP - menuH);
    } else {
      top = r.bottom + GAP;
      if (top + menuH > window.innerHeight - EDGE) {
        top = Math.max(EDGE, window.innerHeight - EDGE - menuH);
      }
    }
    setPos({ top, left });
  }, [open, triggerVisible, customer.isHidden, customer.primaryPhone, customer.isPinned, hasFacebook, isMobile]);

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

  useEffect(() => {
    if (!open || !triggerVisible) return;
    /* iOS Safari: scroll trên overflow:auto thường KHÔNG tới window
       (kể cả capture) — nên gắn trực tiếp + touchmove/wheel + theo dõi
       vị trí nút. Không khóa cuộn; chỉ đóng menu. */
    const close = () => onClose();

    const scrollRoots: EventTarget[] = [window, document];
    document.querySelectorAll('.kh-cards, .kh-table-scroll').forEach((el) => {
      scrollRoots.push(el);
    });
    let node: HTMLElement | null = wrapRef.current;
    while (node) {
      const { overflow, overflowY } = getComputedStyle(node);
      if (/(auto|scroll|overlay)/.test(`${overflow}${overflowY}`)) {
        scrollRoots.push(node);
      }
      node = node.parentElement;
    }
    for (const root of scrollRoots) {
      root.addEventListener('scroll', close, { capture: true, passive: true });
    }

    const onTouchMove = (e: TouchEvent) => {
      const t = e.target as Node | null;
      if (t && (menuRef.current?.contains(t) || wrapRef.current?.contains(t))) return;
      close();
    };
    document.addEventListener('touchmove', onTouchMove, { capture: true, passive: true });
    document.addEventListener('wheel', close, { capture: true, passive: true });
    window.addEventListener('resize', close);
    const vv = window.visualViewport;
    vv?.addEventListener('resize', close);
    vv?.addEventListener('scroll', close);

    const btn = wrapRef.current?.querySelector('button');
    const origin = btn?.getBoundingClientRect();
    let raf = 0;
    const watchTrigger = () => {
      if (!btn || !origin) return;
      const r = btn.getBoundingClientRect();
      if (Math.abs(r.top - origin.top) > 1 || Math.abs(r.left - origin.left) > 1) {
        close();
        return;
      }
      raf = requestAnimationFrame(watchTrigger);
    };
    if (btn && origin) raf = requestAnimationFrame(watchTrigger);

    return () => {
      for (const root of scrollRoots) {
        root.removeEventListener('scroll', close, true);
      }
      document.removeEventListener('touchmove', onTouchMove, true);
      document.removeEventListener('wheel', close, true);
      window.removeEventListener('resize', close);
      vv?.removeEventListener('resize', close);
      vv?.removeEventListener('scroll', close);
      cancelAnimationFrame(raf);
    };
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
                  <button type="button" role="menuitem" onClick={() => run('task')}>
                    <Icon icon={ListTodo} /> Thêm công việc
                  </button>
                </li>
                <li>
                  <button type="button" role="menuitem" onClick={() => run('phone')}>
                    <Icon icon={Phone} />{' '}
                    {customer.primaryPhone || (customer.phones?.length ?? 0) > 0
                      ? 'Quản lý số điện thoại'
                      : 'Thêm số điện thoại'}
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
