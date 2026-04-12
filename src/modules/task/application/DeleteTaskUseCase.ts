import { ITaskRepository } from '../domain/ITaskRepository';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createTaskDeletedEvent } from '../domain/events/TaskDeletedEvent';

export class DeleteTaskUseCase implements UseCase<{ id: string; actor: string }, void> {
  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(input: { id: string; actor: string }): Promise<void> {
    const task = await this.taskRepo.findById(input.id);
    if (!task) throw new Error('NOT_FOUND');

    await this.taskRepo.delete(input.id);
    this.eventBus.publish(createTaskDeletedEvent(input.id, input.actor));
  }
}
