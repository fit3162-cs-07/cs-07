import { Task } from './Task';
import { TaskStatus } from './TaskStatus';
import { TaskPriority } from './TaskPriority';

export interface TaskFilters {
  status?: TaskStatus;
  assigneeId?: string;
  priority?: TaskPriority;
}

export interface ITaskRepository {
  findAll(filters?: TaskFilters): Promise<Task[]>;
  findById(id: string): Promise<Task | null>;
  save(task: Task): Promise<void>;
  update(task: Task): Promise<void>;
  delete(id: string): Promise<void>;
  findByAssignee(assigneeId: string): Promise<Task[]>;
}
