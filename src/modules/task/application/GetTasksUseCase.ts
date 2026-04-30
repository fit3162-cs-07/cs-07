import { ITaskRepository } from '../domain/ITaskRepository';
import { Task } from '../domain/Task';
import { TaskFilter, TaskFilterProps } from '../domain/TaskFilter';
import { UseCase } from '../../../shared/application/UseCase';

export interface GetTasksInput {
  filter?: TaskFilterProps;
  page?: number;
  limit?: number;
  userId: string;
  userRole: string;
}

export interface GetTasksOutput {
  tasks: Task[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export class GetTasksUseCase implements UseCase<GetTasksInput, GetTasksOutput> {
  constructor(private readonly taskRepo: ITaskRepository) {}

  async execute(input: GetTasksInput): Promise<GetTasksOutput> {
    const page = Math.max(1, input.page ?? 1);
    const limit = Math.min(100, Math.max(1, input.limit ?? 20));

    const taskFilter = TaskFilter.create(input.filter ?? {});

    const result = await this.taskRepo.findByFilter(
      taskFilter,
      page,
      limit,
      input.userId,
      input.userRole,
    );

    return {
      tasks: result.items,
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }
}
