import { Task } from '../domain/Task';
import { ITaskRepository, TaskFilters } from '../domain/ITaskRepository';
import { UseCase } from '../../../shared/application/UseCase';

export class GetTasksUseCase implements UseCase<TaskFilters | undefined, Task[]> {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(filters?: TaskFilters): Promise<Task[]> {
    return this.taskRepo.findAll(filters);
  }
}
