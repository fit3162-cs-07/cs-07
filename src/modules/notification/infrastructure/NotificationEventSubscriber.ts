import { DomainEvent } from '../../../shared/domain/DomainEvent';
import { IEventBus } from '../../../shared/application/EventBus';
import { ITaskRepository } from '../../task/domain/ITaskRepository';
import { CreateNotificationUseCase } from '../application/CreateNotificationUseCase';
import { NotificationType } from '../domain/NotificationType';

export class NotificationEventSubscriber {
  constructor(
    private readonly createNotification: CreateNotificationUseCase,
    private readonly taskRepo: ITaskRepository,
  ) {}

  register(eventBus: IEventBus): void {
    eventBus.subscribe('TaskCreated', e => void this.onTaskCreatedOrAssigned(e));
    eventBus.subscribe('TaskAssigned', e => void this.onTaskCreatedOrAssigned(e));
    eventBus.subscribe('TaskReminderDue', e => void this.onTaskReminderDue(e));
    eventBus.subscribe('TaskStatusChanged', e => void this.onTaskStatusChanged(e));
  }

  private async onTaskCreatedOrAssigned(event: DomainEvent): Promise<void> {
    const task = await this.taskRepo.findById(event.aggregateId);
    const assigneeId =
      (event.payload.assigneeId as string | undefined) ?? task?.assigneeId;
    if (!assigneeId) return;
    if (event.actor === assigneeId) return;
    const title = task ? `You were assigned: ${task.title}` : 'You were assigned a task';
    await this.createNotification.execute({
      userId: assigneeId,
      type: NotificationType.TASK_ASSIGNED,
      title,
      link: `/tasks/${event.aggregateId}`,
      sourceAggregateId: event.aggregateId,
    });
  }

  private async onTaskReminderDue(event: DomainEvent): Promise<void> {
    const assigneeId = event.payload.assigneeId as string | undefined;
    if (!assigneeId) return;
    const taskTitle = (event.payload.title as string | undefined) ?? 'task';
    await this.createNotification.execute({
      userId: assigneeId,
      type: NotificationType.TASK_REMINDER_DUE,
      title: `Reminder: ${taskTitle} is due soon`,
      link: `/tasks/${event.aggregateId}`,
      sourceAggregateId: event.aggregateId,
    });
  }

  private async onTaskStatusChanged(event: DomainEvent): Promise<void> {
    const task = await this.taskRepo.findById(event.aggregateId);
    if (!task?.assigneeId) return;
    if (task.assigneeId === event.actor) return;
    const newStatus = event.payload.newStatus as string;
    await this.createNotification.execute({
      userId: task.assigneeId,
      type: NotificationType.TASK_STATUS_CHANGED,
      title: `Status changed on ${task.title}: ${newStatus}`,
      link: `/tasks/${task.id}`,
      sourceAggregateId: task.id,
    });
  }
}
