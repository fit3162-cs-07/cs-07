/**
 * ITaskRepository
 *
 * Domain-layer port (interface) for persisting Task aggregates.
 *
 * Layer: Domain (Onion Architecture). Holds no implementation details and
 * has zero dependencies on Express, Mongoose, or any framework. Concrete
 * adapters such as InMemoryTaskRepository and MongoTaskRepository live in
 * the Infrastructure layer and implement this interface — the classic
 * Dependency Inversion pattern.
 *
 * Application-layer use cases depend on this interface only, which keeps
 * business logic testable without spinning up a real database.
 */

import { Task } from './Task';
import { TaskFilter } from './TaskFilter';

/**
 * Generic paginated-result wrapper returned by repository queries that
 * support paging.
 */
export interface PaginatedResult<T> {
  items: T[];          // The slice of rows for the requested page.
  total: number;       // Total matching rows across all pages.
  page: number;        // 1-based page number actually returned.
  limit: number;       // Requested page size.
  totalPages: number;  // ceil(total / limit).
}

/**
 * Persistence port for Task aggregates. Implemented by Infrastructure
 * adapters; consumed by Application-layer use cases.
 */
export interface ITaskRepository {
  /** Returns every task (unfiltered). Intended for admin / debug paths only. */
  findAll(): Promise<Task[]>;

  /**
   * Returns a paginated, filtered list of tasks scoped by RBAC:
   * admins see all matches; members see only the tasks they created or
   * are assigned to.
   */
  findByFilter(filter: TaskFilter, page: number, limit: number, userId: string, userRole: string): Promise<PaginatedResult<Task>>;

  /** Lookup by id; resolves to null when no such task exists. */
  findById(id: string): Promise<Task | null>;

  /** Inserts a new task. Used by CreateTaskUseCase. */
  save(task: Task): Promise<void>;

  /** Replaces an existing task. Used by Update / Assign / ChangeStatus use cases. */
  update(task: Task): Promise<void>;

  /** Removes a task by id. */
  delete(id: string): Promise<void>;

  /** Returns every task currently assigned to the given user. */
  findByAssignee(assigneeId: string): Promise<Task[]>;
}
