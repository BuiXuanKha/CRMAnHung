import type {
  LotShareLinkResponse,
  PublicLotShareResolve,
  PublicLotShareVisitResponse,
  PublicSharePageViewResponse,
  ShareEmployeeStatsResponse,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

export async function createListingShareLinkBySlug(
  slug: string,
): Promise<LotShareLinkResponse> {
  return apiFetch<LotShareLinkResponse>(
    `/public/listings/${encodeURIComponent(slug)}/share-link`,
    { method: 'POST' },
  );
}

export async function createLodatShareLink(lodatId: string): Promise<LotShareLinkResponse> {
  return apiFetch<LotShareLinkResponse>(`/lodats/${encodeURIComponent(lodatId)}/share-link`, {
    method: 'POST',
  });
}

export async function resolvePublicLotShare(
  shareCode: string,
): Promise<PublicLotShareResolve | null> {
  try {
    return await apiFetch<PublicLotShareResolve>(
      `/public/lot-shares/${encodeURIComponent(shareCode.trim())}`,
    );
  } catch {
    return null;
  }
}

export async function recordPublicLotShareVisit(
  shareCode: string,
): Promise<PublicLotShareVisitResponse | null> {
  try {
    return await apiFetch<PublicLotShareVisitResponse>(
      `/public/lot-shares/${encodeURIComponent(shareCode.trim())}/visit`,
      { method: 'POST' },
    );
  } catch {
    return null;
  }
}

export async function recordSharePageView(
  shareCode: string,
): Promise<PublicSharePageViewResponse | null> {
  try {
    return await apiFetch<PublicSharePageViewResponse>(
      `/public/lot-shares/${encodeURIComponent(shareCode.trim())}/page-view`,
      { method: 'POST' },
    );
  } catch {
    return null;
  }
}

export async function listShareEmployeeStats(): Promise<ShareEmployeeStatsResponse> {
  return apiFetch<ShareEmployeeStatsResponse>('/admin/lot-shares/employee-stats');
}
