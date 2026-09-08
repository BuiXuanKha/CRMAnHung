/**
 * Personal work reminders (Công việc).
 *
 * Create from list Thao tác (customer / lodat / transaction / title-service).
 * dueOn = calendar date YYYY-MM-DD (Vietnam). Default UI = tomorrow.
 */
import { z } from 'zod';
import { TaskTargetType } from './enums.js';

export const TASKS_WEB_PATH = '/cong-viec' as const;

export function isTasksPath(pathname: string): boolean {
  return pathname === TASKS_WEB_PATH || pathname.startsWith(`${TASKS_WEB_PATH}/`);
}

const YMD = /^\d{4}-\d{2}-\d{2}$/;

/** Vietnam calendar YYYY-MM-DD. offsetDays: 0 = today, 1 = tomorrow. */
export function ymdInVietnam(offsetDays = 0): string {
  const shifted = new Date(Date.now() + 7 * 60 * 60 * 1000);
  shifted.setUTCDate(shifted.getUTCDate() + offsetDays);
  const y = shifted.getUTCFullYear();
  const m = String(shifted.getUTCMonth() + 1).padStart(2, '0');
  const d = String(shifted.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function formatTaskDueOn(ymd: string): string {
  const m = ymd.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return ymd;
  return `${Number(m[3])}/${Number(m[2])}/${m[1]}`;
}

export function daysUntilDueOn(dueOn: string, todayYmd = ymdInVietnam(0)): number {
  const due = Date.parse(`${dueOn}T00:00:00.000Z`);
  const today = Date.parse(`${todayYmd}T00:00:00.000Z`);
  if (!Number.isFinite(due) || !Number.isFinite(today)) return 0;
  return Math.round((due - today) / 86_400_000);
}

export type TaskDueCountdown = {
  days: number;
  label: string;
  tone: 'green' | 'amber' | 'red';
};

/** Hôm nay · N ngày · Quá hạn N ngày */
export function taskDueCountdown(dueOn: string, todayYmd = ymdInVietnam(0)): TaskDueCountdown {
  const days = daysUntilDueOn(dueOn, todayYmd);
  if (days === 0) return { days, label: 'Hôm nay', tone: 'amber' };
  if (days > 0) return { days, label: `${days} ngày`, tone: 'green' };
  return { days, label: `Quá hạn ${Math.abs(days)} ngày`, tone: 'red' };
}

export function taskContextLine(type: TaskTargetType, label: string): string {
  const name = label.trim() || '—';
  switch (type) {
    case TaskTargetType.CUSTOMER:
      return `Công việc này cho Khách hàng ${name}`;
    case TaskTargetType.LODAT:
      return `Công việc này cho Lô đất ${name}`;
    case TaskTargetType.TITLE_SERVICE:
      return `Công việc này cho dịch vụ sổ đỏ của khách ${name}`;
    case TaskTargetType.TRANSACTION:
      return `Công việc này cho Giao dịch ${name}`;
    default:
      return name;
  }
}

export const workTaskSchema = z.object({
  id: z.string(),
  content: z.string(),
  dueOn: z.string().regex(YMD),
  targetType: z.nativeEnum(TaskTargetType),
  targetId: z.string(),
  targetLabel: z.string(),
  isPinned: z.boolean(),
  pinnedAt: z.string().nullable().optional(),
  completedAt: z.string().nullable().optional(),
  createdAt: z.string(),
});

export type WorkTask = z.infer<typeof workTaskSchema>;

export const workTaskListSchema = z.object({
  items: z.array(workTaskSchema),
  total: z.number().int().nonnegative(),
});

export type WorkTaskList = z.infer<typeof workTaskListSchema>;

export const createWorkTaskSchema = z.object({
  content: z.string().trim().min(1, 'Nhập nội dung công việc.').max(2000),
  dueOn: z.string().regex(YMD, 'Chọn hạn làm việc.'),
  targetType: z.nativeEnum(TaskTargetType),
  targetId: z.string().min(1),
});

export type CreateWorkTaskInput = z.infer<typeof createWorkTaskSchema>;

export const pinWorkTaskSchema = z.object({
  pinned: z.boolean(),
});

export type PinWorkTaskInput = z.infer<typeof pinWorkTaskSchema>;
