import { INotificationRepository } from '../domain/INotificationRepository';
import { UseCase } from '../../../shared/application/UseCase';

export interface MarkNotificationReadInput {
  notificationId: string;
  userId: string;
}

export class MarkNotificationReadUseCase implements UseCase<MarkNotificationReadInput, void> {
  constructor(private readonly repo: INotificationRepository) {}

  async execute(input: MarkNotificationReadInput): Promise<void> {
    const notification = await this.repo.findById(input.notificationId);
    if (!notification) throw new Error('NOTIFICATION_NOT_FOUND');
    if (notification.userId !== input.userId) throw new Error('FORBIDDEN');
    notification.markRead();
    await this.repo.save(notification);
  }
}
