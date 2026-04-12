import { Task } from '../domain/Task';
import { ITaskRepository } from '../domain/ITaskRepository';
import { CreateTaskDTO } from './dtos/CreateTaskDTO';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createTaskCreatedEvent } from '../domain/events/TaskCreatedEvent';

export class CreateTaskUseCase implements UseCase<CreateTaskDTO & { createdBy: string }, Task> {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: CreateTaskDTO & { createdBy: string }): Promise<Task> {
    const task = new Task({
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      createdBy: input.createdBy,
    });

    await this.taskRepo.save(task);
    this.eventBus.publish(createTaskCreatedEvent(task, input.createdBy));

    return task;
  }
}
