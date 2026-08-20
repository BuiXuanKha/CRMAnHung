'use client';

import { useEffect, useRef, useState } from 'react';
import {
  CUSTOMER_BUDGET_BRACKETS,
  CUSTOMER_BUDGET_CUSTOM_KEY,
  CUSTOMER_BUDGET_UNSET_KEY,
  CUSTOMER_STATUS_LABELS,
  CustomerStatus,
  findCustomerBudgetBracketKey,
  updateCustomerCareSchema,
  type CustomerListItem,
  type UpdateCustomerCareInput,
} from '@crmanhung/shared';
import { formatBudget } from '../display';
import './care-edit-form.css';

type Props = {
  customer: CustomerListItem;
  busy: boolean;
  error: string | null;
  onCancel: () => void;
  onSubmit: (input: UpdateCustomerCareInput) => Promise<void>;
};

export function CustomerCareEditForm({
  customer,
  busy,
  error,
  onCancel,
  onSubmit,
}: Props) {
  const needRef = useRef<HTMLTextAreaElement>(null);
  const [status, setStatus] = useState<CustomerStatus>(customer.status);
  const [budgetKey, setBudgetKey] = useState(() =>
    findCustomerBudgetBracketKey(customer.budgetMinVnd, customer.budgetMaxVnd),
  );
  const [needSummary, setNeedSummary] = useState(customer.latestNeedSummary ?? '');
  const [note, setNote] = useState(customer.latestCareNote ?? '');
  const [parseError, setParseError] = useState<string | null>(null);

  useEffect(() => {
    const t = window.setTimeout(() => needRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [customer.id]);

  function budgetPayload(): { min: number | null; max: number | null } {
    if (budgetKey === CUSTOMER_BUDGET_UNSET_KEY) return { min: null, max: null };
    if (budgetKey === CUSTOMER_BUDGET_CUSTOM_KEY) {
      return {
        min: customer.budgetMinVnd ?? null,
        max: customer.budgetMaxVnd ?? null,
      };
    }
    const bracket = CUSTOMER_BUDGET_BRACKETS.find((b) => b.key === budgetKey);
    return bracket
      ? { min: bracket.min, max: bracket.max }
      : { min: null, max: null };
  }

  return (
    <form
      className="kh-care-form"
      onSubmit={(e) => {
        e.preventDefault();
        const budget = budgetPayload();
        const parsed = updateCustomerCareSchema.safeParse({
          status,
          budgetMinVnd: budget.min,
          budgetMaxVnd: budget.max,
          needSummary,
          note,
        });
        if (!parsed.success) {
          setParseError(
            parsed.error.issues[0]?.message ?? 'Dữ liệu không hợp lệ.',
          );
          return;
        }
        setParseError(null);
        void onSubmit(parsed.data);
      }}
    >
      <label>
        Trạng thái khách hàng
        <select
          value={status}
          disabled={busy}
          onChange={(e) => setStatus(e.target.value as CustomerStatus)}
        >
          {Object.values(CustomerStatus).map((value) => (
            <option key={value} value={value}>
              {CUSTOMER_STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </label>

      <label>
        Nhu cầu khách hàng
        <textarea
          ref={needRef}
          value={needSummary}
          maxLength={500}
          rows={3}
          placeholder="VD: Tìm căn 2PN gần Q7, gần trường học, dưới 3 tỷ"
          disabled={busy}
          onChange={(e) => setNeedSummary(e.target.value)}
        />
      </label>

      <fieldset className="kh-care-chips" disabled={busy}>
        <legend>Khoảng tài chính</legend>
        <div role="radiogroup" aria-label="Khoảng tài chính">
          {CUSTOMER_BUDGET_BRACKETS.map((b) => (
            <button
              key={b.key}
              type="button"
              role="radio"
              aria-checked={budgetKey === b.key}
              className={budgetKey === b.key ? 'is-active' : undefined}
              disabled={busy}
              onClick={() => setBudgetKey(b.key)}
            >
              {b.label}
            </button>
          ))}
          {budgetKey === CUSTOMER_BUDGET_CUSTOM_KEY ? (
            <button
              type="button"
              role="radio"
              aria-checked
              className="is-active"
              disabled={busy}
            >
              {formatBudget(customer.budgetMinVnd, customer.budgetMaxVnd)}
            </button>
          ) : null}
          <button
            type="button"
            role="radio"
            aria-checked={budgetKey === CUSTOMER_BUDGET_UNSET_KEY}
            className={budgetKey === CUSTOMER_BUDGET_UNSET_KEY ? 'is-active' : undefined}
            disabled={busy}
            onClick={() => setBudgetKey(CUSTOMER_BUDGET_UNSET_KEY)}
          >
            Chưa xác định
          </button>
        </div>
      </fieldset>

      <label>
        Ghi chú khách hàng
        <textarea
          value={note}
          maxLength={1000}
          rows={4}
          placeholder="VD: Đã gọi 14h, khách bận, hẹn 18h gọi lại"
          disabled={busy}
          onChange={(e) => setNote(e.target.value)}
        />
      </label>

      {error || parseError ? (
        <p className="crm-form-error">{error ?? parseError}</p>
      ) : null}

      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" disabled={busy} onClick={onCancel}>
          Huỷ
        </button>
        <button type="submit" className="crm-btn primary" disabled={busy}>
          {busy ? 'Đang lưu…' : 'Lưu thay đổi'}
        </button>
      </div>
    </form>
  );
}
