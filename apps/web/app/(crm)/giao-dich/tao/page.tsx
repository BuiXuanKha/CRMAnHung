import { Suspense } from 'react';
import { TransactionFormPage } from '@/features/transactions/transaction-form-page';

export default function GiaoDichCreateRoute() {
  return (
    <Suspense fallback={null}>
      <TransactionFormPage mode="create" />
    </Suspense>
  );
}
