import { cookies } from 'next/headers';
import {
  PUBLIC_SHARE_COOKIE,
  pickShareCode,
  type LotShareContact,
  type PublicLotShareResolve,
} from '@crmanhung/shared';
import { resolvePublicLotShare } from './api';

export type ShareAttribution = {
  code: string;
  resolved: PublicLotShareResolve;
  fromQuery: boolean;
};

export async function getShareAttribution(
  shareFromQuery?: string | null,
): Promise<ShareAttribution | null> {
  const jar = await cookies();
  const fromCookie = jar.get(PUBLIC_SHARE_COOKIE)?.value ?? '';
  const fromQuery = shareFromQuery ?? '';
  const code = pickShareCode(fromQuery, fromCookie);
  if (!code) return null;
  const resolved = await resolvePublicLotShare(code);
  if (!resolved) return null;
  return {
    code: resolved.shareCode,
    resolved,
    fromQuery: Boolean(pickShareCode(fromQuery, '')),
  };
}

export function shareContactFrom(
  attribution: ShareAttribution | null,
): LotShareContact | null {
  return attribution?.resolved.employee ?? null;
}
