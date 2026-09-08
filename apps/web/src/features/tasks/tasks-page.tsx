'use client';

import { useQuery } from '@tanstack/react-query';
import { ListTodo } from 'lucide-react';
import { TaskTargetType, formatTaskDueOn, taskContextLine } from '@crmanhung/shared';
import { Icon } from '@/shared/ui/icon';
import { listWorkTasks } from './api';
import './tasks-page.css';

export function TasksPage() {
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: listWorkTasks,
  });

  const items = query.data?.items ?? [];
  const loading = query.isLoading;
  const error = query.error instanceof Error ? query.error.message : null;

  return (
    <section className="cv-page" aria-labelledby="cv-title">
      <header className="cv-head">
        <h1 id="cv-title">Công việc</h1>
        <p className="cv-lead">Trang nhắc việc và ghi chú nhỏ cho việc cần làm.</p>
      </header>
      <div className="cv-body">
        {loading ? <p className="cv-state">Đang tải…</p> : null}
        {error ? <p className="cv-state is-error">{error}</p> : null}
        {!loading && !error && items.length === 0 ? (
          <div className="cv-empty">
            <Icon icon={ListTodo} size="md" />
            <p>Chưa có công việc.</p>
            <p>Thêm từ menu Thao tác trên khách, lô đất, giao dịch hoặc sổ đỏ.</p>
          </div>
        ) : null}
        {!loading && items.length > 0 ? (
          <ul className="cv-list">
            {items.map((item) => (
              <li key={item.id} className="cv-item">
                <p className="cv-item-content">{item.content}</p>
                <p className="cv-item-due">Hạn {formatTaskDueOn(item.dueOn)}</p>
                <p className="cv-item-target">
                  {taskContextLine(item.targetType as TaskTargetType, item.targetLabel)}
                </p>
              </li>
            ))}
          </ul>
        ) : null}
      </div>
    </section>
  );
}
