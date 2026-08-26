import type { PublicWebDashboard } from '@crmanhung/shared';
import { MOCK_PUBLIC_WEB_DASHBOARD } from './mock-data';

/** Chưa có API — mock dashboard admin đăng web. */
export async function getPublicWebDashboard(): Promise<PublicWebDashboard> {
  return MOCK_PUBLIC_WEB_DASHBOARD;
}
