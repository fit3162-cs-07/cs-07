import { apiClient } from './client';
import { ApiError } from './client';
import type { AuditEntry } from './types';

export async function listAudit(): Promise<AuditEntry[]> {
  try {
    const { data } = await apiClient.get<AuditEntry[]>('/audit');
    return data;
  } catch (err) {
    if (err instanceof ApiError && (err.status === 403 || err.status === 401)) {
      return [];
    }
    throw err;
  }
}
