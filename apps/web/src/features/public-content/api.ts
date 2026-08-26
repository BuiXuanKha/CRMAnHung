import type { PublicWebDashboard, PublicWebLotRow, PublicWebPostRow } from '@crmanhung/shared';
import { MOCK_PUBLIC_WEB_DASHBOARD } from './mock-data';

/** Chưa có API — mock dashboard admin đăng web. */
export async function getPublicWebDashboard(): Promise<PublicWebDashboard> {
  return MOCK_PUBLIC_WEB_DASHBOARD;
}

export async function listPublicWebLots(): Promise<PublicWebLotRow[]> {
  return MOCK_PUBLIC_WEB_DASHBOARD.recentLots;
}

export async function listPublicWebPosts(): Promise<PublicWebPostRow[]> {
  return MOCK_PUBLIC_WEB_DASHBOARD.recentPosts;
}
