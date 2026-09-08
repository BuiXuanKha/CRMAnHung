import {
  createWorkTaskSchema,
  type CreateWorkTaskInput,
  type WorkTask,
  type WorkTaskList,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

export async function listWorkTasks(): Promise<WorkTaskList> {
  return apiFetch<WorkTaskList>('/tasks');
}

export async function createWorkTask(input: CreateWorkTaskInput): Promise<WorkTask> {
  const parsed = createWorkTaskSchema.safeParse(input);
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? 'Không lưu được công việc.');
  }
  return apiFetch<WorkTask>('/tasks', {
    method: 'POST',
    body: JSON.stringify(parsed.data),
  });
}
