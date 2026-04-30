import { InMemoryNotificationRepository } from '../../../../src/modules/notification/infrastructure/InMemoryNotificationRepository';
import { Notification } from '../../../../src/modules/notification/domain/Notification';
import { NotificationType } from '../../../../src/modules/notification/domain/NotificationType';

function make(userId: string, isRead = false, ageMs = 0): Notification {
  const n = new Notification({
    userId,
    type: NotificationType.TASK_ASSIGNED,
    title: 'msg',
    isRead,
  });
  if (ageMs) {
    Object.defineProperty(n, 'createdAt', { value: new Date(Date.now() - ageMs), configurable: true });
  }
  return n;
}

describe('InMemoryNotificationRepository', () => {
  it('isolates notifications by userId', async () => {
    const repo = new InMemoryNotificationRepository();
    await repo.save(make('a'));
    await repo.save(make('a'));
    await repo.save(make('b'));

    expect(await repo.findByUser('a')).toHaveLength(2);
    expect(await repo.findByUser('b')).toHaveLength(1);
    expect(await repo.findByUser('c')).toHaveLength(0);
  });

  it('orders newest-first and respects limit', async () => {
    const repo = new InMemoryNotificationRepository();
    const oldest = make('u', false, 60_000);
    const middle = make('u', false, 30_000);
    const newest = make('u', false, 0);
    await repo.save(oldest);
    await repo.save(middle);
    await repo.save(newest);

    const all = await repo.findByUser('u');
    expect(all.map(n => n.id)).toEqual([newest.id, middle.id, oldest.id]);

    const limited = await repo.findByUser('u', { limit: 2 });
    expect(limited).toHaveLength(2);
    expect(limited[0].id).toBe(newest.id);
  });

  it('filters by unreadOnly and counts unread', async () => {
    const repo = new InMemoryNotificationRepository();
    await repo.save(make('u', true));
    await repo.save(make('u', false));
    await repo.save(make('u', false));

    const unread = await repo.findByUser('u', { unreadOnly: true });
    expect(unread).toHaveLength(2);
    expect(await repo.countUnread('u')).toBe(2);
  });

  it('markAllRead returns the count it updated and leaves nothing unread', async () => {
    const repo = new InMemoryNotificationRepository();
    await repo.save(make('u', false));
    await repo.save(make('u', false));
    await repo.save(make('u', true));

    expect(await repo.markAllRead('u')).toBe(2);
    expect(await repo.countUnread('u')).toBe(0);
  });
});
