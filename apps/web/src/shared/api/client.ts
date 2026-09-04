const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050/api/v1';

/** Staging sets `NEXT_PUBLIC_API_URL=/api/v1` (nginx). Browsers resolve it; Node `fetch` needs an origin. */
function resolveApiUrl(path: string): string {
  const base = API_URL.replace(/\/$/, '');
  const suffix = path.startsWith('/') ? path : `/${path}`;
  const joined = `${base}${suffix}`;
  if (/^https?:\/\//i.test(joined)) return joined;
  const relative = joined.startsWith('/') ? joined : `/${joined}`;
  if (typeof window !== 'undefined') return relative;
  const origin = process.env.INTERNAL_API_ORIGIN ?? 'http://127.0.0.1:5050';
  return new URL(relative, origin).href;
}

/** Legacy keys — cleared on boot so XSS cannot read old persisted tokens (BUG-007). */
const LEGACY_ACCESS_KEY = 'crmanhung_access_token';
const LEGACY_REFRESH_KEY = 'crmanhung_refresh_token';

/** In-memory access JWT only (not localStorage). Refresh lives in HttpOnly cookie. */
let memoryAccessToken: string | null = null;

function canUseStorage() {
  return typeof window !== 'undefined';
}

function clearLegacyTokenStorage() {
  if (!canUseStorage()) return;
  try {
    localStorage.removeItem(LEGACY_ACCESS_KEY);
    localStorage.removeItem(LEGACY_REFRESH_KEY);
  } catch {
    // ignore
  }
}

export function getAccessToken() {
  return memoryAccessToken;
}

export function setAccessToken(accessToken: string | null) {
  memoryAccessToken = accessToken?.trim() ? accessToken : null;
}

/** @deprecated Refresh is HttpOnly cookie; kept as no-op clear for call sites. */
export function getRefreshToken() {
  return null;
}

export function setTokens(accessToken: string, _refreshToken?: string) {
  setAccessToken(accessToken);
  clearLegacyTokenStorage();
}

export function clearTokens() {
  memoryAccessToken = null;
  clearLegacyTokenStorage();
}

type ApiErrorBody = {
  message?: string | string[];
  statusCode?: number;
  code?: string;
  existing?: unknown;
  mergeAllowed?: boolean;
  phone?: string;
  source?: unknown;
};

export class ApiError extends Error {
  status: number;
  code?: string;
  existing?: unknown;
  mergeAllowed?: boolean;
  phone?: string;
  source?: unknown;

  constructor(
    status: number,
    message: string,
    extra?: Pick<ApiErrorBody, 'code' | 'existing' | 'mergeAllowed' | 'phone' | 'source'>,
  ) {
    super(message);
    this.status = status;
    this.code = extra?.code;
    this.existing = extra?.existing;
    this.mergeAllowed = extra?.mergeAllowed;
    this.phone = extra?.phone;
    this.source = extra?.source;
  }
}

async function parseError(res: Response): Promise<ApiError> {
  let message = res.statusText || 'Request failed';
  let extra: Pick<ApiErrorBody, 'code' | 'existing' | 'mergeAllowed' | 'phone' | 'source'> = {};
  try {
    const body = (await res.json()) as ApiErrorBody;
    if (Array.isArray(body.message)) {
      message = body.message.join(', ');
    } else if (typeof body.message === 'string') {
      message = body.message;
    }
    extra = {
      code: body.code,
      existing: body.existing,
      mergeAllowed: body.mergeAllowed,
      phone: body.phone,
      source: body.source,
    };
  } catch {
    // ignore
  }
  return new ApiError(res.status, message, extra);
}

let refreshPromise: Promise<boolean> | null = null;

/** Exchange HttpOnly refresh cookie for a new access token (memory). */
export async function tryRefresh(): Promise<boolean> {
  const res = await fetch(resolveApiUrl('/auth/refresh'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify({}),
  });

  if (!res.ok) {
    clearTokens();
    return false;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken?: string;
  };
  setAccessToken(data.accessToken);
  return true;
}

async function apiRequest(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<Response> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(resolveApiUrl(path), {
    ...init,
    headers,
    credentials: 'include',
  });

  if (res.status === 401 && retry) {
    refreshPromise ??= tryRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiRequest(path, init, false);
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  return res;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await apiRequest(path, init);
  if (res.status === 204) {
    return undefined as T;
  }
  return (await res.json()) as T;
}

export async function apiFetchBlob(path: string, init: RequestInit = {}): Promise<Blob> {
  const res = await apiRequest(path, init);
  return res.blob();
}

// Clear any pre-BUG-007 persisted tokens as soon as this module loads in the browser.
clearLegacyTokenStorage();
