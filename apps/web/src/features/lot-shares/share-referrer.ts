import { cookies, headers } from 'next/headers';
import {
  PUBLIC_SHARE_COOKIE,
  PUBLIC_SHARE_REQUEST_HEADER,
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
  const hdrs = await headers();
  const fromCookie = jar.get(PUBLIC_SHARE_COOKIE)?.value ?? '';
  const fromHeader = hdrs.get(PUBLIC_SHARE_REQUEST_HEADER) ?? '';
  const fromQuery = shareFromQuery ?? '';
  const code = pickShareCode(fromQuery, fromHeader) || pickShareCode('', fromCookie);
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
