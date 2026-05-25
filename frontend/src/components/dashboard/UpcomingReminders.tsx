import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardSubtitle, CardTitle } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Skeleton } from '../ui/Skeleton';
import * as taskApi from '../../api/tasks';
import { useToast } from '../../hooks/useToast';
import { useUsers } from '../../hooks/useUsers';
import { relativeDeadline } from '../../lib/format';
import type { Task } from '../../api/types';

const HOURS_24_MS = 24 * 60 * 60 * 1000;
const DAYS_30_MS = 30 * 24 * 60 * 60 * 1000;

export function UpcomingReminders() {
  const { show } = useToast();
  const { displayName } = useUsers();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const now = Date.now();
    const dueAfter = new Date(now - DAYS_30_MS).toISOString();
    const dueBefore = new Date(now + HOURS_24_MS).toISOString();

    (async () => {
      try {
        const res = await taskApi.listTasks({ dueAfter, dueBefore, limit: 100 });
        if (!cancelled) setTasks(res.data);
      } catch {
        if (!cancelled) show('Failed to load reminders', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [show]);

  const actionable = useMemo(() => {
    const now = Date.now();
    return tasks
      .filter(t => t.status !== 'DONE' && !!t.dueDate)
      .map(t => ({ task: t, overdue: new Date(t.dueDate!).getTime() < now }))
      .sort(
        (a, b) =>
          new Date(a.task.dueDate!).getTime() - new Date(b.task.dueDate!).getTime(),
      );
  }, [tasks]);

  return (
    <Card>
      <CardTitle>Upcoming reminders</CardTitle>
      <CardSubtitle>
        Tasks due in the next 24 hours, plus anything overdue from the last 30 days.
      </CardSubtitle>
      <div className="mt-4 flex flex-col">
        {loading ? (
          <RemindersSkeleton />
        ) : actionable.length === 0 ? (
          <p className="text-sm text-text-secondary py-4">
            Nothing due in the next 24 hours.
          </p>
        ) : (
          actionable.map(({ task, overdue }, idx) => (
            <ReminderRow
              key={task.id}
              task={task}
              overdue={overdue}
              assigneeName={displayName(task.assigneeId)}
              divider={idx > 0}
            />
          ))
        )}
      </div>
    </Card>
  );
}

function RemindersSkeleton() {
  return (
    <div className="flex flex-col" data-testid="reminders-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`py-3 flex items-center justify-between gap-3 ${
            i > 0 ? 'border-t border-border-default' : ''
          }`}
        >
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton width="55%" height={16} />
            <Skeleton width="35%" height={12} />
          </div>
          <Skeleton width={64} height={20} />
        </div>
      ))}
    </div>
  );
}

function ReminderRow({
  task,
  overdue,
  assigneeName,
  divider,
}: {
  task: Task;
  overdue: boolean;
  assigneeName: string;
  divider: boolean;
}) {
  return (
    <Link
      to={`/tasks/${task.id}`}
      className={`py-3 px-2 -mx-2 flex items-center justify-between gap-3 rounded-md hover:bg-surface-muted transition-colors duration-DEFAULT ease-DEFAULT ${
        divider ? 'border-t border-border-default' : ''
      }`}
    >
      <div className="min-w-0">
        <div className="text-base font-medium text-text-primary truncate">{task.title}</div>
        <div className="text-sm text-text-tertiary mt-0.5">
          {relativeDeadline(task.dueDate)} · {assigneeName}
        </div>
      </div>
      {overdue && <Badge tone="danger">Overdue</Badge>}
    </Link>
  );
}
