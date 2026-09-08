'use client';

import { ListTodo } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import {
  TaskTargetType,
  taskContextLine,
  ymdInVietnam,
  type CreateWorkTaskInput,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import './create-task-dialog.css';

export type TaskCreateTarget = {
  type: TaskTargetType;
  id: string;
  label: string;
};

type Props = {
  open: boolean;
  target: TaskCreateTarget | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateWorkTaskInput) => void;
};

export function CreateTaskDialog({
  open,
  target,
  busy = false,
  error = null,
  onClose,
  onSubmit,
}: Props) {
  const [content, setContent] = useState('');
  const [dueOn, setDueOn] = useState(ymdInVietnam(1));

  useEffect(() => {
    if (!open || !target) return;
    setContent('');
    setDueOn(ymdInVietnam(1));
  }, [open, target]);

  if (!target) return null;
  const current = target;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      content,
      dueOn,
      targetType: current.type,
      targetId: current.id,
    });
  }

  return (
    <CrmDialog open={open} title="Thêm công việc" icon={ListTodo} onClose={onClose} busy={busy}>
      <form onSubmit={handleSubmit}>
        <p className="cv-dialog-context">{taskContextLine(current.type, current.label)}</p>
        <label>
          Nội dung công việc
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            maxLength={2000}
            required
            disabled={busy}
            rows={4}
          />
        </label>
        <label>
          Hạn làm việc
          <span className="cv-due-row">
            <input
              type="date"
              value={dueOn}
              onChange={(e) => setDueOn(e.target.value)}
              required
              disabled={busy}
            />
            <button
              type="button"
              className="crm-btn"
              disabled={busy}
              onClick={() => setDueOn(ymdInVietnam(0))}
            >
              Hôm nay
            </button>
          </span>
        </label>
        {error ? <p className="crm-form-error">{error}</p> : null}
        <div className="crm-dialog-actions">
          <button type="button" className="crm-btn" disabled={busy} onClick={onClose}>
            Huỷ
          </button>
          <button type="submit" className="crm-btn primary" disabled={busy}>
            {busy ? 'Đang lưu…' : 'Lưu'}
          </button>
        </div>
      </form>
    </CrmDialog>
  );
}
