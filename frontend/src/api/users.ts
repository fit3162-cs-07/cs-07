import { apiClient } from './client';
import type { Role, User, UserSummary } from './types';

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

// Admin-only operations (Task F1 backend)

export interface AdminUpdateUserInput {
  name?: string;
  role?: Role;
}

export async function adminUpdateUser(id: string, input: AdminUpdateUserInput): Promise<UserSummary> {
  const { data } = await apiClient.patch<UserSummary>(`/users/${id}`, input);
  return data;
}

export async function adminDeactivateUser(id: string): Promise<UserSummary> {
  const { data } = await apiClient.post<UserSummary>(`/users/${id}/deactivate`);
  return data;
}

export async function adminActivateUser(id: string): Promise<UserSummary> {
  const { data } = await apiClient.post<UserSummary>(`/users/${id}/activate`);
  return data;
}
