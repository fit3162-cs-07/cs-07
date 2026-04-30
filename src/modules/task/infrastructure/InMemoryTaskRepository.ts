import { Task } from '../domain/Task';
import { ITaskRepository, PaginatedResult } from '../domain/ITaskRepository';
import { TaskFilter } from '../domain/TaskFilter';
import { Role } from '../../identity/domain/Role';

export class InMemoryTaskRepository implements ITaskRepository {
  private tasks: Map<string, Task> = new Map();

  async findAll(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async findByFilter(
    filter: TaskFilter,
    page: number,
    limit: number,
    userId: string,
    userRole: string,
  ): Promise<PaginatedResult<Task>> {
    let results = Array.from(this.tasks.values());

    // RBAC: members see only tasks they created or are assigned to
    if (userRole !== Role.ADMIN) {
      results = results.filter(
        t => t.createdBy === userId || t.assigneeId === userId,
      );
    }

    // Apply user filters
    if (filter.status) {
      results = results.filter(t => t.status === filter.status);
    }
    if (filter.priority) {
      results = results.filter(t => t.priority === filter.priority);
    }
    if (filter.assigneeId) {
      results = results.filter(t => t.assigneeId === filter.assigneeId);
    }
    if (filter.tags.length > 0) {
      results = results.filter(t =>
        filter.tags.every(tag => t.hasTag(tag)),
      );
    }
    if (filter.search) {
      const term = filter.search;
      results = results.filter(
        t =>
          t.title.toLowerCase().includes(term) ||
          t.description.toLowerCase().includes(term),
      );
    }
    if (filter.dueBefore) {
      results = results.filter(t => t.dueDate && t.dueDate <= filter.dueBefore!);
    }
    if (filter.dueAfter) {
      results = results.filter(t => t.dueDate && t.dueDate >= filter.dueAfter!);
    }

    // Sort by createdAt descending (newest first)
    results.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());

    const total = results.length;
    const start = (page - 1) * limit;
    const paged = results.slice(start, start + limit);

    return {
      items: paged,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
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
