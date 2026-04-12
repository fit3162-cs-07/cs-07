import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export function createTaskDeletedEvent(taskId: string, actor: string): DomainEvent {
  return {
    eventType: 'TaskDeleted',
    aggregateType: 'Task',
    aggregateId: taskId,
    actor,
    timestamp: new Date(),
    payload: {},
    metadata: { module: 'task' },
  };
}
