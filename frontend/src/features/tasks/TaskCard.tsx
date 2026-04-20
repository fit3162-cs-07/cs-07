import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { PriorityBadge } from '../../components/ui/Badge';
import { relativeDeadline } from '../../lib/format';
import { cn } from '../../lib/cn';
import type { Task } from '../../api/types';

export interface TaskCardProps {
  task: Task;
  variant?: 'list' | 'compact';
  className?: string;
}

export function TaskCard({ task, variant = 'list', className }: TaskCardProps) {
  if (variant === 'compact') {
    return (
      <div className={cn('bg-surface border border-border rounded-md p-3 shadow-sm', className)}>
        <div className="text-base font-medium text-ink mb-2">{task.title}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-sm text-muted">{relativeDeadline(task.dueDate)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card padded={false} className={cn('hover:bg-primary-soft transition-colors', className)}>
      <Link to={`/tasks/${task.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-base font-semibold text-ink flex-1">{task.title}</h3>
          <PriorityBadge priority={task.priority} />
        </div>
        {task.description && (
          <p className="text-sm text-muted line-clamp-2 mb-3">{task.description}</p>
        )}
        <div className="flex items-center gap-3 text-sm text-muted">
          {task.dueDate && <span>{relativeDeadline(task.dueDate)}</span>}
          {task.assigneeId && <span>· Assigned</span>}
          {task.tags && task.tags.length > 0 && <span>· {task.tags.length} tags</span>}
        </div>
      </Link>
    </Card>
  );
}
