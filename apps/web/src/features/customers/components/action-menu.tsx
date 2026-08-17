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
  Trash2,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CustomerListItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

export type CustomerAction =
  | 'chat'
  | 'messenger'
  | 'care'
  | 'lodat'
  | 'sodo'
  | 'pin'
  | 'delete';

type Props = {
  customer: CustomerListItem;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (action: CustomerAction) => void;
};

export function ActionMenu({ customer, open, onToggle, onClose, onAction }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const btn = wrapRef.current?.querySelector('button');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = 220;
    const left = Math.min(r.right - width, window.innerWidth - width - 8);
    setPos({ top: r.bottom + 4, left: Math.max(8, left) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (!wrapRef.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

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
      {open ? (
        <ul
          className="kh-action-menu"
          role="menu"
          style={{ top: pos.top, left: pos.left }}
        >
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('chat')}>
              <Icon icon={MessageSquare} /> Mở chat
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('messenger')}>
              <Icon icon={MessageCircle} /> Mở Messenger
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('care')}>
              <Icon icon={NotebookPen} /> Cập nhật chăm sóc
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('lodat')}>
              <Icon icon={Map} /> Tạo lô đất
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('sodo')}>
              <Icon icon={FileText} /> Dịch vụ sổ đỏ
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('pin')}>
              <Icon icon={Pin} /> {customer.isPinned ? 'Bỏ ghim khách' : 'Ghim khách'}
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" className="danger" onClick={() => onAction('delete')}>
              <Icon icon={Trash2} /> Xóa khách
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
