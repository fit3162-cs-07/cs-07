import { Link } from 'react-router-dom';
import { Card } from '../../components/ui/Card';
import { PriorityBadge } from '../../components/ui/Badge';
import { relativeDeadline } from '../../lib/format';
import { cn } from '../../lib/cn';
import { useUsers } from '../../hooks/useUsers';
import type { Task } from '../../api/types';

export interface TaskCardProps {
  task: Task;
  variant?: 'list' | 'compact';
  className?: string;
}

export function TaskCard({ task, variant = 'list', className }: TaskCardProps) {
  const { displayName } = useUsers();

  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'bg-surface border border-border-default rounded-md p-3',
          className,
        )}
      >
        <div className="text-sm font-medium text-text-primary mb-2">{task.title}</div>
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={task.priority} />
          {task.dueDate && (
            <span className="text-xs text-text-tertiary">{relativeDeadline(task.dueDate)}</span>
          )}
        </div>
      </div>
    );
  }

  return (
    <Card
      padded={false}
      className={cn(
        'transition-shadow duration-DEFAULT ease-DEFAULT hover:border-border-strong hover:shadow-sm',
        className,
      )}
    >
      <Link to={`/tasks/${task.id}`} className="block p-4">
        <div className="flex items-start justify-between gap-4 mb-2">
          <h3 className="text-sm font-medium text-text-primary flex-1">{task.title}</h3>
          <PriorityBadge priority={task.priority} />
        </div>
        {task.description && (
          <p className="text-sm text-text-secondary line-clamp-2 mb-3">{task.description}</p>
        )}
        <div className="flex items-center gap-2 text-xs text-text-tertiary">
          {task.dueDate && <span>{relativeDeadline(task.dueDate)}</span>}
          {task.assigneeId && <span>· {displayName(task.assigneeId)}</span>}
          {task.tags && task.tags.length > 0 && <span>· {task.tags.length} tags</span>}
        </div>
      </Link>
    </Card>
  );
}
