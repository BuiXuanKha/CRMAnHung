'use client';

import { Phone } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { addCustomerPhoneSchema, type CustomerListItem } from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  customer: CustomerListItem | null;
  mode?: 'add' | 'edit';
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (phone: string) => Promise<void>;
  onDelete?: () => void;
};

export function AddCustomerPhoneModal({
  customer,
  mode = 'add',
  busy,
  error,
  onClose,
  onSubmit,
  onDelete,
}: Props) {
  const [phone, setPhone] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const name = customer?.fullName?.trim() ?? '';
  const isEdit = mode === 'edit';
  const title = name
    ? `${isEdit ? 'Sửa số điện thoại' : 'Thêm số điện thoại'} — ${name}`
    : isEdit
      ? 'Sửa số điện thoại'
      : 'Thêm số điện thoại';

  useEffect(() => {
    if (!customer) return;
    setPhone(isEdit ? customer.primaryPhone ?? '' : '');
    setParseError(null);
    const t = window.setTimeout(() => inputRef.current?.focus(), 50);
    return () => window.clearTimeout(t);
  }, [customer, isEdit]);

  return (
    <CrmDialog
      open={Boolean(customer)}
      title={title}
      icon={Phone}
      onClose={onClose}
      busy={busy}
    >
      {customer ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = addCustomerPhoneSchema.safeParse({ phone });
            if (!parsed.success) {
              setParseError(
                parsed.error.issues[0]?.message ?? 'Số điện thoại không hợp lệ.',
              );
              inputRef.current?.focus();
              return;
            }
            setParseError(null);
            void onSubmit(parsed.data.phone);
          }}
        >
          <label>
            Số điện thoại
            <input
              ref={inputRef}
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0xxxxxxxxx"
              value={phone}
              maxLength={10}
              disabled={busy}
              required
              onChange={(e) => {
                setPhone(e.target.value.replace(/\D/g, '').slice(0, 10));
                if (parseError) setParseError(null);
              }}
            />
          </label>
          {parseError || error ? (
            <p className="crm-form-error">{parseError || error}</p>
          ) : null}
          <div className="crm-dialog-actions">
            {isEdit && onDelete ? (
              <button
                type="button"
                className="crm-btn danger push-left"
                disabled={busy}
                onClick={onDelete}
              >
                Xóa số
              </button>
            ) : null}
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Huỷ
            </button>
            <button type="submit" className="crm-btn primary" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu số'}
            </button>
          </div>
        </form>
      ) : null}
    </CrmDialog>
  );
}
