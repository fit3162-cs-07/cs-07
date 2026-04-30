import type { User } from '../api/types';

export interface StoredAuth {
  user: User;
  token: string;
}

export interface TokenStorage {
  read(): StoredAuth | null;
  write(value: StoredAuth): void;
  clear(): void;
}

const STORAGE_KEY = 'mctm.auth.v1';

function makeStorage(backend: Storage): TokenStorage {
  return {
    read() {
      try {
        const raw = backend.getItem(STORAGE_KEY);
        if (!raw) return null;
        return JSON.parse(raw) as StoredAuth;
      } catch {
        return null;
      }
    },
    write(value) {
      try {
        backend.setItem(STORAGE_KEY, JSON.stringify(value));
      } catch {
        // ignore quota / disabled-storage errors — login still works in-memory
      }
    },
    clear() {
      try {
        backend.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
    },
  };
}

export const persistentTokenStorage = makeStorage(
  typeof localStorage !== 'undefined' ? localStorage : ({} as Storage),
);

export const sessionOnlyTokenStorage = makeStorage(
  typeof sessionStorage !== 'undefined' ? sessionStorage : ({} as Storage),
);

/**
 * Reads from persistent storage first (the "Remember me" choice from a prior
 * session) and falls back to the session-only store. Used on app boot.
 */
export function readPreferredAuth(): {
  auth: StoredAuth | null;
  storage: TokenStorage;
} {
  const persisted = persistentTokenStorage.read();
  if (persisted) return { auth: persisted, storage: persistentTokenStorage };
  const session = sessionOnlyTokenStorage.read();
  if (session) return { auth: session, storage: sessionOnlyTokenStorage };
  return { auth: null, storage: sessionOnlyTokenStorage };
}

export function clearAllAuth(): void {
  persistentTokenStorage.clear();
  sessionOnlyTokenStorage.clear();
}
