import { DomainEvent } from '../../../../shared/domain/DomainEvent';

export function createTaskStatusChangedEvent(taskId: string, oldStatus: string, newStatus: string, actor: string): DomainEvent {
  return {
    eventType: 'TaskStatusChanged',
    aggregateType: 'Task',
    aggregateId: taskId,
    actor,
    timestamp: new Date(),
    payload: { oldStatus, newStatus },
    metadata: { module: 'task' },
  };
}
