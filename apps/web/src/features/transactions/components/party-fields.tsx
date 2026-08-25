'use client';

import { useEffect, useState } from 'react';
import { Plus, Trash2, UserRoundSearch } from 'lucide-react';
import type { TransactionPartyInput } from '@crmanhung/shared';
import { listCustomers } from '@/features/customers/api';
import { Icon } from '@/shared/ui/icon';

type PartyDraft = TransactionPartyInput & { key: string };

type Props = {
  label: string;
  addLabel: string;
  values: PartyDraft[];
  onChange: (next: PartyDraft[]) => void;
  disabled?: boolean;
};

export function emptyParty(sortOrder: number): PartyDraft {
  return { key: `p_${Date.now()}_${sortOrder}`, freeTextName: '', customerId: null, sortOrder };
}

export function PartyFields({ label, addLabel, values, onChange, disabled }: Props) {
  const [suggestFor, setSuggestFor] = useState<string | null>(null);
  const [keyword, setKeyword] = useState('');
  const [hits, setHits] = useState<{ id: string; fullName: string }[]>([]);

  useEffect(() => {
    if (!suggestFor) {
      setHits([]);
      return;
    }
    const q = keyword.trim();
    const timer = window.setTimeout(() => {
      void listCustomers({ keyword: q || undefined, limit: 8 }).then((res) => {
        setHits(res.items.map((c) => ({ id: c.id, fullName: c.fullName })));
      });
    }, 200);
    return () => window.clearTimeout(timer);
  }, [keyword, suggestFor]);

  function patch(key: string, patchVal: Partial<PartyDraft>) {
    onChange(values.map((row) => (row.key === key ? { ...row, ...patchVal } : row)));
  }

  return (
    <div className="tx-form-parties">
      <div className="tx-form-parties-head">
        <span className="tx-form-label">{label}</span>
        <button
          type="button"
          className="tx-form-add-party"
          disabled={disabled}
          onClick={() => onChange([...values, emptyParty(values.length)])}
        >
          <Icon icon={Plus} size={14} /> {addLabel}
        </button>
      </div>
      {values.map((row) => (
        <div key={row.key} className="tx-form-party-row">
          <input
            value={row.freeTextName}
            disabled={disabled}
            placeholder="Tên"
            aria-label={label}
            onChange={(e) => {
              patch(row.key, { freeTextName: e.target.value, customerId: null });
            }}
          />
          <button
            type="button"
            className="tx-form-party-pick"
            disabled={disabled}
            aria-label="Chọn khách CRM"
            onClick={() => {
              setSuggestFor((cur) => (cur === row.key ? null : row.key));
              setKeyword(row.freeTextName);
            }}
          >
            <Icon icon={UserRoundSearch} size={16} />
          </button>
          {values.length > 1 ? (
            <button
              type="button"
              className="tx-form-party-remove"
              disabled={disabled}
              aria-label="Xóa dòng"
              onClick={() =>
                onChange(values.filter((p) => p.key !== row.key).map((p, i) => ({ ...p, sortOrder: i })))
              }
            >
              <Icon icon={Trash2} size={16} />
            </button>
          ) : null}
          {suggestFor === row.key ? (
            <div className="tx-form-suggest">
              <input
                value={keyword}
                placeholder="Tìm khách..."
                aria-label="Tìm khách CRM"
                onChange={(e) => setKeyword(e.target.value)}
              />
              <ul>
                {hits.map((c) => (
                  <li key={c.id}>
                    <button
                      type="button"
                      onClick={() => {
                        patch(row.key, { freeTextName: c.fullName, customerId: c.id });
                        setSuggestFor(null);
                      }}
                    >
                      {c.fullName}
                    </button>
                  </li>
                ))}
                {hits.length === 0 ? <li className="tx-form-suggest-empty">Không có khách khớp.</li> : null}
              </ul>
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}
