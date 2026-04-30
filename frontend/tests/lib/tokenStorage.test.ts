import { describe, expect, it, beforeEach } from 'vitest';
import {
  clearAllAuth,
  persistentTokenStorage,
  readPreferredAuth,
  sessionOnlyTokenStorage,
  type StoredAuth,
} from '../../src/lib/tokenStorage';

const SAMPLE: StoredAuth = {
  user: { id: 'u-1', email: 'a@b.com', name: 'Sample User', role: 'MEMBER' },
  token: 'jwt-xyz',
};

describe('tokenStorage', () => {
  beforeEach(() => {
    localStorage.clear();
    sessionStorage.clear();
  });

  it('persistent storage round-trips a value through localStorage', () => {
    persistentTokenStorage.write(SAMPLE);
    expect(localStorage.getItem('mctm.auth.v1')).toContain('jwt-xyz');
    expect(persistentTokenStorage.read()).toEqual(SAMPLE);
  });

  it('session storage round-trips a value through sessionStorage', () => {
    sessionOnlyTokenStorage.write(SAMPLE);
    expect(sessionStorage.getItem('mctm.auth.v1')).toContain('jwt-xyz');
    expect(sessionOnlyTokenStorage.read()).toEqual(SAMPLE);
  });

  it('clear() removes only the targeted backend', () => {
    persistentTokenStorage.write(SAMPLE);
    sessionOnlyTokenStorage.write(SAMPLE);
    persistentTokenStorage.clear();
    expect(persistentTokenStorage.read()).toBeNull();
    expect(sessionOnlyTokenStorage.read()).toEqual(SAMPLE);
  });

  it('clearAllAuth() wipes both backends', () => {
    persistentTokenStorage.write(SAMPLE);
    sessionOnlyTokenStorage.write(SAMPLE);
    clearAllAuth();
    expect(persistentTokenStorage.read()).toBeNull();
    expect(sessionOnlyTokenStorage.read()).toBeNull();
  });

  it('readPreferredAuth returns the persistent entry when present', () => {
    persistentTokenStorage.write(SAMPLE);
    const result = readPreferredAuth();
    expect(result.auth).toEqual(SAMPLE);
    expect(result.storage).toBe(persistentTokenStorage);
  });

  it('readPreferredAuth falls back to the session entry when persistent is empty', () => {
    sessionOnlyTokenStorage.write(SAMPLE);
    const result = readPreferredAuth();
    expect(result.auth).toEqual(SAMPLE);
    expect(result.storage).toBe(sessionOnlyTokenStorage);
  });

  it('readPreferredAuth returns null + session storage default when nothing is stored', () => {
    const result = readPreferredAuth();
    expect(result.auth).toBeNull();
    expect(result.storage).toBe(sessionOnlyTokenStorage);
  });

  it('reading a corrupted value returns null instead of throwing', () => {
    localStorage.setItem('mctm.auth.v1', '{not valid json');
    expect(persistentTokenStorage.read()).toBeNull();
  });
});
