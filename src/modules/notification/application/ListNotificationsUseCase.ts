import { INotificationRepository } from '../domain/INotificationRepository';
import { UseCase } from '../../../shared/application/UseCase';
import { NotificationDTO } from './dtos/NotificationDTO';

export interface ListNotificationsInput {
  userId: string;
  unreadOnly?: boolean;
  limit?: number;
}

export class ListNotificationsUseCase implements UseCase<ListNotificationsInput, NotificationDTO[]> {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(input: ListNotificationsInput): Promise<NotificationDTO[]> {
    const notifications = await this.repo.findByUser(input.userId, {
      unreadOnly: input.unreadOnly,
      limit: input.limit,
    });
    return notifications.map(n => ({
      id: n.id,
      type: n.type,
      title: n.title,
      body: n.body,
      link: n.link,
      isRead: n.isRead,
      sourceAggregateId: n.sourceAggregateId,
      createdAt: n.createdAt.toISOString(),
    }));
  }
}
