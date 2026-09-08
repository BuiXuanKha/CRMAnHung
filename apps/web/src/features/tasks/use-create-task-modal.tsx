'use client';

import { useRef, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import type { CreateWorkTaskInput } from '@crmanhung/shared';
import { createWorkTask } from './api';
import { CreateTaskDialog, type TaskCreateTarget } from './create-task-dialog';

export function useCreateTaskModal(onSaved?: () => void) {
  const qc = useQueryClient();
  const onSavedRef = useRef(onSaved);
  onSavedRef.current = onSaved;
  const [open, setOpen] = useState(false);
  const [target, setTarget] = useState<TaskCreateTarget | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mut = useMutation({
    mutationFn: createWorkTask,
    onSuccess: async () => {
      await qc.invalidateQueries({ queryKey: ['tasks'] });
      setOpen(false);
      setTarget(null);
      setError(null);
      onSavedRef.current?.();
    },
    onError: (err) => {
      setError(err instanceof Error ? err.message : 'Không lưu được công việc.');
    },
  });

  /** Gắn nguồn (menu Thao tác trên 4 list). */
  function openTaskModal(next: TaskCreateTarget) {
    setError(null);
    setTarget(next);
    setOpen(true);
  }

  /** Ghi chú cá nhân (FAB /cong-viec) — không gắn nguồn. */
  function openStandaloneTaskModal() {
    setError(null);
    setTarget(null);
    setOpen(true);
  }

  function submit(input: CreateWorkTaskInput) {
    setError(null);
    mut.mutate(input);
  }

  const dialog = (
    <CreateTaskDialog
      open={open}
      target={target}
      busy={mut.isPending}
      error={error}
      onClose={() => {
        if (!mut.isPending) {
          setOpen(false);
          setTarget(null);
          setError(null);
        }
      }}
      onSubmit={submit}
    />
  );

  return { openTaskModal, openStandaloneTaskModal, dialog };
}
