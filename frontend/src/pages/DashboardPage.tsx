import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Card, CardSubtitle, CardTitle } from '../components/ui/Card';
import { PageHeader } from '../components/ui/PageHeader';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { UpcomingReminders } from '../components/dashboard/UpcomingReminders';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import * as taskApi from '../api/tasks';
import * as auditApi from '../api/audit';
import type { AuditEntry, Task } from '../api/types';
import { formatDateTime, daysUntil, relativeDeadline } from '../lib/format';

export function DashboardPage() {
  const { user, isAdmin } = useAuth();
  const { show } = useToast();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        const [tasksRes, auditRes] = await Promise.all([
          taskApi.listTasks(),
          isAdmin ? auditApi.listAudit() : Promise.resolve([] as AuditEntry[]),
        ]);
        if (cancelled) return;
        setTasks(tasksRes.data);
        setAudit(auditRes);
      } catch {
        if (!cancelled) show('Failed to load dashboard', 'error');
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [isAdmin, show]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const dueThisWeek = tasks.filter(t => {
      if (!t.dueDate || t.status === 'DONE') return false;
      const days = daysUntil(t.dueDate);
      return days !== null && days >= 0 && days <= 7;
    }).length;
    return { total, inProgress, dueThisWeek };
  }, [tasks]);

  const recentTasks = useMemo(
    () =>
      [...tasks]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, 5),
    [tasks],
  );

  return (
    <>
      <PageHeader
        title={`Welcome back, ${user?.name.split(' ')[0] ?? 'there'}`}
        description="Snapshot of what's happening across your club's tasks."
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <StatCard label="Total tasks" value={stats.total} loading={loading} to="/tasks" />
        <StatCard label="Due this week" value={stats.dueThisWeek} loading={loading} to="/tasks" />
        <StatCard label="In progress" value={stats.inProgress} loading={loading} to="/kanban" />
      </div>

      <div className="mb-6">
        <UpcomingReminders />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardTitle>Recent tasks</CardTitle>
          <CardSubtitle>Latest five tasks by creation date.</CardSubtitle>
          <div className="mt-4 flex flex-col">
            {loading ? (
              <RecentTasksSkeleton />
            ) : recentTasks.length === 0 ? (
              <EmptyState
                title="No tasks yet"
                description="Create your first task to get started."
              />
            ) : (
              recentTasks.map((t, idx) => (
                <Link
                  key={t.id}
                  to={`/tasks/${t.id}`}
                  className={`py-3 px-2 -mx-2 flex items-center justify-between rounded-md hover:bg-surface-muted transition-colors duration-DEFAULT ease-DEFAULT ${
                    idx > 0 ? 'border-t border-border-default' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <div className="text-base font-medium text-text-primary truncate">
                      {t.title}
                    </div>
                    <div className="text-sm text-text-tertiary mt-0.5">
                      {relativeDeadline(t.dueDate)}
                    </div>
                  </div>
                  <span className="text-sm text-text-secondary shrink-0 ml-3">
                    {t.status === 'IN_PROGRESS'
                      ? 'In Progress'
                      : t.status === 'TODO'
                        ? 'To Do'
                        : 'Done'}
                  </span>
                </Link>
              ))
            )}
          </div>
        </Card>

        <Card>
          <CardTitle>Activity</CardTitle>
          <CardSubtitle>
            {isAdmin
              ? 'Latest events from the audit log.'
              : 'Sign in as an admin to see the audit feed.'}
          </CardSubtitle>
          <div className="mt-4 flex flex-col divide-y divide-border-default">
            {!isAdmin ? (
              <p className="text-sm text-text-secondary py-4">
                No activity available for your role.
              </p>
            ) : loading ? (
              <ActivitySkeleton />
            ) : audit.length === 0 ? (
              <p className="text-sm text-text-secondary py-4">No recorded events yet.</p>
            ) : (
              audit
                .slice(-10)
                .reverse()
                .map((e, idx) => (
                  <div key={`${e.timestamp}-${idx}`} className="py-3">
                    <div className="text-sm text-text-primary">{formatEvent(e)}</div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      {formatDateTime(e.timestamp)}
                    </div>
                  </div>
                ))
            )}
          </div>
        </Card>
      </div>
    </>
  );
}

function StatCard({
  label,
  value,
  loading,
  to,
}: {
  label: string;
  value: number | string;
  loading?: boolean;
  to: string;
}) {
  return (
    <Link to={to} className="block group">
      <Card interactive>
        <div className="text-sm text-text-secondary font-medium">{label}</div>
        {loading ? (
          <Skeleton className="mt-2" width={64} height={32} label={`Loading ${label}`} />
        ) : (
          <div className="text-display font-semibold text-text-primary mt-2 tracking-tight">
            {value}
          </div>
        )}
      </Card>
    </Link>
  );
}

function RecentTasksSkeleton() {
  return (
    <div className="flex flex-col" data-testid="recent-tasks-skeleton">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className={`py-3 flex items-center justify-between gap-3 ${
            i > 0 ? 'border-t border-border-default' : ''
          }`}
        >
          <div className="flex-1 flex flex-col gap-2">
            <Skeleton width="60%" height={16} />
            <Skeleton width="40%" height={12} />
          </div>
          <Skeleton width={64} height={12} />
        </div>
      ))}
    </div>
  );
}

function ActivitySkeleton() {
  return (
    <div className="flex flex-col" data-testid="activity-skeleton">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="py-3 flex flex-col gap-2">
          <Skeleton width="70%" height={16} />
          <Skeleton width="30%" height={12} />
        </div>
      ))}
    </div>
  );
}

function formatEvent(e: AuditEntry): string {
  const title = typeof e.payload?.title === 'string' ? ` "${e.payload.title}"` : '';
  switch (e.eventType) {
    case 'TaskCreated':
      return `Task created${title}`;
    case 'TaskAssigned':
      return `Task assigned${title}`;
    case 'TaskStatusChanged':
      return `Task status changed${title}`;
    case 'TaskDeleted':
      return `Task deleted${title}`;
    case 'TaskReminderDue':
      return `Reminder due${title}`;
    default:
      return e.eventType;
  }
}
