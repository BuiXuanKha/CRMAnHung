import {
  PublicPostStatus,
  type PublicWebDashboard,
  type PublicWebLotRow,
  type PublicWebPostRow,
} from '@crmanhung/shared';

/** Admin dashboard totals — CMS posts; lot counters stay 0 (compose lives on /lo-dat). */
export function buildPublicWebDashboard(
  lots: PublicWebLotRow[],
  posts: PublicWebPostRow[],
): PublicWebDashboard {
  return {
    publishedLotCount: 0,
    pendingLotCount: 0,
    publishedPostCount: posts.filter((row) => row.status === PublicPostStatus.PUBLISHED).length,
    draftPostCount: posts.filter((row) => row.status === PublicPostStatus.DRAFT).length,
    recentLots: lots.slice(0, 8),
    recentPosts: posts.slice(0, 8),
  };
}
