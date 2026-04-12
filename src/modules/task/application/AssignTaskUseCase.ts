import { Task } from '../domain/Task';
import { ITaskRepository } from '../domain/ITaskRepository';
import { AssignTaskDTO } from './dtos/AssignTaskDTO';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createTaskAssignedEvent } from '../domain/events/TaskAssignedEvent';

export class AssignTaskUseCase implements UseCase<{ id: string; actor: string } & AssignTaskDTO, Task> {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: { id: string; actor: string } & AssignTaskDTO): Promise<Task> {
    const task = await this.taskRepo.findById(input.id);
    if (!task) throw new Error('NOT_FOUND');

    task.assign(input.assigneeId);
    await this.taskRepo.update(task);
    this.eventBus.publish(createTaskAssignedEvent(input.id, input.assigneeId, input.actor));

    return task;
  }
}
