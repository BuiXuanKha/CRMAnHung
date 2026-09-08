'use client';

import { ListTodo } from 'lucide-react';
import {
  TaskTargetType,
  formatTaskDueOn,
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
  const countdown = taskDueCountdown(item.dueOn);

  return (
    <CrmDialog open title="Công việc" icon={ListTodo} onClose={onClose} busy={busy}>
      <p className="cv-detail-content">{item.content}</p>
      <p className="cv-detail-source">
        {taskContextLine(item.targetType as TaskTargetType, item.targetLabel)}
      </p>
      <p className="cv-detail-due">
        <span>Hạn {formatTaskDueOn(item.dueOn)}</span>
        <CrmBadge tone={countdown.tone}>{countdown.label}</CrmBadge>
      </p>
      {error ? <p className="crm-form-error">{error}</p> : null}
      <div className="crm-dialog-actions">
        <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
          Đóng
        </button>
        <button type="button" className="crm-btn primary" disabled={busy} onClick={onComplete}>
          {busy ? 'Đang lưu…' : 'Hoàn thành'}
        </button>
      </div>
    </CrmDialog>
  );
}
