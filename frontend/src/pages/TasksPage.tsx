import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { Skeleton } from '../components/ui/Skeleton';
import { TaskFilters } from '../features/tasks/TaskFilters';
import { TaskFormModal } from '../features/tasks/TaskFormModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useUsers } from '../hooks/useUsers';
import * as taskApi from '../api/tasks';
import type { PaginationMeta, Task, TaskFilterInput } from '../api/types';
import { formatDate } from '../lib/format';

const PAGE_SIZE = 20;

export function TasksPage() {
  const { isAdmin } = useAuth();
  const { show } = useToast();
  const { displayName } = useUsers();

  const [filter, setFilter] = useState<TaskFilterInput>({ page: 1, limit: PAGE_SIZE });
  const [tasks, setTasks] = useState<Task[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskApi.listTasks(filter);
      setTasks(res.data);
      setMeta(res.meta ?? null);
    } catch {
      show('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, show]);

  useEffect(() => {
    load();
  }, [load]);

  const totalLabel = useMemo(() => {
    if (meta) return `${meta.total} task${meta.total === 1 ? '' : 's'}`;
    return `${tasks.length} task${tasks.length === 1 ? '' : 's'}`;
  }, [meta, tasks]);

  const goToPage = (page: number) => setFilter(curr => ({ ...curr, page }));
  const totalPages = meta?.totalPages ?? 1;

  return (
    <>
      <PageHeader
        title="Tasks"
        description={totalLabel}
        actions={isAdmin && <Button onClick={() => setCreateOpen(true)}>New task</Button>}
      />

      <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6">
        <TaskFilters
          value={filter}
          onChange={next => setFilter({ ...next, page: 1, limit: PAGE_SIZE })}
          onClear={() => setFilter({ page: 1, limit: PAGE_SIZE })}
        />

        <div className="flex flex-col gap-4">
          {loading ? (
            <TaskTableSkeleton />
          ) : tasks.length === 0 ? (
            <EmptyState
              title="No tasks match"
              description="Try clearing the filters or creating a new task."
              action={
                isAdmin && <Button onClick={() => setCreateOpen(true)}>New task</Button>
              }
            />
          ) : (
            <Card padded={false} className="shadow-card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left bg-surface-subtle border-b border-border-default">
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Priority
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Assignee
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Due date
                      </th>
                      <th className="px-4 py-3 text-xs font-semibold text-text-secondary uppercase tracking-wider">
                        Tags
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map((t, idx) => {
                      const assigneeName = displayName(t.assigneeId);
                      return (
                        <tr
                          key={t.id}
                          className={`hover:bg-surface-subtle transition-colors duration-DEFAULT ease-DEFAULT ${
                            idx > 0 ? 'border-t border-border-default' : ''
                          }`}
                        >
                          <td className="px-4 py-3">
                            <Link
                              to={`/tasks/${t.id}`}
                              className="font-semibold text-text-primary hover:text-primary transition-colors duration-DEFAULT ease-DEFAULT"
                            >
                              {t.title}
                            </Link>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={t.status} />
                          </td>
                          <td className="px-4 py-3">
                            <PriorityBadge priority={t.priority} />
                          </td>
                          <td className="px-4 py-3">
                            <AssigneeCell name={assigneeName} />
                          </td>
                          <td className="px-4 py-3 text-text-secondary tabular-nums">
                            {formatDate(t.dueDate)}
                          </td>
                          <td className="px-4 py-3">
                            {t.tags && t.tags.length > 0 ? (
                              <div className="flex flex-wrap gap-1">
                                {t.tags.slice(0, 3).map(tag => (
                                  <span
                                    key={tag}
                                    className="inline-flex items-center px-1.5 h-5 rounded-md text-[11px] font-medium text-text-secondary bg-surface-muted"
                                  >
                                    {tag}
                                  </span>
                                ))}
                                {t.tags.length > 3 && (
                                  <span className="text-[11px] text-text-tertiary self-center">
                                    +{t.tags.length - 3}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="text-text-tertiary">—</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {meta && totalPages > 1 && (
            <div className="flex items-center justify-between bg-surface rounded-lg border border-border-default px-4 py-3 shadow-card">
              <span className="text-xs text-text-secondary font-medium">
                Page <span className="text-text-primary font-semibold">{meta.page}</span> of{' '}
                <span className="text-text-primary font-semibold">{totalPages}</span>
              </span>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  disabled={meta.page <= 1}
                  onClick={() => goToPage(meta.page - 1)}
                >
                  Previous
                </Button>
                <Button
                  variant="secondary"
                  disabled={meta.page >= totalPages}
                  onClick={() => goToPage(meta.page + 1)}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>

      <TaskFormModal
        open={createOpen}
        task={null}
        onClose={() => setCreateOpen(false)}
        onSaved={() => {
          setCreateOpen(false);
          load();
        }}
      />
    </>
  );
}

function AssigneeCell({ name }: { name: string }) {
  if (name === 'Unassigned') {
    return (
      <div className="flex items-center gap-2 min-w-0">
        <span className="h-6 w-6 rounded-full border border-dashed border-border-strong inline-flex items-center justify-center shrink-0">
          <span className="h-1 w-1 rounded-full bg-text-tertiary" />
        </span>
        <span className="text-text-tertiary truncate">Unassigned</span>
      </div>
    );
  }
  const initials =
    name
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map(s => s[0]?.toUpperCase() ?? '')
      .join('') || '?';
  return (
    <div className="flex items-center gap-2 min-w-0">
      <span className="h-6 w-6 rounded-full bg-primary-subtle text-primary text-[10px] font-bold inline-flex items-center justify-center shrink-0">
        {initials}
      </span>
      <span className="text-text-secondary truncate">{name}</span>
    </div>
  );
}

function TaskTableSkeleton() {
  return (
    <Card padded={false} data-testid="tasks-skeleton">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left border-b border-border-default">
              <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Title
              </th>
              <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Priority
              </th>
              <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Assignee
              </th>
              <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Due date
              </th>
              <th className="px-4 py-3 text-xs font-medium text-text-tertiary uppercase tracking-wider">
                Tags
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr
                key={i}
                className={i > 0 ? 'border-t border-border-default' : ''}
              >
                <td className="px-4 py-3">
                  <Skeleton width="80%" height={16} />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width={64} height={20} />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width={56} height={20} />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width="70%" height={16} />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width={72} height={16} />
                </td>
                <td className="px-4 py-3">
                  <Skeleton width={48} height={16} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
