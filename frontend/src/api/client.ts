import type { PaginationMeta } from './types';

const DEFAULT_BASE = 'http://localhost:3000/api/v1';
const BASE: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) ?? DEFAULT_BASE;

let authToken: string | null = null;

export function setAuthToken(token: string | null): void {
  authToken = token;
}

export function getAuthToken(): string | null {
  return authToken;
}

export class ApiError extends Error {
  readonly code: string;
  readonly status: number;

  constructor(message: string, code: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
  }
}

export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta;
}

interface SuccessEnvelope<T> {
  success: true;
  data: T;
  meta?: PaginationMeta;
}

interface ErrorEnvelope {
  success: false;
  error: { code: string; message: string };
}

async function request<T>(path: string, opts: RequestInit = {}): Promise<ApiResult<T>> {
  const headers = new Headers(opts.headers);
  if (opts.body !== undefined && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }
  if (authToken) {
    headers.set('Authorization', `Bearer ${authToken}`);
  }

  let res: Response;
  try {
    res = await fetch(`${BASE}${path}`, { ...opts, headers });
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Network request failed';
    throw new ApiError(msg, 'NETWORK_ERROR', 0);
  }

  if (res.status === 204) {
    return { data: null as T };
  }

  let body: unknown;
  try {
    body = await res.json();
  } catch {
    throw new ApiError('Invalid response from server', 'INVALID_RESPONSE', res.status);
  }

  if (!isEnvelope(body)) {
    throw new ApiError('Unexpected response shape', 'INVALID_RESPONSE', res.status);
  }

  if (body.success === false) {
    const err = (body as ErrorEnvelope).error;
    throw new ApiError(err.message, err.code, res.status);
  }

  const success = body as SuccessEnvelope<T>;
  return { data: success.data, meta: success.meta };
}

function isEnvelope(value: unknown): value is SuccessEnvelope<unknown> | ErrorEnvelope {
  return typeof value === 'object' && value !== null && 'success' in value;
}

export const apiClient = {
  get<T>(path: string): Promise<ApiResult<T>> {
    return request<T>(path);
  },
  post<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return request<T>(path, { method: 'POST', body: body !== undefined ? JSON.stringify(body) : undefined });
  },
  put<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return request<T>(path, { method: 'PUT', body: body !== undefined ? JSON.stringify(body) : undefined });
  },
  patch<T>(path: string, body?: unknown): Promise<ApiResult<T>> {
    return request<T>(path, { method: 'PATCH', body: body !== undefined ? JSON.stringify(body) : undefined });
  },
  delete<T = null>(path: string): Promise<ApiResult<T>> {
    return request<T>(path, { method: 'DELETE' });
  },
};
