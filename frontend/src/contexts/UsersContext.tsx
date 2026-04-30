import { createContext, useCallback, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import * as usersApi from '../api/users';
import { useAuth } from '../hooks/useAuth';
import type { UserSummary } from '../api/types';

export interface UsersContextValue {
  users: UserSummary[];
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  lookup(id: string | undefined | null): UserSummary | undefined;
  displayName(id: string | undefined | null, fallback?: string): string;
}

// eslint-disable-next-line react-refresh/only-export-components
export const UsersContext = createContext<UsersContextValue | null>(null);

export function UsersProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setUsers([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const data = await usersApi.listUsers();
      setUsers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load users');
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const value = useMemo<UsersContextValue>(() => {
    const byId = new Map(users.map(u => [u.id, u] as const));
    return {
      users,
      loading,
      error,
      refresh,
      lookup: id => (id ? byId.get(id) : undefined),
      displayName: (id, fallback = 'Unassigned') => {
        if (!id) return fallback;
        return byId.get(id)?.name ?? id;
      },
    };
  }, [users, loading, error, refresh]);

  return <UsersContext.Provider value={value}>{children}</UsersContext.Provider>;
}
