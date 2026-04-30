import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export function createUserStatusChangedEvent(input: {
  userId: string;
  isActive: boolean;
  actor: string;
}): DomainEvent {
  return {
    eventType: 'UserStatusChanged',
    aggregateType: 'User',
    aggregateId: input.userId,
    actor: input.actor,
    timestamp: new Date(),
    payload: { isActive: input.isActive },
    metadata: { module: 'identity' },
  };
}
