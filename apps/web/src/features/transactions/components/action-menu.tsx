'use client';

import { ChevronDown, ChevronUp, Eye, Pencil, Trash2 } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TransactionListItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

export type TransactionAction = 'detail' | 'edit' | 'delete';

type Props = {
  item: TransactionListItem;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (action: TransactionAction) => void;
};

export function ActionMenu({ item, open, onToggle, onClose, onAction }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useLayoutEffect(() => {
    if (!open) return;
    const btn = wrapRef.current?.querySelector('button');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = 196;
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
    <div className="tx-action" ref={wrapRef}>
      <button
        type="button"
        className="tx-action-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Thao tác ${item.code}`}
        onClick={onToggle}
      >
        <Icon icon={open ? ChevronUp : ChevronDown} size={14} strokeWidth={2.4} />
      </button>
      {open ? (
        <ul
          className="tx-action-menu"
          role="menu"
          style={{ top: pos.top, left: pos.left }}
        >
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('detail')}>
              <Icon icon={Eye} /> Xem chi tiết
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('edit')}>
              <Icon icon={Pencil} /> Sửa
            </button>
          </li>
          <li>
            <button
              type="button"
              role="menuitem"
              className="danger"
              onClick={() => onAction('delete')}
            >
              <Icon icon={Trash2} /> Xóa
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
