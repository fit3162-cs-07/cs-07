import { z } from 'zod';
import { Task } from '../domain/Task';
import { TaskStatus } from '../domain/TaskStatus';
import { ITaskRepository } from '../domain/ITaskRepository';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createTaskStatusChangedEvent } from '../domain/events/TaskStatusChangedEvent';

export const ChangeStatusSchema = z.object({
  status: z.nativeEnum(TaskStatus),
});

export class ChangeTaskStatusUseCase implements UseCase<{ id: string; status: TaskStatus; actor: string; actorRole: string }, Task> {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: { id: string; status: TaskStatus; actor: string; actorRole: string }): Promise<Task> {
    const task = await this.taskRepo.findById(input.id);
    if (!task) throw new Error('NOT_FOUND');

    // Admin can change any task status; member can only change their assigned task
    if (input.actorRole !== 'ADMIN' && task.assigneeId !== input.actor) {
      throw new Error('FORBIDDEN');
    }

    const oldStatus = task.status;
    task.changeStatus(input.status);
    await this.taskRepo.update(task);
    this.eventBus.publish(createTaskStatusChangedEvent(input.id, oldStatus, input.status, input.actor));

    return task;
  }
}
