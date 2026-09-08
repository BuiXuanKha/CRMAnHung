/**
 * Personal work reminders (Công việc).
 *
 * Shell only (2026-09-08): owner will specify create/list fields later.
 * Do not add CRUD Zod until then — do not invent title / dueDate / status.
 */
export const TASKS_WEB_PATH = '/cong-viec' as const;

export function isTasksPath(pathname: string): boolean {
  return pathname === TASKS_WEB_PATH || pathname.startsWith(`${TASKS_WEB_PATH}/`);
}
