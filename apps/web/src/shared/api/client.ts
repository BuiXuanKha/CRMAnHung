const API_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:5050/api/v1';

const ACCESS_KEY = 'crmanhung_access_token';
const REFRESH_KEY = 'crmanhung_refresh_token';

function canUseStorage() {
  return typeof window !== 'undefined';
}

export function getAccessToken() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(ACCESS_KEY);
}

export function getRefreshToken() {
  if (!canUseStorage()) return null;
  return localStorage.getItem(REFRESH_KEY);
}

export function setTokens(accessToken: string, refreshToken: string) {
  if (!canUseStorage()) return;
  localStorage.setItem(ACCESS_KEY, accessToken);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearTokens() {
  if (!canUseStorage()) return;
  localStorage.removeItem(ACCESS_KEY);
  localStorage.removeItem(REFRESH_KEY);
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

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  const res = await fetch(`${API_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });

  if (!res.ok) {
    clearTokens();
    return false;
  }

  const data = (await res.json()) as {
    accessToken: string;
    refreshToken: string;
  };
  setTokens(data.accessToken, data.refreshToken);
  return true;
}

export async function apiFetch<T>(
  path: string,
  init: RequestInit = {},
  retry = true,
): Promise<T> {
  const headers = new Headers(init.headers);
  const isFormData = typeof FormData !== 'undefined' && init.body instanceof FormData;
  if (!isFormData && !headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const accessToken = getAccessToken();
  if (accessToken) {
    headers.set('Authorization', `Bearer ${accessToken}`);
  }

  const res = await fetch(`${API_URL}${path}`, {
    ...init,
    headers,
  });

  if (res.status === 401 && retry) {
    refreshPromise ??= tryRefresh().finally(() => {
      refreshPromise = null;
    });
    const refreshed = await refreshPromise;
    if (refreshed) {
      return apiFetch<T>(path, init, false);
    }
  }

  if (!res.ok) {
    throw await parseError(res);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  return (await res.json()) as T;
}
