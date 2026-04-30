import { CreateNotificationUseCase } from '../../../../src/modules/notification/application/CreateNotificationUseCase';
import { InMemoryNotificationRepository } from '../../../../src/modules/notification/infrastructure/InMemoryNotificationRepository';
import { NotificationType } from '../../../../src/modules/notification/domain/NotificationType';
import { DomainEvent } from '../../../../src/shared/domain/DomainEvent';
import { IEventBus } from '../../../../src/shared/application/EventBus';

class FakeBus implements IEventBus {
  events: DomainEvent[] = [];
  publish(event: DomainEvent): void {
    this.events.push(event);
  }
  subscribe(): void {
    // no-op
  }
}

describe('CreateNotificationUseCase', () => {
  it('persists the notification and publishes NotificationCreated', async () => {
    const repo = new InMemoryNotificationRepository();
    const bus = new FakeBus();
    const useCase = new CreateNotificationUseCase(repo, bus);

    const result = await useCase.execute({
      userId: 'user-1',
      type: NotificationType.TASK_ASSIGNED,
      title: 'You were assigned: Ship the report',
      link: '/tasks/abc',
      sourceAggregateId: 'abc',
    });

    expect(result.id).toBeDefined();
    expect(result.isRead).toBe(false);
    const stored = await repo.findById(result.id);
    expect(stored?.title).toBe('You were assigned: Ship the report');
    expect(bus.events).toHaveLength(1);
    expect(bus.events[0]?.eventType).toBe('NotificationCreated');
    expect(bus.events[0]?.metadata.module).toBe('notification');
  });

  it('defaults isRead to false and stores the source aggregate id', async () => {
    const repo = new InMemoryNotificationRepository();
    const bus = new FakeBus();
    const useCase = new CreateNotificationUseCase(repo, bus);

    const result = await useCase.execute({
      userId: 'u',
      type: NotificationType.TASK_REMINDER_DUE,
      title: 'Reminder: foo',
      sourceAggregateId: 'task-99',
    });

    expect(result.sourceAggregateId).toBe('task-99');
    expect(result.isRead).toBe(false);
  });
});
