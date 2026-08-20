'use client';

import { NotebookPen } from 'lucide-react';
import { CrmDialog } from '@/shared/ui/dialog';
import type { CustomerListItem, UpdateCustomerCareInput } from '@crmanhung/shared';
import { CustomerCareEditForm } from './care-edit-form';

type Props = {
  customer: CustomerListItem | null;
  busy: boolean;
  error: string | null;
  onClose: () => void;
  onSubmit: (input: UpdateCustomerCareInput) => Promise<void>;
};

export function CustomerCareEditModal({
  customer,
  busy,
  error,
  onClose,
  onSubmit,
}: Props) {
  const name = customer?.fullName?.trim() ?? '';
  const title = name ? `Cập nhật chăm sóc — ${name}` : 'Cập nhật chăm sóc';

  return (
    <CrmDialog
      open={Boolean(customer)}
      title={title}
      icon={NotebookPen}
      onClose={onClose}
      busy={busy}
      className="kh-care-dialog"
    >
      {customer ? (
        <CustomerCareEditForm
          key={customer.id}
          customer={customer}
          busy={busy}
          error={error}
          onCancel={onClose}
          onSubmit={onSubmit}
        />
      ) : null}
    </CrmDialog>
  );
}
