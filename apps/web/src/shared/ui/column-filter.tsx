'use client';

import { Check, ListFilter } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const active = value !== allValue && value !== '';

  useLayoutEffect(() => {
    if (!open) return;
    const el = wrapRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const width = 220;
    const left = Math.min(r.left, window.innerWidth - width - 8);
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
    <div className="crm-col-filter" ref={wrapRef}>
      <button
        type="button"
        className={['crm-col-filter-trigger', open ? 'is-open' : '', active ? 'is-active' : '']
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
        <span className="crm-col-filter-label">{label}</span>
        <span
          className={['crm-col-filter-icon', open ? 'is-open' : '', active ? 'is-active' : '']
            .filter(Boolean)
            .join(' ')}
        >
          <Icon icon={ListFilter} size={14} />
        </span>
      </button>
      {open ? (
        <ul
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
        </ul>
      ) : null}
    </div>
  );
}
