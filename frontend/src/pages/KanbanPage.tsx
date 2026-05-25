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

const COLUMNS: { key: TaskStatus; label: string }[] = [
  { key: 'TODO', label: 'To Do' },
  { key: 'IN_PROGRESS', label: 'In Progress' },
  { key: 'DONE', label: 'Done' },
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
    <div className="rounded-lg border border-border-default bg-surface p-3 min-h-[400px]">
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </h3>
        <Skeleton width={16} height={12} />
      </div>
      <div className="flex flex-col gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Card key={i} padded={false} className="p-3 flex flex-col gap-2">
            <Skeleton width="80%" height={16} />
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
  tasks,
  canDrag,
  displayName,
}: {
  status: TaskStatus;
  label: string;
  tasks: Task[];
  canDrag(task: Task): boolean;
  displayName(id: string | undefined | null): string;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: status });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        'rounded-lg border p-3 min-h-[400px] transition-colors duration-DEFAULT ease-DEFAULT',
        isOver
          ? 'border-primary bg-primary-subtle'
          : 'border-border-default bg-surface',
      )}
    >
      <div className="flex items-center justify-between mb-3 px-1">
        <h3 className="text-xs font-medium text-text-tertiary uppercase tracking-wider">
          {label}
        </h3>
        <span className="text-xs text-text-tertiary font-medium">{tasks.length}</span>
      </div>
      <div className="flex flex-col gap-2">
        {tasks.length === 0 && (
          <p className="text-sm text-text-tertiary px-1 py-2">No tasks</p>
        )}
        {tasks.map(task => (
          <DraggableTaskCard
            key={task.id}
            task={task}
            draggable={canDrag(task)}
            assigneeName={displayName(task.assigneeId)}
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
}: {
  task: Task;
  draggable: boolean;
  assigneeName: string;
}) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: task.id,
    disabled: !draggable,
  });
  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined;

  return (
    <Card
      padded={false}
      className={cn(
        'p-3 transition-shadow duration-DEFAULT ease-DEFAULT hover:border-border-strong hover:shadow-sm',
        isDragging && 'opacity-50',
        !draggable ? 'cursor-not-allowed' : 'cursor-grab',
      )}
    >
      <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
        <div className="text-sm font-medium text-text-primary mb-2 line-clamp-2">
          {task.title}
        </div>
        <div className="flex items-center justify-between gap-2">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-text-tertiary">{relativeDeadline(task.dueDate)}</span>
          )}
        </div>
        <div className="text-xs text-text-tertiary mt-2">{assigneeName}</div>
      </div>
      <Link
        to={`/tasks/${task.id}`}
        className="text-xs text-primary font-medium mt-2 inline-block hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
      >
        Open →
      </Link>
    </Card>
  );
}
