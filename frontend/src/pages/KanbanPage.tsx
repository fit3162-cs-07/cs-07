import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  DndContext,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Calendar, ArrowUpRight } from 'lucide-react';
import { PageHeader } from '../components/ui/PageHeader';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { PriorityBadge } from '../components/ui/Badge';
import { Skeleton } from '../components/ui/Skeleton';
import { TaskFilters } from '../features/tasks/TaskFilters';
import { TaskFormModal } from '../features/tasks/TaskFormModal';
import { useAuth } from '../hooks/useAuth';
import { useToast } from '../hooks/useToast';
import { useUsers } from '../hooks/useUsers';
import { ApiError } from '../api/client';
import * as taskApi from '../api/tasks';
import type { Task, TaskFilterInput, TaskStatus } from '../api/types';
import { relativeDeadline } from '../lib/format';
import { cn } from '../lib/cn';

const COLUMNS: { key: TaskStatus; label: string; dotClass: string }[] = [
  { key: 'TODO', label: 'To Do', dotClass: 'bg-text-tertiary' },
  { key: 'IN_PROGRESS', label: 'In Progress', dotClass: 'bg-primary' },
  { key: 'DONE', label: 'Done', dotClass: 'bg-success' },
];

export function KanbanPage() {
  const { user, isAdmin } = useAuth();
  const { show } = useToast();
  const { displayName } = useUsers();
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }));

  const [filter, setFilter] = useState<TaskFilterInput>({});
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await taskApi.listTasks({ ...filter, limit: 200 });
      setTasks(res.data);
    } catch {
      show('Failed to load tasks', 'error');
    } finally {
      setLoading(false);
    }
  }, [filter, show]);

  useEffect(() => {
    load();
  }, [load]);

  const grouped = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = { TODO: [], IN_PROGRESS: [], DONE: [] };
    for (const t of tasks) map[t.status].push(t);
    return map;
  }, [tasks]);

  const canDrag = useCallback(
    (task: Task) =>
      isAdmin || (!!user && (task.assigneeId === user.id || task.createdBy === user.id)),
    [isAdmin, user],
  );

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over) return;
    const targetStatus = over.id as TaskStatus;
    const task = tasks.find(t => t.id === active.id);
    if (!task || task.status === targetStatus) return;
    if (!canDrag(task)) {
      show('You can only move your own tasks', 'error');
      return;
    }

    const previous = tasks;
    setTasks(curr =>
      curr.map(t => (t.id === task.id ? { ...t, status: targetStatus } : t)),
    );
    try {
      await taskApi.changeStatus(task.id, targetStatus);
    } catch (err) {
      setTasks(previous);
      const msg = err instanceof ApiError ? err.message : 'Move failed';
      show(msg, 'error');
    }
  };

  return (
    <>
      <PageHeader
        title="Kanban board"
        description={loading ? 'Loading…' : `${tasks.length} tasks across the board`}
        actions={isAdmin && <Button onClick={() => setCreateOpen(true)}>New task</Button>}
      />

      <div className="mb-4">
        <TaskFilters
          value={filter}
          onChange={setFilter}
          onClear={() => setFilter({})}
          layout="bar"
        />
      </div>

      {loading ? (
        <div
          className="grid grid-cols-1 md:grid-cols-3 gap-4"
          data-testid="kanban-skeleton"
        >
          {COLUMNS.map(col => (
            <KanbanColumnSkeleton key={col.key} label={col.label} />
          ))}
        </div>
      ) : (
        <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {COLUMNS.map(col => (
              <KanbanColumn
                key={col.key}
                status={col.key}
                label={col.label}
                dotClass={col.dotClass}
                tasks={grouped[col.key]}
                canDrag={canDrag}
                displayName={displayName}
              />
            ))}
          </div>
        </DndContext>
      )}

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

function KanbanColumnSkeleton({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-border-default bg-surface-subtle p-3 min-h-[420px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
          {label}
        </h3>
        <Skeleton width={20} height={14} />
      </div>
      <div className="flex flex-col gap-2.5">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} padded={false} className="p-3.5 flex flex-col gap-2 shadow-card">
            <Skeleton width="85%" height={16} />
            <div className="flex items-center justify-between">
              <Skeleton width={56} height={20} />
              <Skeleton width={64} height={12} />
            </div>
            <Skeleton width="50%" height={12} />
          </Card>
        ))}
      </div>
    </div>
  );
}

function KanbanColumn({
  status,
  label,
  dotClass,
  tasks,
  canDrag,
  displayName,
}: {
  status: TaskStatus;
  label: string;
  dotClass: string;
  tasks: Task[];
  canDrag(task: Task): boolean;
  displayName(id: string | undefined | null): string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-xl border p-3 min-h-[420px] transition-colors duration-DEFAULT ease-DEFAULT',
        isOver
          ? 'border-primary border-2 bg-primary-subtle'
          : 'border-border-default bg-surface-subtle',
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <span className={cn('h-2 w-2 rounded-full', dotClass)} aria-hidden />
          <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wider">
            {label}
          </h3>
        </div>
        <span className="text-xs text-text-tertiary font-semibold tabular-nums px-1.5 py-0.5 rounded-md bg-surface border border-border-default">
          {tasks.length}
        </span>
      </div>
      <div className="flex flex-col gap-2.5">
        {tasks.length === 0 && (
          <div className="text-xs text-text-tertiary px-1 py-3 italic">No tasks here yet.</div>
        )}
        {tasks.map(task => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            draggable={canDrag(task)}
            assigneeName={displayName(task.assigneeId)}
            dotClass={dotClass}
          />
        ))}
      </div>
    </div>
  );
}

function DraggableTaskCard({
  task,
  draggable,
  assigneeName,
  dotClass,
}: {
  task: Task;
  draggable: boolean;
  assigneeName: string;
  dotClass: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;
  const initials = assigneeName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map(s => s[0]?.toUpperCase() ?? '')
    .join('');

  return (
    <Card
      padded={false}
      className={cn(
        'p-3.5 shadow-card transition-all duration-DEFAULT ease-DEFAULT hover:shadow-md hover:-translate-y-px',
        isDragging && 'opacity-50 shadow-lg',
        !draggable ? 'cursor-not-allowed' : 'cursor-grab active:cursor-grabbing',
      )}
    >
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="flex items-start gap-2 mb-2.5">
          <span
            className={cn('h-2 w-2 rounded-full mt-1.5 shrink-0', dotClass)}
            aria-hidden
          />
          <div className="text-sm font-semibold text-text-primary line-clamp-2 leading-snug">
            {task.title}
          </div>
        </div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-text-tertiary inline-flex items-center gap-1 font-medium">
              <Calendar className="h-3 w-3" strokeWidth={2} aria-hidden />
              {relativeDeadline(task.dueDate)}
            </span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2 pt-2.5 border-t border-border-default">
          <div className="flex items-center gap-1.5 min-w-0">
            {assigneeName !== 'Unassigned' && initials ? (
              <span className="h-5 w-5 rounded-full bg-primary-subtle text-primary text-[10px] font-bold inline-flex items-center justify-center shrink-0">
                {initials}
              </span>
            ) : (
              <span className="h-5 w-5 rounded-full border border-dashed border-border-strong inline-flex items-center justify-center shrink-0">
                <span className="h-1 w-1 rounded-full bg-text-tertiary" />
              </span>
            )}
            <span className="text-xs text-text-secondary font-medium truncate">
              {assigneeName}
            </span>
          </div>
        </div>
      </div>
      <Link
        to={`/tasks/${task.id}`}
        className="text-xs text-primary font-semibold mt-2.5 inline-flex items-center gap-1 hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
      >
        Open <ArrowUpRight className="h-3 w-3" strokeWidth={2.25} aria-hidden />
      </Link>
    </Card>
  );
}
