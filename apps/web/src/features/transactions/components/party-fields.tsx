'use client';

import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { X } from 'lucide-react';
import type { CustomerListItem, TransactionPartyInput } from '@crmanhung/shared';
import { listCustomers } from '@/features/customers/api';
import { initials } from '@/features/customers/display';
import { CrmBadge } from '@/shared/ui/badge';
import { Icon } from '@/shared/ui/icon';

type PartyDraft = TransactionPartyInput & { key: string };

type Hit = {
  id: string;
  fullName: string;
  phone: string | null;
  avatarUrl: string | null;
};

function toHit(c: CustomerListItem): Hit {
  return {
    id: c.id,
    fullName: c.fullName,
    phone: c.primaryPhone ?? c.phones[0]?.phone ?? null,
    avatarUrl: c.facebook?.avatarUrl ?? null,
  };
}

function namedParties(values: PartyDraft[]): PartyDraft[] {
  return values.filter((row) => row.freeTextName.trim());
}

type Props = {
  label: string;
  values: PartyDraft[];
  onChange: (next: PartyDraft[]) => void;
  disabled?: boolean;
};

export function emptyParty(sortOrder: number): PartyDraft {
  return { key: `p_${Date.now()}_${sortOrder}`, freeTextName: '', customerId: null, sortOrder };
}

function PartyAvatar({ name, url }: { name: string; url?: string | null }) {
  return (
    <span className="tx-party-avatar" aria-hidden>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt="" />
      ) : (
        initials(name)
      )}
    </span>
  );
}

export function PartyFields({ label, values, onChange, disabled }: Props) {
  const listId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [loading, setLoading] = useState(false);

  const chips = namedParties(values);
  const selectedKey = chips.map((p) => p.customerId ?? '').join('|');
  const trimmed = query.trim();
  const optionCount = hits.length;

  useEffect(() => {
    if (!open || disabled) {
      setHits([]);
      return;
    }
    const selectedIds = new Set(
      selectedKey.split('|').filter((id) => id.length > 0),
    );
    const timer = window.setTimeout(() => {
      setLoading(true);
      void listCustomers({ keyword: trimmed || undefined, limit: 8 })
        .then((res) => {
          setHits(res.items.filter((c) => !selectedIds.has(c.id)).map(toHit));
          setActive(0);
        })
        .finally(() => setLoading(false));
    }, 200);
    return () => window.clearTimeout(timer);
  }, [open, disabled, trimmed, selectedKey]);

  useEffect(() => {
    if (!open) return;
    function onDoc(event: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [open]);

  function replace(next: PartyDraft[]) {
    onChange(next.map((row, i) => ({ ...row, sortOrder: i })));
  }

  function addCustomer(hit: Hit) {
    if (chips.some((p) => p.customerId === hit.id)) return;
    replace([
      ...chips,
      {
        key: `p_${hit.id}_${Date.now()}`,
        freeTextName: hit.fullName,
        customerId: hit.id,
        sortOrder: chips.length,
      },
    ]);
    setQuery('');
    setOpen(true);
    inputRef.current?.focus();
  }

  function removeAt(key: string) {
    replace(chips.filter((p) => p.key !== key));
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'Backspace' && !query && chips.length) {
      event.preventDefault();
      removeAt(chips[chips.length - 1].key);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      return;
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, Math.max(optionCount - 1, 0)));
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
      return;
    }
    if (event.key === 'Enter') {
      event.preventDefault();
      if (open && hits[active]) addCustomer(hits[active]);
    }
  }

  return (
    <div className="tx-form-parties">
      <span className="tx-form-label" id={`${listId}-label`}>
        {label}
      </span>
      <div
        ref={boxRef}
        className={['tx-party-box', open ? 'is-open' : '', disabled ? 'is-disabled' : '']
          .filter(Boolean)
          .join(' ')}
        onClick={() => {
          if (disabled) return;
          inputRef.current?.focus();
          setOpen(true);
        }}
      >
        {chips.map((row) => (
          <CrmBadge
            key={row.key}
            tone={row.customerId ? 'blue' : 'gray'}
            className="tx-party-chip"
          >
            <span className="tx-party-chip-name">{row.freeTextName}</span>
            <button
              type="button"
              className="tx-party-chip-x"
              disabled={disabled}
              aria-label={`Xóa ${row.freeTextName}`}
              onClick={(event) => {
                event.stopPropagation();
                removeAt(row.key);
              }}
            >
              <Icon icon={X} size="mini" />
            </button>
          </CrmBadge>
        ))}
        <input
          ref={inputRef}
          value={query}
          disabled={disabled}
          placeholder={chips.length ? 'Thêm người...' : 'Tìm tên hoặc số điện thoại'}
          aria-labelledby={`${listId}-label`}
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={`${listId}-list`}
          role="combobox"
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
        />
        {open && !disabled ? (
          <ul id={`${listId}-list`} role="listbox" className="tx-party-suggest">
            {hits.map((c, i) => (
              <li key={c.id} role="option" aria-selected={active === i}>
                <button
                  type="button"
                  className={active === i ? 'is-active' : undefined}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => addCustomer(c)}
                >
                  <PartyAvatar name={c.fullName} url={c.avatarUrl} />
                  <span className="tx-party-suggest-text">
                    <strong>{c.fullName}</strong>
                    <span>{c.phone || 'Chưa có SĐT'}</span>
                  </span>
                </button>
              </li>
            ))}
            {loading && hits.length === 0 ? (
              <li className="tx-party-suggest-empty">Đang tìm...</li>
            ) : null}
            {!loading && hits.length === 0 && !trimmed ? (
              <li className="tx-party-suggest-empty">Gõ tên hoặc số điện thoại để tìm.</li>
            ) : null}
            {!loading && hits.length === 0 && trimmed ? (
              <li className="tx-party-suggest-empty">Không có khách khớp.</li>
            ) : null}
          </ul>
        ) : null}
      </div>
    </div>
  );
}
