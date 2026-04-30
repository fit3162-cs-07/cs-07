import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { PageHeader } from '../components/ui/PageHeader';
import { Card, CardSubtitle, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Select } from '../components/ui/Select';
import { Field } from '../components/ui/Field';
import { StatusBadge, PriorityBadge } from '../components/ui/Badge';
import { EmptyState } from '../components/ui/EmptyState';
import { TaskFormModal } from '../features/tasks/TaskFormModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useUsers } from '../hooks/useUsers';
import { ApiError } from '../api/client';
import * as taskApi from '../api/tasks';
import * as auditApi from '../api/audit';
import type { AuditEntry, Task, TaskStatus } from '../api/types';
import { formatDate, formatDateTime } from '../lib/format';

export function TaskDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, isAdmin } = useAuth();
  const { show } = useToast();
  const { displayName } = useUsers();
  const [task, setTask] = useState<Task | null>(null);
  const [audit, setAudit] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    try {
      const fetched = await taskApi.getTask(id);
      setTask(fetched);
      if (isAdmin) {
        const entries = await auditApi.listAudit();
        setAudit(entries.filter(e => e.aggregateId === id));
      }
    } catch (err) {
      if (err instanceof ApiError && err.status === 404) {
        setNotFound(true);
      } else {
        show('Failed to load task', 'error');
      }
    } finally {
      setLoading(false);
    }
  }, [id, isAdmin, show]);

  useEffect(() => {
    load();
  }, [load]);

  if (notFound) {
    return (
      <EmptyState
        title="Task not found"
        description="It may have been deleted or you don't have access."
        action={
          <Link to="/tasks">
            <Button variant="secondary">Back to tasks</Button>
          </Link>
        }
      />
    );
  }
  if (loading || !task) {
    return <p className="text-base text-muted">Loading…</p>;
  }

  const canChangeStatus = isAdmin || (user?.id !== undefined && (task.assigneeId === user.id || task.createdBy === user.id));
  const canEdit = isAdmin;

  const handleStatusChange = async (status: TaskStatus) => {
    try {
      const next = await taskApi.changeStatus(task.id, status);
      setTask(next);
      show('Status updated', 'success');
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Status change failed';
      show(msg, 'error');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task? This cannot be undone.')) return;
    try {
      await taskApi.deleteTask(task.id);
      show('Task deleted', 'success');
      navigate('/tasks', { replace: true });
    } catch (err) {
      const msg = err instanceof ApiError ? err.message : 'Delete failed';
      show(msg, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title={task.title}
        description={task.description || 'No description provided.'}
        actions={
          <>
            <Link to="/tasks">
              <Button variant="secondary">Back</Button>
            </Link>
            {canEdit && (
              <>
                <Button variant="secondary" onClick={() => setEditOpen(true)}>
                  Edit
                </Button>
                <Button variant="danger" onClick={handleDelete}>
                  Delete
                </Button>
              </>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 flex flex-col gap-6">
          <Card>
            <CardTitle>Details</CardTitle>
            <CardSubtitle>Created {formatDateTime(task.createdAt)} · Updated {formatDateTime(task.updatedAt)}</CardSubtitle>
            <dl className="mt-6 grid grid-cols-2 gap-4 text-base">
              <DetailRow label="Status">
                <StatusBadge status={task.status} />
              </DetailRow>
              <DetailRow label="Priority">
                <PriorityBadge priority={task.priority} />
              </DetailRow>
              <DetailRow label="Assignee">
                <span className="text-ink">{displayName(task.assigneeId)}</span>
              </DetailRow>
              <DetailRow label="Due date">
                <span className="text-ink">{formatDate(task.dueDate)}</span>
              </DetailRow>
              <DetailRow label="Tags" full>
                <span className="text-ink">
                  {task.tags && task.tags.length > 0 ? task.tags.join(', ') : '—'}
                </span>
              </DetailRow>
            </dl>
          </Card>

          {isAdmin && (
            <Card>
              <CardTitle>Activity</CardTitle>
              <CardSubtitle>Audit events recorded for this task.</CardSubtitle>
              <div className="mt-4 flex flex-col divide-y divide-border">
                {audit.length === 0 ? (
                  <p className="text-sm text-muted py-3">No events yet.</p>
                ) : (
                  audit
                    .slice()
                    .reverse()
                    .map((e, idx) => (
                      <div key={idx} className="py-3">
                        <div className="text-base text-ink">{e.eventType}</div>
                        <div className="text-sm text-muted">{formatDateTime(e.timestamp)} by {e.actor}</div>
                      </div>
                    ))
                )}
              </div>
            </Card>
          )}
        </div>

        <Card>
          <CardTitle>Quick actions</CardTitle>
          <CardSubtitle>Move this task forward.</CardSubtitle>
          <div className="mt-4 flex flex-col gap-3">
            <Field label="Status">
              <Select
                value={task.status}
                disabled={!canChangeStatus}
                onChange={e => handleStatusChange(e.target.value as TaskStatus)}
              >
                <option value="TODO">To Do</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="DONE">Done</option>
              </Select>
            </Field>
            {!canChangeStatus && (
              <p className="text-sm text-muted">
                Only admins, the creator, or the assignee can change status.
              </p>
            )}
          </div>
        </Card>
      </div>

      <TaskFormModal
        open={editOpen}
        task={task}
        onClose={() => setEditOpen(false)}
        onSaved={next => {
          setEditOpen(false);
          setTask(next);
          load();
        }}
      />
    </>
  );
}

function DetailRow({ label, children, full }: { label: string; children: React.ReactNode; full?: boolean }) {
  return (
    <div className={full ? 'col-span-2' : ''}>
      <dt className="text-sm text-muted mb-1">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
