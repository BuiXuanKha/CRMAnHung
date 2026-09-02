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
  return recordPublicPageView(shareCode);
}

export async function recordPublicPageView(
  shareCode?: string,
): Promise<PublicSharePageViewResponse | null> {
  const code = shareCode?.trim() ?? '';
  try {
    return await apiFetch<PublicSharePageViewResponse>('/public/page-views', {
      method: 'POST',
      body: JSON.stringify(code ? { shareCode: code } : {}),
    });
  } catch {
    return null;
  }
}

export async function listShareEmployeeStats(): Promise<ShareEmployeeStatsResponse> {
  return apiFetch<ShareEmployeeStatsResponse>('/admin/lot-shares/employee-stats');
}
