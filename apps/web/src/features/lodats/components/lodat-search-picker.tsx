'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { type LodatListItem } from '@crmanhung/shared';
import { listLodats } from '../api';
import { listingSaleStatusLabel } from '../display';
import './lodat-search-picker.css';

const PICKER_LIMIT = 30;
const DEBOUNCE_MS = 300;

type Props = {
  value?: string | null;
  /** Nhãn khi đã chọn (hoặc đang khóa từ `?lodatId=`). */
  labelHint?: string | null;
  disabled?: boolean;
  onChange: (item: LodatListItem | null) => void;
};

function statusLabel(status: LodatListItem['status']): string {
  return listingSaleStatusLabel(status);
}

/** Picker tìm lô theo keyword — thay select dump 200 (BUG-058). */
export function LodatSearchPicker({ value, labelHint, disabled, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [debounced, setDebounced] = useState('');
  const [items, setItems] = useState<LodatListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedTitle, setSelectedTitle] = useState<string | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);
  const ignoreTriggerUntil = useRef(0);

  function closePanel() {
    setOpen(false);
    setKeyword('');
    setDebounced('');
  }

  function armIgnoreTriggerClick() {
    ignoreTriggerUntil.current = Date.now() + 400;
  }

  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => setDebounced(keyword.trim()), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [open, keyword]);

  useEffect(() => {
    if (!open) return;
    if (!debounced) {
      setItems([]);
      setLoading(false);
      setError(null);
      return;
    }
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listLodats({
      keyword: debounced,
      includePaused: true,
      limit: PICKER_LIMIT,
    })
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được danh sách lô.');
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, debounced]);

  useEffect(() => {
    if (!value) {
      setSelectedTitle(null);
      return;
    }
    const found = items.find((i) => i.id === value);
    if (found) setSelectedTitle(found.title);
  }, [value, items]);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (rootRef.current?.contains(t)) return;
      closePanel();
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  const label = useMemo(() => {
    if (selectedTitle?.trim()) return selectedTitle.trim();
    if (labelHint?.trim()) return labelHint.trim();
    return 'Tìm và chọn lô đất…';
  }, [selectedTitle, labelHint]);

  function pickItem(item: LodatListItem) {
    setSelectedTitle(item.title);
    onChange(item);
    armIgnoreTriggerClick();
    closePanel();
  }

  function clearSelection() {
    setSelectedTitle(null);
    onChange(null);
    armIgnoreTriggerClick();
    closePanel();
  }

  return (
    <div className="ld-search-picker" ref={rootRef}>
      <button
        type="button"
        className={value ? 'ld-search-picker-trigger' : 'ld-search-picker-trigger is-empty'}
        disabled={disabled}
        aria-expanded={open}
        onClick={() => {
          if (Date.now() < ignoreTriggerUntil.current) return;
          if (open) closePanel();
          else setOpen(true);
        }}
      >
        {label}
      </button>
      {open ? (
        <div className="ld-search-picker-panel">
          <input
            placeholder="Gõ tiêu đề hoặc địa chỉ lô…"
            value={keyword}
            autoFocus
            onChange={(e) => setKeyword(e.target.value)}
          />
          {!debounced ? (
            <p className="ld-search-picker-hint">Gõ để tìm lô (không lướt danh sách dài).</p>
          ) : null}
          {loading ? <p className="ld-search-picker-hint">Đang tải…</p> : null}
          {error ? <p className="ld-search-picker-error">{error}</p> : null}
          {debounced && !loading && !error && items.length === 0 ? (
            <p className="ld-search-picker-hint">Không tìm thấy lô khớp.</p>
          ) : null}
          <ul>
            {items.map((item) => {
              const sub = [item.address?.trim(), statusLabel(item.status)].filter(Boolean).join(' · ');
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="ld-search-picker-item"
                    onClick={() => pickItem(item)}
                  >
                    <span className="ld-search-picker-item-text">
                      <strong>{item.title}</strong>
                      {sub ? <span className="ld-search-picker-item-sub">{sub}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          {value ? (
            <button type="button" className="ld-search-picker-clear" onClick={clearSelection}>
              Bỏ chọn
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
