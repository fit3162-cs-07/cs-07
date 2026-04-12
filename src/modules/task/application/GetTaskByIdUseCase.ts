import { Task } from '../domain/Task';
import { ITaskRepository } from '../domain/ITaskRepository';
import { UseCase } from '../../../shared/application/UseCase';

export class GetTaskByIdUseCase implements UseCase<string, Task> {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(id: string): Promise<Task> {
    const task = await this.taskRepo.findById(id);
    if (!task) throw new Error('NOT_FOUND');
    return task;
  }
}
