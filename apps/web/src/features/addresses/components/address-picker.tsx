'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  AddressKind,
  formatAddressLabel,
  type AddressListItem,
} from '@crmanhung/shared';
import { listAddresses } from '../api';
import '../addresses.css';

type Props = {
  value?: string | null;
  /** Nhãn ban đầu khi chưa load item từ list (vd. địa chỉ hiện tại trên form sửa). */
  labelHint?: string | null;
  kindFilter?: AddressKind;
  disabled?: boolean;
  onChange: (item: AddressListItem | null) => void;
};

/** Picker chọn địa chỉ có sẵn — STAFF chỉ đọc (không thêm). */
export function AddressPicker({
  value,
  labelHint,
  kindFilter,
  disabled,
  onChange,
}: Props) {
  const [open, setOpen] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [items, setItems] = useState<AddressListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<AddressListItem | null>(null);
  const rootRef = useRef<HTMLDivElement>(null);

  function closePanel() {
    setOpen(false);
    setKeyword('');
  }

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    void listAddresses({
      keyword: keyword.trim() || undefined,
      kind: kindFilter,
    })
      .then((res) => {
        if (!cancelled) setItems(res.items);
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Không tải được địa chỉ.');
          setItems([]);
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [open, keyword, kindFilter]);

  useEffect(() => {
    if (!value) {
      setSelected(null);
      return;
    }
    const found = items.find((i) => i.id === value);
    if (found) setSelected(found);
  }, [value, items]);

  /* Đóng khi bấm ngoài */
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
    if (selected) return formatAddressLabel(selected);
    if (labelHint?.trim()) return labelHint.trim();
    return 'Chọn Tỉnh / Huyện / Xã / Thôn hoặc Dự án…';
  }, [selected, labelHint]);

  /** Dòng item như CRM cũ: tên đậm + phụ «Xã · Huyện · Tỉnh». */
  function itemParts(item: AddressListItem): { title: string; sub: string } {
    const detail = String(item.detail || '').trim();
    const isProject = item.kind === AddressKind.PROJECT;
    let title = detail || item.ward || '—';
    if (isProject) {
      const count = Number(item.lodatCount) || 0;
      title = `${title} (${count} lô)`;
    }
    const subParts = detail
      ? [item.ward, item.district, item.province]
      : [item.district, item.province];
    return { title, sub: subParts.filter(Boolean).join(' · ') };
  }

  function pickItem(item: AddressListItem) {
    setSelected(item);
    onChange(item);
    /* Delay đóng: tránh iOS Safari click xuyên panel → mở lại trigger */
    window.setTimeout(() => closePanel(), 0);
  }

  function clearSelection() {
    setSelected(null);
    onChange(null);
    window.setTimeout(() => closePanel(), 0);
  }

  return (
    <div className="addr-picker" ref={rootRef}>
      <button
        type="button"
        className={selected ? 'addr-picker-trigger' : 'addr-picker-trigger is-empty'}
        disabled={disabled}
        aria-expanded={open}
        onClick={() => {
          if (open) closePanel();
          else setOpen(true);
        }}
      >
        {label}
      </button>
      {open ? (
        <div className="addr-picker-panel">
          <input
            placeholder="Tìm tỉnh, huyện, xã, thôn, dự án…"
            value={keyword}
            autoFocus
            onChange={(e) => setKeyword(e.target.value)}
          />
          {loading ? <p className="crm-form-hint">Đang tải…</p> : null}
          {error ? <p className="crm-form-error">{error}</p> : null}
          <ul>
            {items.map((item) => {
              const { title, sub } = itemParts(item);
              const isProject = item.kind === AddressKind.PROJECT;
              return (
                <li key={item.id}>
                  <button
                    type="button"
                    className="addr-picker-item"
                    onPointerDown={(e) => {
                      /* preventDefault: không để click “rơi” xuống trigger sau khi panel unmount */
                      e.preventDefault();
                      pickItem(item);
                    }}
                  >
                    <span
                      className={
                        isProject ? 'addr-kind-tag is-project' : 'addr-kind-tag'
                      }
                    >
                      {isProject ? 'Dự án' : 'Thường'}
                    </span>
                    <span className="addr-picker-item-text">
                      <strong>{title}</strong>
                      {sub ? <span className="addr-picker-item-sub">{sub}</span> : null}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <button type="button" className="crm-btn" onPointerDown={(e) => {
            e.preventDefault();
            clearSelection();
          }}>
            Bỏ chọn
          </button>
        </div>
      ) : null}
    </div>
  );
}
