import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { User } from '../User';

export function createUserPasswordChangedEvent(user: User, actor: string): DomainEvent {
  return {
    eventType: 'UserPasswordChanged',
    aggregateType: 'User',
    aggregateId: user.id,
    actor,
    timestamp: new Date(),
    payload: { email: user.email },
    metadata: { module: 'identity' },
  };
}
