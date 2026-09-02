import type {
  LotShareLinkResponse,
  PublicLotShareResolve,
  PublicLotShareVisitResponse,
} from '@crmanhung/shared';
import { apiFetch } from '@/shared/api/client';

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
