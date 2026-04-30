import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { Notification } from '../Notification';

export function createNotificationCreatedEvent(notification: Notification): DomainEvent {
  return {
    eventType: 'NotificationCreated',
    aggregateType: 'Notification',
    aggregateId: notification.id,
    actor: 'system',
    timestamp: new Date(),
    payload: {
      userId: notification.userId,
      type: notification.type,
      title: notification.title,
    },
    metadata: { module: 'notification' },
  };
}
