'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTransaction } from './api';
import './transactions.css';

export function TransactionDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const q = useQuery({
    queryKey: ['transaction', id],
    queryFn: () => getTransaction(id),
    enabled: Boolean(id),
  });

  return (
    <div className="tx-placeholder">
      <p>
        <Link href="/giao-dich">← Quản lý giao dịch</Link>
      </p>
      <h1>Chi tiết giao dịch</h1>
      {q.isLoading ? <p>Đang tải…</p> : null}
      {q.error ? <p>{(q.error as Error).message}</p> : null}
      {q.data ? (
        <>
          <p>
            <strong>{q.data.code}</strong>
            {q.data.lodatTitle?.trim() ? ` · ${q.data.lodatTitle}` : ''}
          </p>
          <p>Form sửa và snapshot lô — sẽ làm sau khi chốt màn chi tiết.</p>
        </>
      ) : null}
    </div>
  );
}
