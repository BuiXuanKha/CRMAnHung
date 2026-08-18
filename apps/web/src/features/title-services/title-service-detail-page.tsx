'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { getTitleService } from './api';
import './title-services.css';

export function TitleServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const q = useQuery({
    queryKey: ['title-service', id],
    queryFn: () => getTitleService(id),
    enabled: Boolean(id),
  });

  return (
    <div className="sd-placeholder">
      <p>
        <Link href="/dich-vu-so-do">← Dịch vụ sổ đỏ</Link>
      </p>
      <h1>Chi tiết hồ sơ sổ đỏ</h1>
      {q.isLoading ? <p>Đang tải…</p> : null}
      {q.error ? <p>{(q.error as Error).message}</p> : null}
      {q.data ? (
        <>
          <p>
            <strong>{q.data.code}</strong>
            {q.data.customerName ? ` · ${q.data.customerName}` : ''}
          </p>
          <p>Form đầy đủ — sẽ làm sau; hiện dùng panel phải trên danh sách.</p>
        </>
      ) : null}
    </div>
  );
}
