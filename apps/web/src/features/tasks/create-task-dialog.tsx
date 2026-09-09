'use client';

import { ListTodo } from 'lucide-react';
import { FormEvent, useEffect, useState } from 'react';
import {
  TaskTargetType,
  taskContextLine,
  ymdInVietnam,
  type CreateWorkTaskInput,
  type UpdateWorkTaskInput,
  type WorkTask,
} from '@crmanhung/shared';
import { CrmDialog } from '@/shared/ui/dialog';
import './create-task-dialog.css';

export type TaskCreateTarget = {
  type: TaskTargetType;
  id: string;
  label: string;
};

type CreateProps = {
  mode?: 'create';
  open: boolean;
  /** null = ghi chú cá nhân (FAB /cong-viec). */
  target: TaskCreateTarget | null;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: CreateWorkTaskInput) => void;
};

type EditProps = {
  mode: 'edit';
  open: boolean;
  item: WorkTask;
  busy?: boolean;
  error?: string | null;
  onClose: () => void;
  onSubmit: (input: UpdateWorkTaskInput) => void;
};

type Props = CreateProps | EditProps;

export function CreateTaskDialog(props: Props) {
  const { open, busy = false, error = null, onClose } = props;
  const isEdit = props.mode === 'edit';
  const editId = isEdit ? props.item.id : '';
  const editContent = isEdit ? props.item.content : '';
  const editDueOn = isEdit ? props.item.dueOn : '';
  const createTargetKey = !isEdit
    ? `${props.target?.type ?? 'NONE'}:${props.target?.id ?? ''}`
    : '';
  const [content, setContent] = useState('');
  const [dueOn, setDueOn] = useState(ymdInVietnam(1));

  useEffect(() => {
    if (!open) return;
    if (isEdit) {
      setContent(editContent);
      setDueOn(editDueOn);
      return;
    }
    setContent('');
    setDueOn(ymdInVietnam(1));
  }, [open, isEdit, editId, editContent, editDueOn, createTargetKey]);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (isEdit) {
      props.onSubmit({ content, dueOn });
      return;
    }
    const target = props.target;
    if (target) {
      props.onSubmit({
        content,
        dueOn,
        targetType: target.type,
        targetId: target.id,
      });
      return;
    }
    props.onSubmit({
      content,
      dueOn,
      targetType: TaskTargetType.NONE,
    });
  }

  const contextType = isEdit
    ? (props.item.targetType as TaskTargetType)
    : (props.target?.type ?? TaskTargetType.NONE);
  const contextLabel = isEdit ? props.item.targetLabel : (props.target?.label ?? '');

  return (
    <CrmDialog
      open={open}
      title={isEdit ? 'Sửa công việc' : 'Thêm công việc'}
      icon={ListTodo}
      onClose={onClose}
      busy={busy}
    >
      <form onSubmit={handleSubmit}>
        <p className="cv-dialog-context">{taskContextLine(contextType, contextLabel)}</p>
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
