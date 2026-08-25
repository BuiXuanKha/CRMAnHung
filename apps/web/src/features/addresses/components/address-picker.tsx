'use client';

import { useEffect, useMemo, useState } from 'react';
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

  return (
    <div className="addr-picker">
      <button
        type="button"
        className={selected ? 'addr-picker-trigger' : 'addr-picker-trigger is-empty'}
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
      >
        {label}
      </button>
      {open ? (
        <div className="addr-picker-panel">
          <input
            placeholder="Tìm tỉnh, huyện, xã, thôn, dự án…"
            value={keyword}
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
                    onClick={() => {
                      setSelected(item);
                      onChange(item);
                      setOpen(false);
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
          <button
            type="button"
            className="crm-btn"
            onClick={() => {
              setSelected(null);
              onChange(null);
              setOpen(false);
            }}
          >
            Bỏ chọn
          </button>
        </div>
      ) : null}
    </div>
  );
}
