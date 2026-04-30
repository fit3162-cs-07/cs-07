import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// vitest's jsdom env supplies an empty plain object for localStorage / sessionStorage,
// so getItem / setItem / clear are all undefined. Install a minimal in-memory shim
// so AuthContext + tokenStorage can round-trip values during tests.
function installMemoryStorage(name: 'localStorage' | 'sessionStorage') {
  const store = new Map<string, string>();
  const shim: Storage = {
    get length() {
      return store.size;
    },
    clear() {
      store.clear();
    },
    getItem(key: string) {
      return store.has(key) ? store.get(key)! : null;
    },
    key(index: number) {
      return Array.from(store.keys())[index] ?? null;
    },
    removeItem(key: string) {
      store.delete(key);
    },
    setItem(key: string, value: string) {
      store.set(key, String(value));
    },
  };
  Object.defineProperty(globalThis, name, { value: shim, configurable: true });
  Object.defineProperty(window, name, { value: shim, configurable: true });
}

installMemoryStorage('localStorage');
installMemoryStorage('sessionStorage');

afterEach(() => {
  cleanup();
  localStorage.clear();
  sessionStorage.clear();
});
