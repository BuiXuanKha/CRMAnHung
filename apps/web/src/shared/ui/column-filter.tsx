'use client';

import { Check, ListFilter, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from './icon';
import './column-filter.css';

export type ColumnFilterOption = {
  value: string;
  label: string;
};

type Props = {
  label: string;
  value: string;
  options: ColumnFilterOption[];
  /** Value that means “no filter” */
  allValue?: string;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (value: string) => void;
};

export function ColumnFilter({
  label,
  value,
  options,
  allValue = 'all',
  open,
  onToggle,
  onClose,
  onChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLUListElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  const active = value !== allValue && value !== '';

  useEffect(() => {
    setMounted(true);
  }, []);

  useLayoutEffect(() => {
    if (!open) return;
    const btn = wrapRef.current?.querySelector('button');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = 220;
    const left = Math.min(r.left, window.innerWidth - width - 8);
    setPos({ top: r.bottom + 4, left: Math.max(8, left) });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || menuRef.current?.contains(t)) return;
      onClose();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open, onClose]);

  const menu =
    open && mounted
      ? createPortal(
          <ul
            ref={menuRef}
            className="crm-col-filter-menu"
            role="menu"
            style={{ top: pos.top, left: pos.left }}
          >
            {options.map((opt) => (
              <li key={opt.value || 'all'}>
                <button
                  type="button"
                  role="menuitem"
                  className={value === opt.value ? 'is-selected' : undefined}
                  onClick={() => {
                    onChange(opt.value);
                    onClose();
                  }}
                >
                  <span>{opt.label}</span>
                  {value === opt.value ? <Icon icon={Check} size={14} /> : null}
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div className="crm-col-filter" ref={wrapRef}>
      <button
        type="button"
        className={['crm-col-filter-btn', open ? 'is-open' : '', active ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={`Lọc ${label}`}
        title={`Lọc ${label}`}
        onClick={(e) => {
          e.stopPropagation();
          onToggle();
        }}
      >
        <Icon icon={ListFilter} size={14} />
      </button>
      {active ? (
        <button
          type="button"
          className="crm-col-filter-clear"
          aria-label={`Xóa lọc ${label}`}
          title={`Xóa lọc ${label}`}
          onClick={(e) => {
            e.stopPropagation();
            onChange(allValue);
            onClose();
          }}
        >
          <Icon icon={X} size={14} />
        </button>
      ) : null}
      {menu}
    </div>
  );
}
