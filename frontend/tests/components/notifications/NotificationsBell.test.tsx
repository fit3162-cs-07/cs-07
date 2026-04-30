import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotificationsBell } from '../../../src/components/notifications/NotificationsBell';
import {
  NotificationsContext,
  type NotificationsContextValue,
} from '../../../src/contexts/NotificationsContext';
import type { Notification } from '../../../src/api/notifications';

function makeNotification(overrides: Partial<Notification> = {}): Notification {
  return {
    id: 'n1',
    type: 'TASK_ASSIGNED',
    title: 'You were assigned: Ship report',
    isRead: false,
    link: '/tasks/abc',
    createdAt: new Date('2026-04-30T08:00:00Z').toISOString(),
    ...overrides,
  };
}

interface RenderOptions {
  notifications?: Notification[];
  unreadCount?: number;
}

function renderBell({ notifications = [], unreadCount = 0 }: RenderOptions = {}) {
  const ctx: NotificationsContextValue = {
    notifications,
    unreadCount,
    loading: false,
    error: null,
    refresh: vi.fn(async () => undefined),
    markRead: vi.fn(async () => undefined),
    markAllRead: vi.fn(async () => undefined),
  };

  render(
    <MemoryRouter>
      <NotificationsContext.Provider value={ctx}>
        <NotificationsBell />
      </NotificationsContext.Provider>
    </MemoryRouter>,
  );

  return ctx;
}

describe('NotificationsBell', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders the bell button without a badge when unreadCount is 0', () => {
    renderBell();
    expect(screen.getByRole('button', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.queryByTestId('notifications-badge')).not.toBeInTheDocument();
  });

  it('renders the unread count badge in the aria-label and visible badge', () => {
    renderBell({ unreadCount: 4 });
    expect(screen.getByRole('button', { name: /4 unread/ })).toBeInTheDocument();
    expect(screen.getByTestId('notifications-badge')).toHaveTextContent('4');
  });

  it('caps the badge label at 99+ for very large counts', () => {
    renderBell({ unreadCount: 250 });
    expect(screen.getByTestId('notifications-badge')).toHaveTextContent('99+');
  });

  it('opens the panel on click and refreshes', async () => {
    const user = userEvent.setup();
    const ctx = renderBell({ notifications: [makeNotification()], unreadCount: 1 });

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    expect(screen.getByText('You were assigned: Ship report')).toBeInTheDocument();
    expect(ctx.refresh).toHaveBeenCalled();
  });

  it('shows an empty-state copy when there are no notifications', async () => {
    const user = userEvent.setup();
    renderBell();
    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.getByText(/all caught up/i)).toBeInTheDocument();
  });

  it('marks a notification read when its row is clicked', async () => {
    const user = userEvent.setup();
    const n = makeNotification({ id: 'click-me' });
    const ctx = renderBell({ notifications: [n], unreadCount: 1 });

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    await user.click(screen.getByRole('button', { name: /You were assigned/ }));

    expect(ctx.markRead).toHaveBeenCalledWith('click-me');
  });

  it('does not call markRead when the clicked notification is already read', async () => {
    const user = userEvent.setup();
    const n = makeNotification({ isRead: true });
    const ctx = renderBell({ notifications: [n], unreadCount: 0 });

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    await user.click(screen.getByRole('button', { name: /You were assigned/ }));

    expect(ctx.markRead).not.toHaveBeenCalled();
  });

  it('shows the Mark all read button only when there is at least one unread', async () => {
    const user = userEvent.setup();
    const ctx = renderBell({
      notifications: [makeNotification({ id: 'a' }), makeNotification({ id: 'b', isRead: true })],
      unreadCount: 1,
    });

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    const markAllBtn = screen.getByRole('button', { name: 'Mark all read' });
    await user.click(markAllBtn);
    expect(ctx.markAllRead).toHaveBeenCalled();
  });

  it('hides the Mark all read button when everything is already read', async () => {
    const user = userEvent.setup();
    renderBell({
      notifications: [makeNotification({ isRead: true })],
      unreadCount: 0,
    });

    await user.click(screen.getByRole('button', { name: 'Notifications' }));
    expect(screen.queryByRole('button', { name: 'Mark all read' })).not.toBeInTheDocument();
  });

  it('closes the panel on Escape', async () => {
    const user = userEvent.setup();
    renderBell({ notifications: [makeNotification()], unreadCount: 1 });

    await user.click(screen.getByRole('button', { name: /Notifications/ }));
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toBeInTheDocument();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument();
  });
});
