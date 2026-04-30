import { DomainEvent } from '../../../../shared/domain/DomainEvent';
import { Task } from '../Task';

export function createTaskReminderDueEvent(task: Task, actor: string): DomainEvent {
  return {
    eventType: 'TaskReminderDue',
    aggregateType: 'Task',
    aggregateId: task.id,
    actor,
    timestamp: new Date(),
    payload: {
      title: task.title,
      dueDate: task.dueDate?.toISOString(),
      assigneeId: task.assigneeId,
      priority: task.priority,
      status: task.status,
    },
    metadata: { module: 'task' },
  };
}
