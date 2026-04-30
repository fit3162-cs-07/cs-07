import { Notification } from './Notification';

export interface ListOptions {
  unreadOnly?: boolean;
  limit?: number;
}

export interface INotificationRepository {
  save(notification: Notification): Promise<void>;
  findById(id: string): Promise<Notification | null>;
  findByUser(userId: string, options?: ListOptions): Promise<Notification[]>;
  countUnread(userId: string): Promise<number>;
  markAllRead(userId: string): Promise<number>;
}
