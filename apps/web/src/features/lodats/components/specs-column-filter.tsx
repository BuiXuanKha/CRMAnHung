'use client';

import { Check, ListFilter, X } from 'lucide-react';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Icon } from '@/shared/ui/icon';
import '@/shared/ui/column-filter.css';
import {
  AREA_FILTER_OPTIONS,
  DIRECTION_FILTER_OPTIONS,
  type AreaBracket,
  type DirectionFilter,
} from '../display';
import './specs-column-filter.css';

type Props = {
  area: AreaBracket;
  direction: DirectionFilter;
  open: boolean;
  onToggle: () => void;
  onClose: () => void;
  onChange: (next: { area: AreaBracket; direction: DirectionFilter }) => void;
};

export function SpecsColumnFilter({
  area,
  direction,
  open,
  onToggle,
  onClose,
  onChange,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 0, left: 0 });
  const active = area !== 'all' || direction !== 'all';

  useLayoutEffect(() => {
    if (!open) return;
    const btn = wrapRef.current?.querySelector('button');
    if (!btn) return;
    const r = btn.getBoundingClientRect();
    const width = 240;
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
        className={['crm-col-filter-btn', open ? 'is-open' : '', active ? 'is-active' : '']
          .filter(Boolean)
          .join(' ')}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Lọc DT · MT · Hướng"
        title="Lọc DT · MT · Hướng"
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
          aria-label="Xóa lọc DT · MT · Hướng"
          title="Xóa lọc DT · MT · Hướng"
          onClick={(e) => {
            e.stopPropagation();
            onChange({ area: 'all', direction: 'all' });
            onClose();
          }}
        >
          <Icon icon={X} size={14} />
        </button>
      ) : null}
      {open ? (
        <div
          className="crm-col-filter-menu ld-specs-filter-menu"
          role="menu"
          style={{ top: pos.top, left: pos.left }}
        >
          <p className="ld-specs-filter-group-label">Diện tích</p>
          <ul className="ld-specs-filter-list">
            {AREA_FILTER_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="menuitem"
                  className={area === opt.value ? 'is-selected' : undefined}
                  onClick={() => {
                    onChange({ area: opt.value, direction });
                  }}
                >
                  <span>{opt.label}</span>
                  {area === opt.value ? <Icon icon={Check} size={14} /> : null}
                </button>
              </li>
            ))}
          </ul>
          <p className="ld-specs-filter-group-label">Hướng</p>
          <ul className="ld-specs-filter-list">
            {DIRECTION_FILTER_OPTIONS.map((opt) => (
              <li key={opt.value}>
                <button
                  type="button"
                  role="menuitem"
                  className={direction === opt.value ? 'is-selected' : undefined}
                  onClick={() => {
                    onChange({ area, direction: opt.value });
                  }}
                >
                  <span>{opt.label}</span>
                  {direction === opt.value ? <Icon icon={Check} size={14} /> : null}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}
