import { ITaskRepository } from '../domain/ITaskRepository';
import { TaskStatus } from '../domain/TaskStatus';
import { UseCase } from '../../../shared/application/UseCase';
import { IEventBus } from '../../../shared/application/EventBus';
import { createTaskReminderDueEvent } from '../domain/events/TaskReminderDueEvent';

export interface CheckDueRemindersInput {
  lookaheadMs: number;
}

export interface CheckDueRemindersOutput {
  remindedCount: number;
  remindedTaskIds: string[];
}

export class CheckDueRemindersUseCase
  implements UseCase<CheckDueRemindersInput, CheckDueRemindersOutput>
{
  private readonly alreadyReminded = new Set<string>();

  constructor(
    private readonly taskRepo: ITaskRepository,
    private readonly eventBus: IEventBus,
    private readonly clock: () => Date = () => new Date(),
  ) {}

  async execute(input: CheckDueRemindersInput): Promise<CheckDueRemindersOutput> {
    const now = this.clock();
    const horizon = new Date(now.getTime() + input.lookaheadMs);

    const all = await this.taskRepo.findAll();
    const due = all.filter(
      t =>
        t.dueDate !== undefined &&
        t.dueDate > now &&
        t.dueDate <= horizon &&
        t.status !== TaskStatus.DONE &&
        !this.alreadyReminded.has(t.id),
    );

    for (const task of due) {
      this.eventBus.publish(createTaskReminderDueEvent(task, 'system'));
      this.alreadyReminded.add(task.id);
    }

    return {
      remindedCount: due.length,
      remindedTaskIds: due.map(t => t.id),
    };
  }
}
