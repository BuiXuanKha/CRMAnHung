'use client';

import { Check, ChevronDown, ChevronUp, Eye, Pin } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { isWorkTaskCompleted, type WorkTask } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';

export type WorkTaskAction = 'detail' | 'pin' | 'complete';

type Props = {
  item: WorkTask;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onAction: (action: WorkTaskAction) => void;
};

/** Menu portal body — overflow bảng/thẻ cắt hit-test nếu fixed trong list. */
export function ActionMenu({ item, open, onToggle, onClose, onAction }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const [triggerVisible, setTriggerVisible] = useState(false);
  const done = isWorkTaskCompleted(item);

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
            className="cv-action-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            <li>
              <button type="button" role="menuitem" onClick={() => onAction('detail')}>
                <Icon icon={Eye} /> Xem chi tiết
              </button>
            </li>
            {!done ? (
              <>
                <li>
                  <button type="button" role="menuitem" onClick={() => onAction('pin')}>
                    <Icon icon={Pin} /> {item.isPinned ? 'Bỏ ghim' : 'Ghim lên đầu'}
                  </button>
                </li>
                <li>
                  <button type="button" role="menuitem" onClick={() => onAction('complete')}>
                    <Icon icon={Check} /> Hoàn thành
                  </button>
                </li>
              </>
            ) : null}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="cv-action" ref={wrapRef}>
      <button
        type="button"
        className="cv-action-btn"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Thao tác công việc"
        onClick={onToggle}
      >
        <Icon icon={open ? ChevronUp : ChevronDown} size={14} strokeWidth={2.4} />
      </button>
      {menu}
    </div>
  );
}
