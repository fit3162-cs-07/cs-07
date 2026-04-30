import { apiClient } from './client';

export type NotificationType = 'TASK_ASSIGNED' | 'TASK_REMINDER_DUE' | 'TASK_STATUS_CHANGED';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  isRead: boolean;
  sourceAggregateId?: string;
  createdAt: string;
}

export interface ListNotificationsOptions {
  unreadOnly?: boolean;
  limit?: number;
}

export async function listNotifications(options: ListNotificationsOptions = {}): Promise<Notification[]> {
  const params = new URLSearchParams();
  if (options.unreadOnly) params.set('unreadOnly', 'true');
  if (options.limit) params.set('limit', String(options.limit));
  const query = params.toString();
  const { data } = await apiClient.get<Notification[]>(
    `/notifications${query ? `?${query}` : ''}`,
  );
  return data;
}

export async function getUnreadCount(): Promise<number> {
  const { data } = await apiClient.get<{ count: number }>('/notifications/unread-count');
  return data.count;
}

export async function markNotificationRead(id: string): Promise<void> {
  await apiClient.post(`/notifications/${id}/read`);
}

export async function markAllNotificationsRead(): Promise<number> {
  const { data } = await apiClient.post<{ updated: number }>('/notifications/read-all');
  return data.updated;
}
