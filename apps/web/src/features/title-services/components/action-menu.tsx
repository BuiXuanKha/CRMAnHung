'use client';

import {
  ChevronDown,
  ChevronUp,
  FilePlus,
  ListPlus,
  Pencil,
  Pin,
  Receipt,
  Trash2,
  Wallet,
  Eye,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { TitleServiceListItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

export type TitleServiceAction =
  | 'detail'
  | 'pin'
  | 'progress'
  | 'thu'
  | 'chi'
  | 'attach'
  | 'edit'
  | 'delete';

type Props = {
  item: TitleServiceListItem;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (action: TitleServiceAction) => void;
};

export function ActionMenu({ item, open, onToggle, onClose, onAction }: Props) {
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
    <div className="sd-action" ref={wrapRef}>
      <button
        type="button"
        className="sd-action-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Thao tác ${item.code}`}
        onClick={onToggle}
      >
        <Icon icon={open ? ChevronUp : ChevronDown} size={14} strokeWidth={2.4} />
      </button>
      {open ? (
        <ul className="sd-action-menu" role="menu" style={{ top: pos.top, left: pos.left }}>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('detail')}>
              <Icon icon={Eye} /> Xem chi tiết
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('pin')}>
              <Icon icon={Pin} /> {item.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('progress')}>
              <Icon icon={ListPlus} /> Thêm tiến độ
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('thu')}>
              <Icon icon={Wallet} /> Nhập thu
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('chi')}>
              <Icon icon={Receipt} /> Nhập chi phí
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('attach')}>
              <Icon icon={FilePlus} /> Thêm tài liệu
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('edit')}>
              <Icon icon={Pencil} /> Sửa thông tin
            </button>
          </li>
          <li>
            <button
              type="button"
              role="menuitem"
              className="danger"
              onClick={() => onAction('delete')}
            >
              <Icon icon={Trash2} /> Xóa hồ sơ
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}
