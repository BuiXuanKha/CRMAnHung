import type { QueryClient } from '@tanstack/react-query';

export const publicWebKeys = {
  dashboard: ['public-web-dashboard'] as const,
  lots: ['public-web-lots'] as const,
  posts: ['public-web-posts'] as const,
};

export function invalidatePublicWebQueries(qc: QueryClient): Promise<unknown[]> {
  return Promise.all([
    qc.invalidateQueries({ queryKey: publicWebKeys.dashboard }),
    qc.invalidateQueries({ queryKey: publicWebKeys.lots }),
    qc.invalidateQueries({ queryKey: publicWebKeys.posts }),
  ]);
}
