import { MarkNotificationReadUseCase } from '../../../../src/modules/notification/application/MarkNotificationReadUseCase';
import { InMemoryNotificationRepository } from '../../../../src/modules/notification/infrastructure/InMemoryNotificationRepository';
import { Notification } from '../../../../src/modules/notification/domain/Notification';
import { NotificationType } from '../../../../src/modules/notification/domain/NotificationType';

describe('MarkNotificationReadUseCase', () => {
  it('marks the notification as read', async () => {
    const repo = new InMemoryNotificationRepository();
    const n = new Notification({ userId: 'u-1', type: NotificationType.TASK_ASSIGNED, title: 't' });
    await repo.save(n);

    const useCase = new MarkNotificationReadUseCase(repo);
    await useCase.execute({ notificationId: n.id, userId: 'u-1' });

    const reloaded = await repo.findById(n.id);
    expect(reloaded?.isRead).toBe(true);
  });

  it('throws NOTIFICATION_NOT_FOUND for an unknown id', async () => {
    const repo = new InMemoryNotificationRepository();
    const useCase = new MarkNotificationReadUseCase(repo);
    await expect(
      useCase.execute({ notificationId: 'missing', userId: 'u-1' }),
    ).rejects.toThrow('NOTIFICATION_NOT_FOUND');
  });

  it('throws FORBIDDEN when the caller is not the owner', async () => {
    const repo = new InMemoryNotificationRepository();
    const n = new Notification({ userId: 'u-1', type: NotificationType.TASK_ASSIGNED, title: 't' });
    await repo.save(n);

    const useCase = new MarkNotificationReadUseCase(repo);
    await expect(useCase.execute({ notificationId: n.id, userId: 'u-2' })).rejects.toThrow(
      'FORBIDDEN',
    );
  });
});
