import { CheckDueRemindersUseCase } from '../../../../src/modules/task/application/CheckDueRemindersUseCase';
import { InMemoryTaskRepository } from '../../../../src/modules/task/infrastructure/InMemoryTaskRepository';
import { Task } from '../../../../src/modules/task/domain/Task';
import { TaskStatus } from '../../../../src/modules/task/domain/TaskStatus';
import { IEventBus } from '../../../../src/shared/application/EventBus';

const ONE_HOUR_MS = 60 * 60 * 1000;
const ONE_DAY_MS = 24 * ONE_HOUR_MS;

function makeBus(): IEventBus & { publish: jest.Mock; subscribe: jest.Mock } {
  return {
    publish: jest.fn(),
    subscribe: jest.fn(),
  };
}

describe('CheckDueRemindersUseCase', () => {
  const NOW = new Date('2026-04-19T12:00:00.000Z');
  const clock = () => NOW;

  it('publishes a reminder for a task due inside the lookahead window', async () => {
    const repo = new InMemoryTaskRepository();
    await repo.save(
      new Task({
        title: 'Soon-due task',
        createdBy: 'admin',
        dueDate: new Date(NOW.getTime() + 6 * ONE_HOUR_MS),
      }),
    );
    const bus = makeBus();
    const useCase = new CheckDueRemindersUseCase(repo, bus, clock);

    const result = await useCase.execute({ lookaheadMs: ONE_DAY_MS });

    expect(result.remindedCount).toBe(1);
    expect(bus.publish).toHaveBeenCalledTimes(1);
    expect(bus.publish).toHaveBeenCalledWith(
      expect.objectContaining({ eventType: 'TaskReminderDue', aggregateType: 'Task' }),
    );
  });

  it('skips tasks without a due date', async () => {
    const repo = new InMemoryTaskRepository();
    await repo.save(new Task({ title: 'No deadline', createdBy: 'admin' }));
    const bus = makeBus();
    const useCase = new CheckDueRemindersUseCase(repo, bus, clock);

    const result = await useCase.execute({ lookaheadMs: ONE_DAY_MS });

    expect(result.remindedCount).toBe(0);
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('skips tasks already past their due date', async () => {
    const repo = new InMemoryTaskRepository();
    await repo.save(
      new Task({
        title: 'Already overdue',
        createdBy: 'admin',
        dueDate: new Date(NOW.getTime() - ONE_HOUR_MS),
      }),
    );
    const bus = makeBus();
    const useCase = new CheckDueRemindersUseCase(repo, bus, clock);

    const result = await useCase.execute({ lookaheadMs: ONE_DAY_MS });

    expect(result.remindedCount).toBe(0);
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('skips tasks beyond the lookahead window', async () => {
    const repo = new InMemoryTaskRepository();
    await repo.save(
      new Task({
        title: 'Far future',
        createdBy: 'admin',
        dueDate: new Date(NOW.getTime() + 7 * ONE_DAY_MS),
      }),
    );
    const bus = makeBus();
    const useCase = new CheckDueRemindersUseCase(repo, bus, clock);

    const result = await useCase.execute({ lookaheadMs: ONE_DAY_MS });

    expect(result.remindedCount).toBe(0);
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('skips DONE tasks even if their due date is inside the window', async () => {
    const repo = new InMemoryTaskRepository();
    await repo.save(
      new Task({
        title: 'Already done',
        status: TaskStatus.DONE,
        createdBy: 'admin',
        dueDate: new Date(NOW.getTime() + 2 * ONE_HOUR_MS),
      }),
    );
    const bus = makeBus();
    const useCase = new CheckDueRemindersUseCase(repo, bus, clock);

    const result = await useCase.execute({ lookaheadMs: ONE_DAY_MS });

    expect(result.remindedCount).toBe(0);
    expect(bus.publish).not.toHaveBeenCalled();
  });

  it('does not publish a second reminder for the same task on the next tick', async () => {
    const repo = new InMemoryTaskRepository();
    await repo.save(
      new Task({
        title: 'Soon-due task',
        createdBy: 'admin',
        dueDate: new Date(NOW.getTime() + 3 * ONE_HOUR_MS),
      }),
    );
    const bus = makeBus();
    const useCase = new CheckDueRemindersUseCase(repo, bus, clock);

    const first = await useCase.execute({ lookaheadMs: ONE_DAY_MS });
    const second = await useCase.execute({ lookaheadMs: ONE_DAY_MS });

    expect(first.remindedCount).toBe(1);
    expect(second.remindedCount).toBe(0);
    expect(bus.publish).toHaveBeenCalledTimes(1);
  });

  it('returns the IDs of tasks it reminded about', async () => {
    const repo = new InMemoryTaskRepository();
    const t1 = new Task({
      title: 'Soon A',
      createdBy: 'admin',
      dueDate: new Date(NOW.getTime() + 2 * ONE_HOUR_MS),
    });
    const t2 = new Task({
      title: 'Soon B',
      createdBy: 'admin',
      dueDate: new Date(NOW.getTime() + 4 * ONE_HOUR_MS),
    });
    await repo.save(t1);
    await repo.save(t2);
    const bus = makeBus();
    const useCase = new CheckDueRemindersUseCase(repo, bus, clock);

    const result = await useCase.execute({ lookaheadMs: ONE_DAY_MS });

    expect(result.remindedCount).toBe(2);
    expect(result.remindedTaskIds).toEqual(expect.arrayContaining([t1.id, t2.id]));
  });
});
