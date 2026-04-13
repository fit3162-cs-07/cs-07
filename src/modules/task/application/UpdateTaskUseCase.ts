import { Task } from '../domain/Task';
import { ITaskRepository } from '../domain/ITaskRepository';
import { UpdateTaskDTO } from './dtos/UpdateTaskDTO';
import { UseCase } from '../../../shared/application/UseCase';

export class UpdateTaskUseCase implements UseCase<{ id: string } & UpdateTaskDTO, Task> {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(input: { id: string } & UpdateTaskDTO): Promise<Task> {
    const task = await this.taskRepo.findById(input.id);
    if (!task) throw new Error('NOT_FOUND');

    task.update({
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      status: input.status,
      tags: input.tags,
    });

    await this.taskRepo.update(task);
    return task;
  }
}
