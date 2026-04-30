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
        actions={
          isAdmin && (
            <Button onClick={() => setCreateOpen(true)}>+ New task</Button>
          )
        }
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
              action={isAdmin && <Button onClick={() => setCreateOpen(true)}>+ New task</Button>}
            />
          ) : (
            <Card padded={false}>
              <div className="overflow-x-auto">
                <table className="w-full text-base">
                  <thead className="bg-page text-sm text-muted">
                    <tr className="text-left">
                      <th className="px-4 py-3 font-medium">Title</th>
                      <th className="px-4 py-3 font-medium">Status</th>
                      <th className="px-4 py-3 font-medium">Priority</th>
                      <th className="px-4 py-3 font-medium">Assignee</th>
                      <th className="px-4 py-3 font-medium">Due date</th>
                      <th className="px-4 py-3 font-medium">Tags</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tasks.map(t => (
                      <tr key={t.id} className="border-t border-border hover:bg-primary-soft">
                        <td className="px-4 py-3">
                          <Link to={`/tasks/${t.id}`} className="font-medium text-ink hover:text-primary">
                            {t.title}
                          </Link>
                        </td>
                        <td className="px-4 py-3"><StatusBadge status={t.status} /></td>
                        <td className="px-4 py-3"><PriorityBadge priority={t.priority} /></td>
                        <td className="px-4 py-3 text-muted">{displayName(t.assigneeId)}</td>
                        <td className="px-4 py-3 text-muted">{formatDate(t.dueDate)}</td>
                        <td className="px-4 py-3 text-muted text-sm">
                          {t.tags && t.tags.length > 0 ? t.tags.join(', ') : '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}

          {meta && totalPages > 1 && (
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted">
                Page {meta.page} of {totalPages}
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

function TaskTableSkeleton() {
  return (
    <Card padded={false} data-testid="tasks-skeleton">
      <div className="overflow-x-auto">
        <table className="w-full text-base">
          <thead className="bg-page text-sm text-muted">
            <tr className="text-left">
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Priority</th>
              <th className="px-4 py-3 font-medium">Assignee</th>
              <th className="px-4 py-3 font-medium">Due date</th>
              <th className="px-4 py-3 font-medium">Tags</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 5 }).map((_, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-4 py-3"><Skeleton width="80%" height={16} /></td>
                <td className="px-4 py-3"><Skeleton width={64} height={20} /></td>
                <td className="px-4 py-3"><Skeleton width={56} height={20} /></td>
                <td className="px-4 py-3"><Skeleton width="70%" height={16} /></td>
                <td className="px-4 py-3"><Skeleton width={72} height={16} /></td>
                <td className="px-4 py-3"><Skeleton width={48} height={16} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
