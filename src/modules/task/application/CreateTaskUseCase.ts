/**
 * CreateTaskUseCase
 *
 * Application-layer use case for creating a new Task.
 *
 * Layer: Application (Onion Architecture). Depends only on Domain interfaces
 * (ITaskRepository, IEventBus) — never on Infrastructure or framework code,
 * so it can be unit-tested without Express, Mongoose, or a real database.
 *
 * Responsibilities:
 *   1. Construct a valid Task aggregate from the input DTO.
 *   2. Persist it via the injected repository port.
 *   3. Publish a TaskCreated domain event for downstream subscribers
 *      (audit logger, future notification handlers, etc.).
 */

import { Task } from '../domain/Task';
import { ITaskRepository } from '../domain/ITaskRepository';
import { CreateTaskDTO } from './dtos/CreateTaskDTO';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createTaskCreatedEvent } from '../domain/events/TaskCreatedEvent';

/**
 * Creates a Task and emits a TaskCreated domain event.
 *
 * Both collaborators are injected through the constructor (dependency
 * inversion), which keeps this class decoupled from any concrete
 * persistence or messaging technology.
 */
export class CreateTaskUseCase implements UseCase<CreateTaskDTO & { createdBy: string }, Task> {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly eventBus: IEventBus
  ) {}

  /**
   * Execute the use case.
   *
   * @param input  Task fields plus `createdBy` — the id of the authenticated
   *               user creating the task. The controller derives `createdBy`
   *               from the JWT and never trusts it from the request body.
   * @returns      The newly created Task aggregate (with generated id).
   */
  async execute(input: CreateTaskDTO & { createdBy: string }): Promise<Task> {
    // Construct the aggregate. The Task constructor enforces domain
    // invariants such as identity, default status, and default priority.
    const task = new Task({
      title: input.title,
      description: input.description,
      priority: input.priority,
      dueDate: input.dueDate,
      assigneeId: input.assigneeId,
      createdBy: input.createdBy,
      tags: input.tags,
    });

    // Persist first so any synchronous subscriber that re-reads the task
    // through the repository will find it.
    await this.taskRepo.save(task);

    // Notify the rest of the system. Subscribers (audit log, notifications)
    // react to this event independently of the HTTP request lifecycle.
    this.eventBus.publish(createTaskCreatedEvent(task, input.createdBy));

    return task;
  }
}
