import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { Role } from '../Role';

export function createUserRoleChangedEvent(input: {
  userId: string;
  previousRole: Role;
  newRole: Role;
  actor: string;
}): DomainEvent {
  return {
    eventType: 'UserRoleChanged',
    aggregateType: 'User',
    aggregateId: input.userId,
    actor: input.actor,
    timestamp: new Date(),
    payload: { previousRole: input.previousRole, newRole: input.newRole },
    metadata: { module: 'identity' },
  };
}
