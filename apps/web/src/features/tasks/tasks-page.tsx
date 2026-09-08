'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { WorkTask } from '@crmanhung/shared';
import { CrmToast } from '@/shared/ui/dialog';
import { completeWorkTask, listWorkTasks, pinWorkTask } from './api';
import { type WorkTaskAction } from './components/action-menu';
import { TaskCardList } from './components/task-card-list';
import { TaskDetailDialog } from './components/task-detail-dialog';
import { TaskTable } from './components/task-table';
import './tasks-page.css';

export function TasksPage() {
  const qc = useQueryClient();
  const query = useQuery({
    queryKey: ['tasks'],
    queryFn: listWorkTasks,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [menuId, setMenuId] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [completeError, setCompleteError] = useState<string | null>(null);

  const items = query.data?.items ?? [];
  const total = query.data?.total ?? items.length;
  const loading = query.isLoading;
  const error = query.error instanceof Error ? query.error.message : null;
  const detail = items.find((row) => row.id === detailId) ?? null;

  const pinMut = useMutation({
    mutationFn: (item: WorkTask) => pinWorkTask(item.id, { pinned: !item.isPinned }),
    onSuccess: async (updated) => {
      await qc.invalidateQueries({ queryKey: ['tasks'] });
      flash(updated.isPinned ? 'Đã ghim công việc.' : 'Đã bỏ ghim công việc.');
    },
    onError: (err) => {
      flash(err instanceof Error ? err.message : 'Không ghim được công việc.');
    },
  });

  const completeMut = useMutation({
    mutationFn: (id: string) => completeWorkTask(id),
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['tasks'] });
      setDetailId(null);
      setSelectedId(null);
      setCompleteError(null);
      flash('Đã hoàn thành công việc.');
    },
    onError: (err) => {
      const msg = err instanceof Error ? err.message : 'Không hoàn thành được công việc.';
      setCompleteError(msg);
      flash(msg);
    },
  });

  function flash(msg: string) {
    setToast(msg);
    window.setTimeout(() => setToast(null), 2800);
  }

  function openDetail(item: WorkTask) {
    setSelectedId(item.id);
    setDetailId(item.id);
    setCompleteError(null);
  }

  function handleAction(item: WorkTask, action: WorkTaskAction) {
    setMenuId(null);
    if (action === 'detail') {
      openDetail(item);
      return;
    }
    if (action === 'pin') {
      setSelectedId(item.id);
      void pinMut.mutateAsync(item);
      return;
    }
    setSelectedId(item.id);
    setCompleteError(null);
    void completeMut.mutateAsync(item.id);
  }

  return (
    <section className="cv-page" aria-labelledby="cv-title">
      <header className="cv-head">
        <h1 id="cv-title">Công việc</h1>
        <p className="cv-lead">Trang nhắc việc và ghi chú nhỏ cho việc cần làm.</p>
      </header>

      {loading ? <p className="cv-state">Đang tải…</p> : null}
      {error ? <p className="cv-state is-error">{error}</p> : null}

      {!loading && !error ? (
        <div className="cv-list-restore">
          <section className="cv-table-shell" aria-label="Danh sách công việc">
            <TaskTable
              items={items}
              total={total}
              selectedId={selectedId}
              menuId={menuId}
              onSelect={(id) => {
                const item = items.find((row) => row.id === id);
                if (item) openDetail(item);
              }}
              onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
              onCloseMenu={() => setMenuId(null)}
              onAction={handleAction}
            />
          </section>
          <TaskCardList
            items={items}
            total={total}
            selectedId={selectedId}
            menuId={menuId}
            onSelect={(id) => {
              const item = items.find((row) => row.id === id);
              if (item) openDetail(item);
            }}
            onToggleMenu={(id) => setMenuId((cur) => (cur === id ? null : id))}
            onCloseMenu={() => setMenuId(null)}
            onAction={handleAction}
          />
        </div>
      ) : null}

      <TaskDetailDialog
        item={detail}
        busy={completeMut.isPending}
        error={completeError}
        onClose={() => {
          if (!completeMut.isPending) {
            setDetailId(null);
            setCompleteError(null);
          }
        }}
        onComplete={() => {
          if (detail) void completeMut.mutateAsync(detail.id);
        }}
      />
      <CrmToast message={toast} />
    </section>
  );
}
