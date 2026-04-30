import { apiClient } from './client';
import type { LoginResponse, RegisterResponse } from './types';

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { data } = await apiClient.post<LoginResponse>('/auth/login', { email, password });
  return data;
}

export interface RegisterInput {
  email: string;
  name: string;
  password: string;
}

export async function register(input: RegisterInput): Promise<RegisterResponse> {
  const { data } = await apiClient.post<RegisterResponse>('/auth/register', input);
  return data;
}

// TODO(ethan): wire a real refresh-token endpoint when backend exposes one.
export async function refresh(): Promise<LoginResponse | null> {
  return null;
}
