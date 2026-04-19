import cron, { ScheduledTask } from 'node-cron';
import { CheckDueRemindersUseCase } from '../application/CheckDueRemindersUseCase';

export interface ReminderSchedulerOptions {
  cronExpression?: string;
  lookaheadMs?: number;
}

const DEFAULT_CRON = '*/5 * * * *';
const DEFAULT_LOOKAHEAD_MS = 24 * 60 * 60 * 1000;

export class ReminderScheduler {
  private task?: ScheduledTask;

  constructor(
    private readonly checkUseCase: CheckDueRemindersUseCase,
    private readonly options: ReminderSchedulerOptions = {},
  ) {}

  start(): void {
    if (this.task) return;

    const expression = this.options.cronExpression ?? DEFAULT_CRON;
    const lookaheadMs = this.options.lookaheadMs ?? DEFAULT_LOOKAHEAD_MS;

    this.task = cron.schedule(expression, () => {
      this.checkUseCase
        .execute({ lookaheadMs })
        .then(result => {
          if (result.remindedCount > 0) {
            console.log(
              `[ReminderScheduler] published ${result.remindedCount} TaskReminderDue events`,
            );
          }
        })
        .catch(err => {
          console.error('[ReminderScheduler] check failed', err);
        });
    });
  }

  stop(): void {
    this.task?.stop();
    this.task = undefined;
  }
}
