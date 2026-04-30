import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';

import { UpcomingReminders } from '../../../src/components/dashboard/UpcomingReminders';
import { ToastContext } from '../../../src/components/ui/Toast';
import { UsersContext } from '../../../src/contexts/UsersContext';
import type { Task, UserSummary } from '../../../src/api/types';

vi.mock('../../../src/api/tasks', () => ({
  listTasks: vi.fn(),
}));

import * as taskApi from '../../../src/api/tasks';

const listTasksMock = vi.mocked(taskApi.listTasks);

const NOW = new Date('2026-04-30T12:00:00Z').getTime();

const SAMPLE_USERS: UserSummary[] = [
  { id: 'u1', name: 'Alice Admin', email: 'alice@monash.edu', role: 'ADMIN' },
  { id: 'u2', name: 'Mark Member', email: 'mark@monash.edu', role: 'MEMBER' },
];

function buildTask(overrides: Partial<Task> = {}): Task {
  return {
    id: overrides.id ?? 't1',
    title: overrides.title ?? 'Sample task',
    description: '',
    status: overrides.status ?? 'TODO',
    priority: overrides.priority ?? 'MEDIUM',
    assigneeId: overrides.assigneeId,
    dueDate: overrides.dueDate,
    createdBy: 'u1',
    tags: [],
    createdAt: '2026-04-01T00:00:00Z',
    updatedAt: '2026-04-01T00:00:00Z',
    ...overrides,
  };
}

function renderWithProviders(node: ReactNode, initialPath = '/') {
  const usersValue = {
    users: SAMPLE_USERS,
    loading: false,
    error: null,
    refresh: vi.fn().mockResolvedValue(undefined),
    lookup: (id: string | undefined | null) =>
      id ? SAMPLE_USERS.find(u => u.id === id) : undefined,
    displayName: (id: string | undefined | null, fallback = 'Unassigned') => {
      if (!id) return fallback;
      return SAMPLE_USERS.find(u => u.id === id)?.name ?? id;
    },
  };
  return render(
    <MemoryRouter initialEntries={[initialPath]}>
      <ToastContext.Provider value={{ show: vi.fn() }}>
        <UsersContext.Provider value={usersValue}>
          <Routes>
            <Route path="/" element={node} />
            <Route path="/tasks/:id" element={<div>Task detail for navigation</div>} />
          </Routes>
        </UsersContext.Provider>
      </ToastContext.Provider>
    </MemoryRouter>,
  );
}

describe('UpcomingReminders', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('renders due-soon and overdue tasks with assignee names', async () => {
    listTasksMock.mockResolvedValue({
      data: [
        buildTask({
          id: 't-due-soon',
          title: 'Submit budget',
          assigneeId: 'u1',
          dueDate: new Date(NOW + 6 * 60 * 60 * 1000).toISOString(),
        }),
        buildTask({
          id: 't-overdue',
          title: 'Confirm venue',
          assigneeId: 'u2',
          dueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ],
    });

    renderWithProviders(<UpcomingReminders />);

    expect(await screen.findByText('Submit budget')).toBeInTheDocument();
    expect(screen.getByText('Confirm venue')).toBeInTheDocument();
    expect(screen.getByText(/Alice Admin/)).toBeInTheDocument();
    expect(screen.getByText(/Mark Member/)).toBeInTheDocument();
  });

  it('shows the Overdue badge only on tasks past their due date', async () => {
    listTasksMock.mockResolvedValue({
      data: [
        buildTask({
          id: 't-due-soon',
          title: 'Submit budget',
          dueDate: new Date(NOW + 6 * 60 * 60 * 1000).toISOString(),
        }),
        buildTask({
          id: 't-overdue',
          title: 'Confirm venue',
          dueDate: new Date(NOW - 2 * 24 * 60 * 60 * 1000).toISOString(),
        }),
      ],
    });

    renderWithProviders(<UpcomingReminders />);

    await screen.findByText('Submit budget');

    const overdueBadges = screen.getAllByText('Overdue');
    expect(overdueBadges).toHaveLength(1);

    const overdueRow = screen.getByText('Confirm venue').closest('a');
    expect(overdueRow).not.toBeNull();
    expect(overdueRow).toContainElement(overdueBadges[0]);
  });

  it('hides DONE tasks and tasks without a due date', async () => {
    listTasksMock.mockResolvedValue({
      data: [
        buildTask({
          id: 't-due-soon',
          title: 'Submit budget',
          dueDate: new Date(NOW + 6 * 60 * 60 * 1000).toISOString(),
        }),
        buildTask({
          id: 't-done',
          title: 'Already finished',
          status: 'DONE',
          dueDate: new Date(NOW - 1 * 24 * 60 * 60 * 1000).toISOString(),
        }),
        buildTask({
          id: 't-no-due',
          title: 'No due date set',
        }),
      ],
    });

    renderWithProviders(<UpcomingReminders />);

    expect(await screen.findByText('Submit budget')).toBeInTheDocument();
    expect(screen.queryByText('Already finished')).not.toBeInTheDocument();
    expect(screen.queryByText('No due date set')).not.toBeInTheDocument();
  });

  it('renders the empty-state copy when no actionable tasks come back', async () => {
    listTasksMock.mockResolvedValue({ data: [] });

    renderWithProviders(<UpcomingReminders />);

    expect(
      await screen.findByText('Nothing due in the next 24 hours.'),
    ).toBeInTheDocument();
  });

  it('navigates to the task detail page when a row is clicked', async () => {
    listTasksMock.mockResolvedValue({
      data: [
        buildTask({
          id: 'abc-123',
          title: 'Submit budget',
          dueDate: new Date(NOW + 6 * 60 * 60 * 1000).toISOString(),
        }),
      ],
    });

    renderWithProviders(<UpcomingReminders />);

    const link = await screen.findByRole('link', { name: /Submit budget/ });
    expect(link).toHaveAttribute('href', '/tasks/abc-123');

    const user = userEvent.setup();
    await user.click(link);

    await waitFor(() =>
      expect(screen.getByText('Task detail for navigation')).toBeInTheDocument(),
    );
  });

  it('queries the API with a 24-hour-ahead window and 30-day lookback', async () => {
    listTasksMock.mockResolvedValue({ data: [] });

    renderWithProviders(<UpcomingReminders />);

    await screen.findByText('Nothing due in the next 24 hours.');

    expect(listTasksMock).toHaveBeenCalledTimes(1);
    const args = listTasksMock.mock.calls[0][0]!;
    expect(args.dueAfter).toBe(new Date(NOW - 30 * 24 * 60 * 60 * 1000).toISOString());
    expect(args.dueBefore).toBe(new Date(NOW + 24 * 60 * 60 * 1000).toISOString());
    expect(args.limit).toBe(100);
  });
});
