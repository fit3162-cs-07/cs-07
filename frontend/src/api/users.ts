import { apiClient } from './client';
import type { User, UserSummary } from './types';

export async function listUsers(): Promise<UserSummary[]> {
  const { data } = await apiClient.get<UserSummary[]>('/users');
  return data;
}

export async function getMe(): Promise<User> {
  const { data } = await apiClient.get<User>('/users/me');
  return data;
}

export async function updateProfile(name: string): Promise<User> {
  const { data } = await apiClient.patch<User>('/users/me', { name });
  return data;
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  await apiClient.post('/users/me/password', { currentPassword, newPassword });
}
