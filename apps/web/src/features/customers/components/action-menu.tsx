'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { CustomerListItem } from '@crmanhung/shared';

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
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden>
          {open ? <polyline points="18 15 12 9 6 15" /> : <polyline points="6 9 12 15 18 9" />}
        </svg>
      </button>
      {open ? (
        <ul
          className="kh-action-menu"
          role="menu"
          style={{ top: pos.top, left: pos.left }}
        >
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('chat')}>
              <IconChat /> Mở chat
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('messenger')}>
              <IconMessenger /> Mở Messenger
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('care')}>
              <IconNote /> Cập nhật chăm sóc
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('lodat')}>
              <IconMap /> Tạo lô đất
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('sodo')}>
              <IconDoc /> Dịch vụ sổ đỏ
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" onClick={() => onAction('pin')}>
              <IconPin /> {customer.isPinned ? 'Bỏ ghim khách' : 'Ghim khách'}
            </button>
          </li>
          <li>
            <button type="button" role="menuitem" className="danger" onClick={() => onAction('delete')}>
              <IconTrash /> Xóa khách
            </button>
          </li>
        </ul>
      ) : null}
    </div>
  );
}

function IconChat() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M4 4h16v12H7l-3 3V4z" />
    </svg>
  );
}
function IconMessenger() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M12 2C6.5 2 2 6.1 2 11.2c0 2.9 1.4 5.5 3.6 7.2V22l3.3-1.8c.9.3 1.9.4 3.1.4 5.5 0 10-4.1 10-9.2S17.5 2 12 2zm1 12.3-2.6-2.8-5 2.8L11 9l2.7 2.8L19 9l-6 5.3z" />
    </svg>
  );
}
function IconNote() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6" />
    </svg>
  );
}
function IconMap() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polygon points="1 6 8 3 16 6 23 3 23 18 16 21 8 18 1 21" />
    </svg>
  );
}
function IconDoc() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <circle cx="12" cy="14" r="2.2" />
    </svg>
  );
}
function IconPin() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M14 2l8 8-3 1-4 7-3-3-5 5-2-2 5-5-3-3 7-4z" />
    </svg>
  );
}
function IconTrash() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14H6L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4h6v2" />
    </svg>
  );
}
