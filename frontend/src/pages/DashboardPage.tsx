import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  ListTodo,
  Loader2,
  CheckCircle2,
  LayoutList,
  type LucideIcon,
} from 'lucide-react';
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
import { formatDateTime, relativeDeadline } from '../lib/format';
import { cn } from '../lib/cn';

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
    const todo = tasks.filter(t => t.status === 'TODO').length;
    const inProgress = tasks.filter(t => t.status === 'IN_PROGRESS').length;
    const done = tasks.filter(t => t.status === 'DONE').length;
    return { total, todo, inProgress, done };
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
        title={`Welcome back, ${user?.name ?? 'there'}`}
        description="Snapshot of what's happening across your club's tasks."
      />

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-8">
        <StatCard
          label="Total tasks"
          value={stats.total}
          icon={LayoutList}
          tone="primary"
          loading={loading}
          to="/tasks"
        />
        <StatCard
          label="To do"
          value={stats.todo}
          icon={ListTodo}
          tone="neutral"
          loading={loading}
          to="/tasks"
        />
        <StatCard
          label="In progress"
          value={stats.inProgress}
          icon={Loader2}
          tone="warning"
          loading={loading}
          to="/kanban"
        />
        <StatCard
          label="Done"
          value={stats.done}
          icon={CheckCircle2}
          tone="success"
          loading={loading}
          to="/tasks"
        />
      </div>

      <div className="mb-6">
        <UpcomingReminders />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="shadow-card">
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
                    <div className="text-sm font-semibold text-text-primary truncate">
                      {t.title}
                    </div>
                    <div className="text-xs text-text-tertiary mt-0.5">
                      {relativeDeadline(t.dueDate)}
                    </div>
                  </div>
                  <span className="text-xs text-text-secondary font-medium shrink-0 ml-3">
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

        <Card className="shadow-card">
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

type StatTone = 'primary' | 'success' | 'warning' | 'neutral';

const statToneClasses: Record<StatTone, string> = {
  primary: 'bg-primary-subtle text-primary',
  success: 'bg-success-subtle text-success',
  warning: 'bg-warning-subtle text-warning',
  neutral: 'bg-surface-muted text-text-secondary',
};

function StatCard({
  label,
  value,
  icon: Icon,
  tone,
  loading,
  to,
}: {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone: StatTone;
  loading?: boolean;
  to: string;
}) {
  return (
    <Link to={to} className="block group">
      <Card
        interactive
        compact
        className="shadow-card group-hover:shadow-sm group-hover:-translate-y-px transition-all duration-DEFAULT ease-DEFAULT"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="text-xs font-medium text-text-secondary uppercase tracking-wider">
              {label}
            </div>
            {loading ? (
              <Skeleton className="mt-2" width={48} height={28} label={`Loading ${label}`} />
            ) : (
              <div className="text-3xl font-bold text-text-primary mt-1.5 tracking-tight tabular-nums">
                {value}
              </div>
            )}
          </div>
          <div
            className={cn(
              'h-10 w-10 rounded-lg flex items-center justify-center shrink-0',
              statToneClasses[tone],
            )}
          >
            <Icon className="h-5 w-5" strokeWidth={1.75} aria-hidden />
          </div>
        </div>
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
