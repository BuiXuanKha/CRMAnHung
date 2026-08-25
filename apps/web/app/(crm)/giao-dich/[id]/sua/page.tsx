import { Suspense } from 'react';
import { TransactionFormPage } from '@/features/transactions/transaction-form-page';

export default function GiaoDichEditRoute() {
  return (
    <Suspense fallback={null}>
      <TransactionFormPage mode="edit" />
    </Suspense>
  );
}
