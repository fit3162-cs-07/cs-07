import { Task } from '../domain/Task';
import { ITaskRepository, TaskFilters } from '../domain/ITaskRepository';

export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();

  async findAll(filters?: TaskFilters): Promise<Task[]> {
    let results = Array.from(this.tasks.values());

    if (filters?.status) {
      results = results.filter(t => t.status === filters.status);
    }
    if (filters?.assigneeId) {
      results = results.filter(t => t.assigneeId === filters.assigneeId);
    }
    if (filters?.priority) {
      results = results.filter(t => t.priority === filters.priority);
    }

    return results;
  }

  async findById(id: string): Promise<Task | null> {
    return this.tasks.get(id) ?? null;
  }

  async save(task: Task): Promise<void> {
    this.tasks.set(task.id, task);
  }

  async update(task: Task): Promise<void> {
    if (!this.tasks.has(task.id)) throw new Error('NOT_FOUND');
    this.tasks.set(task.id, task);
  }

  async delete(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  async findByAssignee(assigneeId: string): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(t => t.assigneeId === assigneeId);
  }
}
