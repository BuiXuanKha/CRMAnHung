'use client';

import { Pencil, Phone, Plus, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  addCustomerPhoneSchema,
  type CustomerListItem,
  type CustomerPhone,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import { Icon } from '@/shared/ui/icon';
import { handlePhonePaste, phoneDigitsFromChange } from '@/shared/phone-input';

type Draft = { mode: 'add' } | { mode: 'edit'; phone: CustomerPhone };

type Props = {
  customer: CustomerListItem | null;
  phones: CustomerPhone[];
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onAdd: (phone: string) => Promise<void>;
  onUpdate: (phoneId: string, phone: string) => Promise<void>;
  onDelete: (phone: CustomerPhone) => void;
};

export function ManageCustomerPhonesModal({
  customer,
  phones,
  busy,
  error,
  onClose,
  onAdd,
  onUpdate,
  onDelete,
}: Props) {
  const [draft, setDraft] = useState<Draft | null>(null);
  const [value, setValue] = useState('');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    if (!customer) {
      setDraft(null);
      setValue('');
      setParseError(null);
    }
  }, [customer]);

  useEffect(() => {
    if (!draft) {
      setValue('');
      setParseError(null);
      return;
    }
    setValue(draft.mode === 'edit' ? draft.phone.phone : '');
    setParseError(null);
  }, [draft]);

  if (!customer) return null;

  const name = customer.fullName?.trim() || 'khách';
  const title = draft
    ? draft.mode === 'edit'
      ? `Sửa số — ${name}`
      : `Thêm số — ${name}`
    : `Số điện thoại — ${name}`;

  return (
    <CrmDialog open={Boolean(customer)} title={title} icon={Phone} onClose={onClose} busy={busy}>
      {draft ? (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const parsed = addCustomerPhoneSchema.safeParse({ phone: value });
            if (!parsed.success) {
              setParseError(parsed.error.issues[0]?.message ?? 'Số không hợp lệ.');
              return;
            }
            setParseError(null);
            void (async () => {
              if (draft.mode === 'edit') {
                await onUpdate(draft.phone.id, parsed.data.phone);
              } else {
                await onAdd(parsed.data.phone);
              }
              setDraft(null);
            })();
          }}
        >
          <label>
            Số điện thoại
            <input
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="0xxxxxxxxx"
              value={value}
              disabled={busy}
              required
              autoFocus
              onChange={(e) => {
                setValue(phoneDigitsFromChange(e));
                if (parseError) setParseError(null);
              }}
              onPaste={(e) => {
                handlePhonePaste(e, setValue);
                if (parseError) setParseError(null);
              }}
            />
          </label>
          {parseError || error ? (
            <p className="crm-form-error">{parseError || error}</p>
          ) : null}
          <div className="crm-dialog-actions kh-phone-manage-footer">
            <button
              type="button"
              className="crm-btn"
              disabled={busy}
              onClick={() => setDraft(null)}
            >
              Quay lại
            </button>
            <button type="submit" className="crm-btn primary" disabled={busy}>
              {busy ? 'Đang lưu…' : 'Lưu số'}
            </button>
          </div>
        </form>
      ) : (
        <div className="kh-phone-manage">
          {phones.length === 0 ? (
            <p className="crm-form-hint">Chưa có số. Bấm «Thêm số» bên dưới.</p>
          ) : (
            <ul className="kh-phone-manage-list">
              {phones.map((p) => (
                <li key={p.id} className="kh-phone-manage-row">
                  <p className="kh-phone-manage-num">{p.phone}</p>
                  <div className="kh-phone-manage-actions">
                    <button
                      type="button"
                      className="crm-btn"
                      disabled={busy}
                      aria-label={`Sửa ${p.phone}`}
                      onClick={() => setDraft({ mode: 'edit', phone: p })}
                    >
                      <Icon icon={Pencil} size={16} />
                      Sửa
                    </button>
                    <button
                      type="button"
                      className="crm-btn danger"
                      disabled={busy}
                      aria-label={`Xóa ${p.phone}`}
                      onClick={() => onDelete(p)}
                    >
                      <Icon icon={Trash2} size={16} />
                      Xóa
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
          {error ? <p className="crm-form-error">{error}</p> : null}
          <div className="crm-dialog-actions kh-phone-manage-footer">
            <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
              Đóng
            </button>
            <button
              type="button"
              className="crm-btn primary"
              disabled={busy || phones.length >= 10}
              onClick={() => setDraft({ mode: 'add' })}
            >
              <Icon icon={Plus} size={16} />
              Thêm số
            </button>
          </div>
        </div>
      )}
    </CrmDialog>
  );
}
