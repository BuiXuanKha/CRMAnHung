'use client';

import { useEffect, useRef, useState } from 'react';
import { ListTodo, MoreHorizontal, Pencil, Trash2 } from 'lucide-react';
import { Icon } from '@/shared/ui/icon';

type Props = {
  onAddTask: () => void;
  onEdit: () => void;
  onDelete: () => void;
};

/**
 * FAB cụm phải dưới — mobile only (transactions.md §12.3.2).
 * 「⋯」 → Thêm công việc / Sửa / Xóa (cùng menu list; không Gọi·Zalo·Messenger).
 */
export function TransactionDetailFab({ onAddTask, onEdit, onDelete }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

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

  return (
    <div className="tx-detail-fab" role="group" aria-label="Thao tác giao dịch">
      <div className="tx-detail-fab-menu-wrap">
        {menuOpen ? (
          <div ref={menuRef} className="tx-detail-fab-popover" role="menu">
            <button
              type="button"
              role="menuitem"
              className="tx-detail-fab-menu-item"
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
              className="tx-detail-fab-menu-item"
              onClick={() => {
                setMenuOpen(false);
                onEdit();
              }}
            >
              <Icon icon={Pencil} size={16} />
              Sửa
            </button>
            <button
              type="button"
              role="menuitem"
              className="tx-detail-fab-menu-item is-danger"
              onClick={() => {
                setMenuOpen(false);
                onDelete();
              }}
            >
              <Icon icon={Trash2} size={16} />
              Xóa
            </button>
          </div>
        ) : null}
        <button
          ref={btnRef}
          type="button"
          className="tx-detail-fab-btn tx-detail-fab-more"
          aria-haspopup="menu"
          aria-expanded={menuOpen}
          aria-label="Thêm thao tác"
          title="Thêm thao tác"
          onClick={() => setMenuOpen((v) => !v)}
        >
          <Icon icon={MoreHorizontal} size={22} />
        </button>
      </div>
    </div>
  );
}
