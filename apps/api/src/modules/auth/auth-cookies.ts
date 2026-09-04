import type { CookieOptions, Request, Response } from 'express';
import type { ConfigService } from '@nestjs/config';
import {
  WEB_ROLE_COOKIE,
  normalizeWebCrmRole,
} from '@crmanhung/shared';

/** HttpOnly refresh cookie for browser CRM (BUG-007). Extension keeps body token. */
export const REFRESH_COOKIE_NAME = 'crmanhung_refresh';

function refreshTtlMs(config: ConfigService): number {
  const expiresIn = config.get<string>('JWT_REFRESH_EXPIRES_IN') ?? '30d';
  const match = /^(\d+)([smhd])$/.exec(expiresIn.trim());
  if (!match) return 30 * 24 * 60 * 60 * 1000;
  const value = Number(match[1]);
  const unit = match[2];
  const mult =
    unit === 's'
      ? 1000
      : unit === 'm'
        ? 60_000
        : unit === 'h'
          ? 3_600_000
          : 86_400_000;
  return value * mult;
}

function isProd(config: ConfigService): boolean {
  return (config.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';
}

function refreshCookieOptions(config: ConfigService, maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd(config),
    sameSite: 'lax',
    // Only attached to auth routes — keeps CSRF surface small (access stays Bearer).
    path: '/api/v1/auth',
    maxAge: Math.max(1000, maxAgeMs),
  };
}

/** Role hint for Next middleware (path `/`). Not a secret; API still authorizes. */
function webRoleCookieOptions(config: ConfigService, maxAgeMs: number): CookieOptions {
  return {
    httpOnly: true,
    secure: isProd(config),
    sameSite: 'lax',
    path: '/',
    maxAge: Math.max(1000, maxAgeMs),
  };
}

export function setRefreshCookie(
  res: Response,
  refreshToken: string,
  config: ConfigService,
) {
  const maxAgeMs = refreshTtlMs(config);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, refreshCookieOptions(config, maxAgeMs));
}

export function clearRefreshCookie(res: Response, config: ConfigService) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...refreshCookieOptions(config, 0),
    maxAge: 0,
  });
}

export function setWebRoleCookie(res: Response, role: string, config: ConfigService) {
  const normalized = normalizeWebCrmRole(role);
  if (!normalized) return;
  const maxAgeMs = refreshTtlMs(config);
  res.cookie(WEB_ROLE_COOKIE, normalized, webRoleCookieOptions(config, maxAgeMs));
}

export function clearWebRoleCookie(res: Response, config: ConfigService) {
  res.clearCookie(WEB_ROLE_COOKIE, {
    ...webRoleCookieOptions(config, 0),
    maxAge: 0,
  });
}

export function readRefreshCookie(req: Request): string | undefined {
  const raw = req.cookies?.[REFRESH_COOKIE_NAME];
  return typeof raw === 'string' && raw.trim() ? raw.trim() : undefined;
}

export function resolveRefreshToken(
  req: Request,
  bodyToken: string | undefined,
): string | undefined {
  const fromBody = bodyToken?.trim();
  if (fromBody) return fromBody;
  return readRefreshCookie(req);
}
