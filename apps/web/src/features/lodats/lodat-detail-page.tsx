'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getLodat } from './api';
import './lodats.css';

export function LodatDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const q = useQuery({
    queryKey: ['lodat', id],
    queryFn: () => getLodat(id),
    enabled: Boolean(id),
  });

  return (
    <div className="ld-placeholder">
      <p>
        <Link href="/lo-dat">← Quản lý lô đất</Link>
      </p>
      <h1>Chi tiết lô đất</h1>
      {q.isLoading ? <p>Đang tải…</p> : null}
      {q.error ? <p>{(q.error as Error).message}</p> : null}
      {q.data ? (
        <>
          <p>
            <strong>{q.data.title}</strong>
          </p>
          <p>Ảnh, ghi chú và danh sách chủ — sẽ làm sau khi chốt màn chi tiết.</p>
        </>
      ) : null}
    </div>
  );
}
