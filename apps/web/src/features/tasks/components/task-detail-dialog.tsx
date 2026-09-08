'use client';

import { ListTodo } from 'lucide-react';
import {
  TaskTargetType,
  formatTaskDueOn,
  isWorkTaskCompleted,
  taskContextLine,
  taskDueCountdown,
  type WorkTask,
} from '@crmanhung/shared';
import { CrmBadge } from '@/shared/ui/badge';
import { CrmDialog } from '@/shared/ui/dialog';

type Props = {
  item: WorkTask | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onComplete: () => void;
};

export function TaskDetailDialog({
  item,
  busy = false,
  error = null,
  onClose,
  onComplete,
}: Props) {
  if (!item) return null;
  const done = isWorkTaskCompleted(item);
  const countdown = done ? null : taskDueCountdown(item.dueOn);

  return (
    <CrmDialog open title="Công việc" icon={ListTodo} onClose={onClose} busy={busy}>
      <p className={`cv-detail-content${done ? ' is-done' : ''}`}>{item.content}</p>
      <p className={`cv-detail-source${done ? ' is-done' : ''}`}>
        {taskContextLine(item.targetType as TaskTargetType, item.targetLabel)}
      </p>
      <p className="cv-detail-due">
        <span>Hạn {formatTaskDueOn(item.dueOn)}</span>
        {done ? (
          <CrmBadge tone="green">Đã hoàn thành</CrmBadge>
        ) : countdown ? (
          <CrmBadge tone={countdown.tone}>{countdown.label}</CrmBadge>
        ) : null}
      </p>
      {error ? <p className="crm-form-error">{error}</p> : null}
      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
          Đóng
        </button>
        {!done ? (
          <button type="button" className="crm-btn primary" disabled={busy} onClick={onComplete}>
            {busy ? 'Đang lưu…' : 'Hoàn thành'}
          </button>
        ) : null}
      </div>
    </CrmDialog>
  );
}
