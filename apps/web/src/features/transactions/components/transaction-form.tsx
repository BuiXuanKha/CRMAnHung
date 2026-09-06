'use client';

import {
  TRANSACTION_STATUS_LABELS,
  TRANSACTION_TYPE_LABELS,
  TransactionStatus,
  TransactionType,
  type TransactionPartyInput,
} from '@crmanhung/shared';
import { formatPriceInput } from '../api';
import { LodatSearchPicker } from '@/features/lodats/components/lodat-search-picker';
import { PartyFields, emptyParty } from './party-fields';

export type TransactionFormValues = {
  type: TransactionType;
  lodatId: string;
  status: TransactionStatus;
  notaryDate: string;
  salePrice: string;
  taxPrice: string;
  commission: string;
  note: string;
  cancelReason: string;
  sellers: Array<TransactionPartyInput & { key: string }>;
  buyers: Array<TransactionPartyInput & { key: string }>;
};


type Props = {
  mode: 'create' | 'edit';
  values: TransactionFormValues;
  lodatLocked: boolean;
  lodatTitle?: string | null;
  busy?: boolean;
  onChange: (next: TransactionFormValues) => void;
};

export function defaultFormValues(): TransactionFormValues {
  return {
    type: TransactionType.OWN,
    lodatId: '',
    status: TransactionStatus.DA_COC,
    notaryDate: '',
    salePrice: '',
    taxPrice: '',
    commission: '',
    note: '',
    cancelReason: '',
    sellers: [emptyParty(0)],
    buyers: [emptyParty(0)],
  };
}

export function TransactionFormFields({
  mode,
  values,
  lodatLocked,
  lodatTitle,
  busy,
  onChange,
}: Props) {
  const record = values.type === TransactionType.RECORD;
  const showCancel = mode === 'edit' && values.status === TransactionStatus.HUY;

  function set<K extends keyof TransactionFormValues>(key: K, value: TransactionFormValues[K]) {
    const next = { ...values, [key]: value };
    if (key === 'type' && value === TransactionType.RECORD) {
      next.commission = '';
    }
    onChange(next);
  }

  return (
    <div className="tx-form-fields">
      <section className="tx-form-card">
        <h2>Thông tin giao dịch</h2>
        <label className="tx-form-field">
          <span className="tx-form-label">Loại</span>
          <select
            value={values.type}
            disabled={busy || mode === 'edit'}
            onChange={(e) => set('type', e.target.value as TransactionType)}
          >
            <option value={TransactionType.OWN}>{TRANSACTION_TYPE_LABELS[TransactionType.OWN]}</option>
            <option value={TransactionType.RECORD}>
              {TRANSACTION_TYPE_LABELS[TransactionType.RECORD]}
            </option>
          </select>
        </label>

        <label className="tx-form-field">
          <span className="tx-form-label">Lô đất</span>
          {mode === 'edit' || lodatLocked ? (
            <input value={lodatTitle?.trim() || '—'} disabled readOnly />
          ) : (
            <LodatSearchPicker
              value={values.lodatId || null}
              labelHint={lodatTitle}
              disabled={busy}
              onChange={(item) => set('lodatId', item?.id ?? '')}
            />
          )}
        </label>

        {mode === 'edit' ? (
          <label className="tx-form-field">
            <span className="tx-form-label">Trạng thái</span>
            <select
              value={values.status}
              disabled={busy}
              onChange={(e) => set('status', e.target.value as TransactionStatus)}
            >
              {(Object.keys(TRANSACTION_STATUS_LABELS) as TransactionStatus[]).map((st) => (
                <option key={st} value={st}>
                  {TRANSACTION_STATUS_LABELS[st]}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <p className="tx-form-hint">Tạo mới luôn ở trạng thái Đã cọc.</p>
        )}

        <label className="tx-form-field">
          <span className="tx-form-label">Hẹn công chứng{values.type === TransactionType.OWN ? ' *' : ''}</span>
          <input
            type="date"
            value={values.notaryDate}
            disabled={busy}
            onChange={(e) => set('notaryDate', e.target.value)}
          />
        </label>
      </section>

      <section className="tx-form-card">
        <h2>Giá</h2>
        <div className="tx-form-row3">
          <label className="tx-form-field">
            <span className="tx-form-label">Giá bán (đ)</span>
            <input
              inputMode="numeric"
              value={values.salePrice}
              disabled={busy}
              onChange={(e) => set('salePrice', formatPriceInput(e.target.value))}
            />
          </label>
          <label className="tx-form-field">
            <span className="tx-form-label">Thuế (đ)</span>
            <input
              inputMode="numeric"
              value={values.taxPrice}
              disabled={busy}
              onChange={(e) => set('taxPrice', formatPriceInput(e.target.value))}
            />
          </label>
          <label className="tx-form-field">
            <span className="tx-form-label">Hoa hồng (đ)</span>
            <input
              inputMode="numeric"
              value={record ? '' : values.commission}
              disabled={busy || record}
              placeholder={record ? 'Không áp dụng' : ''}
              onChange={(e) => set('commission', formatPriceInput(e.target.value))}
            />
          </label>
        </div>
      </section>

      <section className="tx-form-card">
        <h2>Các bên</h2>
        <div className="tx-form-row2">
          <PartyFields
            label="Người bán"
            values={values.sellers}
            disabled={busy}
            onChange={(sellers) => onChange({ ...values, sellers })}
          />
          <PartyFields
            label="Người mua"
            values={values.buyers}
            disabled={busy}
            onChange={(buyers) => onChange({ ...values, buyers })}
          />
        </div>
      </section>

      <section className="tx-form-card">
        <h2>Ghi chú</h2>
        <label className="tx-form-field">
          <span className="tx-form-label">Ghi chú</span>
          <textarea
            rows={3}
            value={values.note}
            disabled={busy}
            onChange={(e) => set('note', e.target.value)}
          />
        </label>
        {showCancel ? (
          <label className="tx-form-field">
            <span className="tx-form-label">Lý do hủy *</span>
            <textarea
              rows={2}
              value={values.cancelReason}
              disabled={busy}
              onChange={(e) => set('cancelReason', e.target.value)}
            />
          </label>
        ) : null}
      </section>
    </div>
  );
}
