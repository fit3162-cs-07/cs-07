import { INotificationRepository } from '../domain/INotificationRepository';
import { Notification } from '../domain/Notification';
import { NotificationType } from '../domain/NotificationType';
import { IEventBus } from '../../../shared/application/EventBus';
import { UseCase } from '../../../shared/application/UseCase';
import { createNotificationCreatedEvent } from '../domain/events/NotificationCreatedEvent';

export interface CreateNotificationInput {
  userId: string;
  type: NotificationType;
  title: string;
  body?: string;
  link?: string;
  sourceAggregateId?: string;
}

export class CreateNotificationUseCase implements UseCase<CreateNotificationInput, Notification> {
  constructor(
    private readonly repo: INotificationRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(input: CreateNotificationInput): Promise<Notification> {
    const notification = new Notification(input);
    await this.repo.save(notification);
    this.eventBus.publish(createNotificationCreatedEvent(notification));
    return notification;
  }
}
