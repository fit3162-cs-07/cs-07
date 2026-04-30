import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { setAuthToken } from '../api/client';
import * as authApi from '../api/auth';
import type { User } from '../api/types';
import {
  clearAllAuth,
  persistentTokenStorage,
  readPreferredAuth,
  sessionOnlyTokenStorage,
  type StoredAuth,
  type TokenStorage,
} from '../lib/tokenStorage';

export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login(email: string, password: string, remember?: boolean): Promise<void>;
  register(input: authApi.RegisterInput, remember?: boolean): Promise<void>;
  logout(): void;
  updateUser(user: User): void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const initial = readPreferredAuth();
  const [stored, setStored] = useState<StoredAuth | null>(initial.auth);
  const [storage, setStorage] = useState<TokenStorage>(initial.storage);

  useEffect(() => {
    setAuthToken(stored?.token ?? null);
  }, [stored]);

  const persist = useCallback((value: StoredAuth, remember: boolean) => {
    const target = remember ? persistentTokenStorage : sessionOnlyTokenStorage;
    // Whichever store was in use before, the other must not retain the token.
    clearAllAuth();
    target.write(value);
    setStorage(target);
    setStored(value);
  }, []);

  const login = useCallback(
    async (email: string, password: string, remember = false) => {
      const result = await authApi.login(email, password);
      persist(result, remember);
    },
    [persist],
  );

  const register = useCallback(
    async (input: authApi.RegisterInput, remember = false) => {
      await authApi.register(input);
      const result = await authApi.login(input.email, input.password);
      persist(result, remember);
    },
    [persist],
  );

  const logout = useCallback(() => {
    clearAllAuth();
    setStored(null);
  }, []);

  const updateUser = useCallback(
    (user: User) => {
      setStored(prev => {
        if (!prev) return prev;
        const next = { ...prev, user };
        storage.write(next);
        return next;
      });
    },
    [storage],
  );

  const value = useMemo<AuthContextValue>(
    () => ({
      user: stored?.user ?? null,
      token: stored?.token ?? null,
      isAuthenticated: stored !== null,
      isAdmin: stored?.user.role === 'ADMIN',
      login,
      register,
      logout,
      updateUser,
    }),
    [stored, login, register, logout, updateUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
