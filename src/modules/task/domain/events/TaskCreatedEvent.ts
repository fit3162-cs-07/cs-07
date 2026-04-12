import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { Task } from '../Task';

export function createTaskCreatedEvent(task: Task, actor: string): DomainEvent {
  return {
    eventType: 'TaskCreated',
    aggregateType: 'Task',
    aggregateId: task.id,
    actor,
    timestamp: new Date(),
    payload: { title: task.title, priority: task.priority, status: task.status },
    metadata: { module: 'task' },
  };
}
