'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { patchInfiniteListItem } from '@/shared/list-state';
import type { CustomerListItem } from '@crmanhung/shared';
import {
  customerDetailToListItem,
  getCustomer,
  stashCareToast,
  updateCustomerCare,
} from './api';
import { CustomerCareEditForm } from './components/care-edit-form';
import './components/care-edit-form.css';

export function CustomerCarePage() {
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const detail = useQuery({
    queryKey: ['customer', id],
    queryFn: () => getCustomer(id),
    enabled: Boolean(id),
  });

  function goBack() {
    router.push('/khach-hang');
  }

  if (detail.isLoading) {
    return (
      <div className="kh-care-page">
        <p>Đang tải…</p>
      </div>
    );
  }

  if (detail.error || !detail.data) {
    return (
      <div className="kh-care-page">
        <button type="button" className="kh-care-back" onClick={goBack}>
          ← Danh sách khách
        </button>
        <p className="crm-form-error">
          {detail.error instanceof Error
            ? detail.error.message
            : 'Không tìm thấy khách hàng'}
        </p>
      </div>
    );
  }

  const customer = detail.data;

  if (customer.isHidden) {
    return (
      <div className="kh-care-page">
        <button type="button" className="kh-care-back" onClick={goBack}>
          ← Danh sách khách
        </button>
        <p className="crm-form-error">
          Không cập nhật chăm sóc cho khách đã ẩn. Hãy khôi phục trước.
        </p>
      </div>
    );
  }

  return (
    <div className="kh-care-page">
      <header>
        <button type="button" className="kh-care-back" onClick={goBack}>
          ← Danh sách khách
        </button>
        <h1>Cập nhật chăm sóc — {customer.fullName}</h1>
      </header>
      <CustomerCareEditForm
        customer={customer}
        busy={busy}
        error={error}
        onCancel={goBack}
        onSubmit={async (input) => {
          setBusy(true);
          setError(null);
          try {
            const result = await updateCustomerCare(customer.id, input);
            const { unchanged, ...detail } = result;
            patchInfiniteListItem<CustomerListItem>(qc, ['customers'], customer.id, () =>
              customerDetailToListItem(detail),
            );
            qc.setQueryData(['customer', customer.id], detail);
            stashCareToast(unchanged);
            goBack();
          } catch (err) {
            setError(err instanceof Error ? err.message : 'Không lưu được.');
          } finally {
            setBusy(false);
          }
        }}
      />
    </div>
  );
}
