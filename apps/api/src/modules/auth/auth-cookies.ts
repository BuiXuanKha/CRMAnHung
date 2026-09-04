import type { CookieOptions, Request, Response } from 'express';
import type { ConfigService } from '@nestjs/config';

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

function cookieOptions(config: ConfigService, maxAgeMs: number): CookieOptions {
  const isProd = (config.get<string>('NODE_ENV') ?? process.env.NODE_ENV) === 'production';
  return {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    // Only attached to auth routes — keeps CSRF surface small (access stays Bearer).
    path: '/api/v1/auth',
    maxAge: Math.max(1000, maxAgeMs),
  };
}

export function setRefreshCookie(
  res: Response,
  refreshToken: string,
  config: ConfigService,
) {
  const maxAgeMs = refreshTtlMs(config);
  res.cookie(REFRESH_COOKIE_NAME, refreshToken, cookieOptions(config, maxAgeMs));
}

export function clearRefreshCookie(res: Response, config: ConfigService) {
  res.clearCookie(REFRESH_COOKIE_NAME, {
    ...cookieOptions(config, 0),
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
