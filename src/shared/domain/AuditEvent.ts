import { v4 as uuidv4 } from 'uuid';
import { DomainEvent } from './DomainEvent';

export interface AuditEvent extends DomainEvent {
  id: string;
}

export function toAuditEvent(event: DomainEvent): AuditEvent {
  return {
    id: uuidv4(),
    ...event,
  };
}
