/** Bật UI mock khi chưa có / chưa nối API thật. */
export function isMockMode(): boolean {
  return import.meta.env.VITE_USE_MOCK === 'true';
}
