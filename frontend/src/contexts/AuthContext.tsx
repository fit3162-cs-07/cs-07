import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setAuthToken } from '../api/client';
import * as authApi from '../api/auth';
import type { User } from '../api/types';

const STORAGE_KEY = 'mctm.auth.v1';

interface StoredAuth {
  user: User;
  token: string;
}

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login(email: string, password: string): Promise<void>;
  register(input: authApi.RegisterInput): Promise<void>;
  logout(): void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

function readStoredAuth(): StoredAuth | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredAuth;
  } catch {
    return null;
  }
}

function writeStoredAuth(value: StoredAuth | null): void {
  if (value === null) {
    sessionStorage.removeItem(STORAGE_KEY);
  } else {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [stored, setStored] = useState<StoredAuth | null>(() => readStoredAuth());

  useEffect(() => {
    setAuthToken(stored?.token ?? null);
  }, [stored]);

  const login = useCallback(async (email: string, password: string) => {
    const result = await authApi.login(email, password);
    writeStoredAuth(result);
    setStored(result);
  }, []);

  const register = useCallback(async (input: authApi.RegisterInput) => {
    await authApi.register(input);
    const result = await authApi.login(input.email, input.password);
    writeStoredAuth(result);
    setStored(result);
  }, []);

  const logout = useCallback(() => {
    writeStoredAuth(null);
    setStored(null);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: stored?.user ?? null,
      token: stored?.token ?? null,
      isAuthenticated: stored !== null,
      isAdmin: stored?.user.role === 'ADMIN',
      login,
      register,
      logout,
    }),
    [stored, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
