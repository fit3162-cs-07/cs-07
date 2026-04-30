import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { User } from '../User';

export function createUserProfileUpdatedEvent(user: User, actor: string): DomainEvent {
  return {
    eventType: 'UserProfileUpdated',
    aggregateType: 'User',
    aggregateId: user.id,
    actor,
    timestamp: new Date(),
    payload: { name: user.name, email: user.email },
    metadata: { module: 'identity' },
  };
}
