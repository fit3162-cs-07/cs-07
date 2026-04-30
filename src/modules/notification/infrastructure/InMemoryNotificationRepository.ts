import { Notification } from '../domain/Notification';
import { INotificationRepository, ListOptions } from '../domain/INotificationRepository';

export class InMemoryNotificationRepository implements INotificationRepository {
  private notifications: Map<string, Notification> = new Map();

  async save(notification: Notification): Promise<void> {
    this.notifications.set(notification.id, notification);
  }

  async findById(id: string): Promise<Notification | null> {
    return this.notifications.get(id) ?? null;
  }

  async findByUser(userId: string, options: ListOptions = {}): Promise<Notification[]> {
    const all = Array.from(this.notifications.values()).filter(n => n.userId === userId);
    const filtered = options.unreadOnly ? all.filter(n => !n.isRead) : all;
    filtered.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    return options.limit ? filtered.slice(0, options.limit) : filtered;
  }

  async countUnread(userId: string): Promise<number> {
    let count = 0;
    for (const n of this.notifications.values()) {
      if (n.userId === userId && !n.isRead) count++;
    }
    return count;
  }

  async markAllRead(userId: string): Promise<number> {
    let updated = 0;
    for (const n of this.notifications.values()) {
      if (n.userId === userId && !n.isRead) {
        n.markRead();
        updated++;
      }
    }
    return updated;
  }
}
