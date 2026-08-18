'use client';

import { ListFilter } from 'lucide-react';
import { CrmDialog } from '@/shared/ui/dialog';
import {
  ADDRESS_FILTER_OPTIONS,
  KIND_FILTER_OPTIONS,
  PHOTO_FILTER_OPTIONS,
  PRICE_FILTER_OPTIONS,
  SPECS_FILTER_OPTIONS,
  STATUS_FILTER_OPTIONS,
  type ExtraFilters,
} from '../display';

type Props = {
  open: boolean;
  status: string;
  kind: string;
  extra: ExtraFilters;
  onStatus: (v: string) => void;
  onKind: (v: string) => void;
  onExtra: (next: ExtraFilters) => void;
  onReset: () => void;
  onClose: () => void;
};

function Field({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (v: string) => void;
}) {
  return (
    <label>
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)}>
        {options.map((opt) => (
          <option key={opt.value || 'all'} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function FilterDialog({
  open,
  status,
  kind,
  extra,
  onStatus,
  onKind,
  onExtra,
  onReset,
  onClose,
}: Props) {
  return (
    <CrmDialog open={open} title="Bộ lọc lô đất" icon={ListFilter} onClose={onClose}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onClose();
        }}
      >
        <Field label="Trạng thái" value={status} options={STATUS_FILTER_OPTIONS} onChange={onStatus} />
        <Field label="Phân loại" value={kind} options={KIND_FILTER_OPTIONS} onChange={onKind} />
        <Field
          label="Ảnh"
          value={extra.photo}
          options={PHOTO_FILTER_OPTIONS}
          onChange={(v) => onExtra({ ...extra, photo: v as ExtraFilters['photo'] })}
        />
        <Field
          label="Địa chỉ"
          value={extra.address}
          options={ADDRESS_FILTER_OPTIONS}
          onChange={(v) => onExtra({ ...extra, address: v as ExtraFilters['address'] })}
        />
        <Field
          label="DT · MT · Hướng"
          value={extra.specs}
          options={SPECS_FILTER_OPTIONS}
          onChange={(v) => onExtra({ ...extra, specs: v as ExtraFilters['specs'] })}
        />
        <Field
          label="Giá bán"
          value={extra.price}
          options={PRICE_FILTER_OPTIONS}
          onChange={(v) => onExtra({ ...extra, price: v as ExtraFilters['price'] })}
        />
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" onClick={onReset}>
            Xóa lọc
          </button>
          <button type="submit" className="crm-btn primary">
            Xong
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
