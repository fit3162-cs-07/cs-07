import { Task } from './Task';
import { TaskFilter } from './TaskFilter';

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ITaskRepository {
  findAll(): Promise<Task[]>;
  findByFilter(filter: TaskFilter, page: number, limit: number, userId: string, userRole: string): Promise<PaginatedResult<Task>>;
  findById(id: string): Promise<Task | null>;
  save(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  findByAssignee(assigneeId: string): Promise<Task[]>;
}
