'use client';

import {
  ChevronDown,
  ChevronUp,
  FilePlus,
  ListPlus,
  ListTodo,
  Pencil,
  Pin,
  Receipt,
  RotateCcw,
  Wallet,
  Eye,
} from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { type TitleServiceListItem } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { isTitleServiceMuted } from '../display';

export type TitleServiceAction =
  | 'detail'
  | 'task'
  | 'pin'
  | 'progress'
  | 'thu'
  | 'chi'
  | 'attach'
  | 'edit'
  | 'restore';

type Props = {
  item: TitleServiceListItem;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (action: TitleServiceAction) => void;
};

/** Menu portal body — overflow bảng/thẻ cắt hit-test nếu fixed trong list. */
export function ActionMenu({ item, open, onToggle, onClose, onAction }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [triggerVisible, setTriggerVisible] = useState(false);
  /** Tạm dừng / Hoàn thành: chỉ Xem chi tiết + Khôi phục. */
  const mutedOnly = isTitleServiceMuted(item.status);

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
            className="sd-action-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            <li>
              <button type="button" role="menuitem" onClick={() => onAction('detail')}>
                <Icon icon={Eye} /> Xem chi tiết
              </button>
            </li>
            {mutedOnly ? (
              <li>
                <button type="button" role="menuitem" onClick={() => onAction('restore')}>
                  <Icon icon={RotateCcw} /> Khôi phục
                </button>
              </li>
            ) : (
              <>
                <li>
                  <button type="button" role="menuitem" onClick={() => onAction('task')}>
                    <Icon icon={ListTodo} /> Thêm công việc
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
              </>
            )}
          </ul>,
          document.body,
        )
      : null;

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
      {menu}
    </div>
  );
}
