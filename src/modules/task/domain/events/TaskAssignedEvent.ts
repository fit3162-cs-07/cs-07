import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export function createTaskAssignedEvent(taskId: string, assigneeId: string, actor: string): DomainEvent {
  return {
    eventType: 'TaskAssigned',
    aggregateType: 'Task',
    aggregateId: taskId,
    actor,
    timestamp: new Date(),
    payload: { assigneeId },
    metadata: { module: 'task' },
  };
}
