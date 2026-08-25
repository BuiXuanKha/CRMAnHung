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
  ApiError,
  clearTokens,
  getAccessToken,
  getRefreshToken,
  setTokens,
} from '@/shared/api/client';
import { isMockAuth } from '@/shared/api/mode';
import { MOCK_ADMIN, MOCK_STAFF } from '@/features/customers/mock-data';
import { clearAllListStates } from '@/shared/list-state';

const SESSION_USER_KEY = 'crmanhung_session_user';
const MOCK_USER_KEY = 'crmanhung_mock_user';

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function readSessionUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  const raw =
    sessionStorage.getItem(SESSION_USER_KEY) ?? sessionStorage.getItem(MOCK_USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

function writeSessionUser(user: AuthUser | null) {
  if (typeof window === 'undefined') return;
  if (!user) {
    sessionStorage.removeItem(SESSION_USER_KEY);
    sessionStorage.removeItem(MOCK_USER_KEY);
    return;
  }
  const json = JSON.stringify(user);
  sessionStorage.setItem(SESSION_USER_KEY, json);
  sessionStorage.setItem(MOCK_USER_KEY, json);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const boot = async () => {
      if (isMockAuth()) {
        setUser(readSessionUser());
        setLoading(false);
        return;
      }

      if (!getAccessToken() && !getRefreshToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiFetch<AuthUser>('/auth/me');
        writeSessionUser(me);
        setUser(me);
      } catch {
        clearTokens();
        setUser(null);
      } finally {
        setLoading(false);
      }
    };
    void boot();
  }, []);

  const login = useCallback(async (username: string, password: string) => {
    if (isMockAuth()) {
      const u = username.trim().toLowerCase();
      let mock: AuthUser | null = null;
      if (u === 'admin' && password === 'admin123') mock = MOCK_ADMIN;
      if (u === 'staff' && password === 'staff123') mock = MOCK_STAFF;
      if (!mock) {
        throw new ApiError(401, 'Sai tài khoản hoặc mật khẩu (mock)');
      }
      writeSessionUser(mock);
      setTokens('mock-access', 'mock-refresh');
      setUser(mock);
      return;
    }

    const data = await apiFetch<LoginResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
    setTokens(data.accessToken, data.refreshToken);
    writeSessionUser(data.user);
    setUser(data.user);
  }, []);

  const logout = useCallback(async () => {
    if (isMockAuth()) {
    writeSessionUser(null);
    clearTokens();
    clearAllListStates();
    setUser(null);
    return;
    }

    const refreshToken = getRefreshToken();
    try {
      if (refreshToken) {
        await apiFetch('/auth/logout', {
          method: 'POST',
          body: JSON.stringify({ refreshToken }),
        });
      }
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
    () => ({ user, loading, login, logout }),
    [user, loading, login, logout],
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
