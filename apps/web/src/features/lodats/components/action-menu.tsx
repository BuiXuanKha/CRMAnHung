'use client';

import { ChevronDown, ChevronUp, CreditCard, Eye, FilePenLine, ListTodo, Pencil } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import type { LodatListItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

export type LodatAction = 'detail' | 'task' | 'deal' | 'edit' | 'compose';

type Props = {
  plot: LodatListItem;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (action: LodatAction) => void;
};

/** Menu portal body — tránh overflow bảng cắt hit-test (cùng pattern /khach-hang). */
export function ActionMenu({ plot, open, onToggle, onClose, onAction }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  /* Chỉ hiện menu khi nút của instance này đang nhìn thấy (bảng/thẻ cùng render). */
  const [triggerVisible, setTriggerVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    /* Instance ẩn không lắng nghe bấm-ngoài — tránh đóng menu thật tại mousedown. */
    if (!open || !triggerVisible) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, triggerVisible, onClose]);

  const menu =
    open && mounted && triggerVisible
      ? createPortal(
          <ul
            ref={menuRef}
            className="ld-action-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            <li>
              <button type="button" role="menuitem" onClick={() => onAction('detail')}>
                <Icon icon={Eye} /> Xem chi tiết
              </button>
            </li>
            <li>
              <button type="button" role="menuitem" onClick={() => onAction('task')}>
                <Icon icon={ListTodo} /> Thêm công việc
              </button>
            </li>
            <li>
              <button type="button" role="menuitem" onClick={() => onAction('deal')}>
                <Icon icon={CreditCard} /> Giao dịch
              </button>
            </li>
            <li>
              <button type="button" role="menuitem" onClick={() => onAction('compose')}>
                <Icon icon={FilePenLine} /> Soạn bài đăng
              </button>
            </li>
            <li>
              <button type="button" role="menuitem" onClick={() => onAction('edit')}>
                <Icon icon={Pencil} /> Sửa
              </button>
            </li>
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="ld-action" ref={wrapRef}>
      <button
        type="button"
        className="ld-action-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Thao tác ${plot.title}`}
        onClick={onToggle}
      >
        <Icon icon={open ? ChevronUp : ChevronDown} size={14} strokeWidth={2.4} />
      </button>
      {menu}
    </div>
  );
}
