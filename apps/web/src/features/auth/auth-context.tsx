'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { type AuthUser, type LoginResponse } from '@crmanhung/shared';
import {
  apiFetch,
  clearTokens,
  setTokens,
  tryRefresh,
} from '@/shared/api/client';
import { clearAllListStates } from '@/shared/list-state';

const SESSION_USER_KEY = 'crmanhung_session_user';
const LEGACY_MOCK_USER_KEY = 'crmanhung_mock_user';

export function peekSessionUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = sessionStorage.getItem(SESSION_USER_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AuthUser;
    if (!parsed?.id || !parsed.fullName) return null;
    return parsed;
  } catch {
    return null;
  }
}

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<AuthUser>;
  logout: () => Promise<void>;
  reloadMe: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function writeSessionUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  sessionStorage.removeItem(LEGACY_MOCK_USER_KEY);
  if (!user) {
    sessionStorage.removeItem(SESSION_USER_KEY);
    return;
  }
  sessionStorage.setItem(SESSION_USER_KEY, JSON.stringify(user));
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      try {
        // Cold boot: access is memory-only; restore via HttpOnly refresh cookie.
        const refreshed = await tryRefresh();
        if (!refreshed) {
          writeSessionUser(null);
          setUser(null);
          return;
        }
        const me = await apiFetch<AuthUser>('/auth/me');
        writeSessionUser(me);
        setUser(me);
      } catch {
        clearTokens();
        writeSessionUser(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    // Refresh is Set-Cookie HttpOnly; keep access in memory only.
    setTokens(data.accessToken, data.refreshToken);
    writeSessionUser(data.user);
    setUser(data.user);
    return data.user;
  }, []);

  const reloadMe = useCallback(async () => {
    const me = await apiFetch<AuthUser>('/auth/me');
    writeSessionUser(me);
    setUser(me);
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({}),
      });
    } catch {
      // ignore network errors on logout
    } finally {
      writeSessionUser(null);
      clearTokens();
      clearAllListStates();
      setUser(null);
    }
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, logout, reloadMe }),
    [user, loading, login, logout, reloadMe],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
