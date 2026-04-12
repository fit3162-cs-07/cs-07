import { DomainEvent } from '../../domain/DomainEvent';
import { AuditEvent, toAuditEvent } from '../../domain/AuditEvent';
import { IEventBus } from '../../application/EventBus';

export class AuditLogger {
  private logs: AuditEvent[] = [];

  constructor(private readonly eventBus: IEventBus) {}

  register(eventTypes: string[]): void {
    for (const eventType of eventTypes) {
      this.eventBus.subscribe(eventType, (event: DomainEvent) => {
        this.logs.push(toAuditEvent(event));
      });
    }
  }

  getLogs(): AuditEvent[] {
    return [...this.logs];
  }
}
