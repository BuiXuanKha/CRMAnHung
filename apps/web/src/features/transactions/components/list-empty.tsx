'use client';

import Link from 'next/link';
import { UserRole } from '@crmanhung/shared';
import { useAuth } from '@/features/auth/auth-context';

type Props = {
  filtered: boolean;
};

/** Empty list: no GDs yet (STAFF) vs no rows matching filters. */
export function TransactionListEmpty({ filtered }: Props) {
  const { user } = useAuth();
  if (filtered) {
    return <p className="tx-empty-copy">Không có giao dịch phù hợp.</p>;
  }
  if (user?.role === UserRole.ADMIN) {
    return <p className="tx-empty-copy">Chưa có giao dịch.</p>;
  }
  return (
    <div className="tx-empty-copy">
      <p>Chưa có giao dịch.</p>
      <p>
        Tạo từ nút <strong>Giao dịch</strong> trên lô đất —{' '}
        <Link href="/lo-dat">mở danh sách lô đất</Link>.
      </p>
    </div>
  );
}
