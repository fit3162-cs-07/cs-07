import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { TaskPriority, TaskStatus } from '../../api/types';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'soft';

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-surface-muted text-text-secondary border border-border-default',
  primary: 'bg-primary-subtle text-primary border border-primary-subtle',
  success: 'bg-success-subtle text-success border border-success-subtle',
  warning: 'bg-warning-subtle text-warning border border-warning-subtle',
  danger: 'bg-danger-subtle text-danger border border-danger-subtle',
  soft: 'bg-surface-muted text-text-primary border border-border-default',
};

export interface BadgeProps {
  tone?: BadgeTone;
  className?: string;
  children: ReactNode;
}

export function Badge({ tone = 'neutral', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center h-5 px-2 rounded-sm text-xs font-medium whitespace-nowrap',
        toneStyles[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

const statusLabel: Record<TaskStatus, string> = {
  TODO: 'To Do',
  IN_PROGRESS: 'In Progress',
  DONE: 'Done',
};

const statusTone: Record<TaskStatus, BadgeTone> = {
  TODO: 'neutral',
  IN_PROGRESS: 'primary',
  DONE: 'success',
};

export function StatusBadge({ status }: { status: TaskStatus }) {
  return <Badge tone={statusTone[status]}>{statusLabel[status]}</Badge>;
}

const priorityLabel: Record<TaskPriority, string> = {
  LOW: 'Low',
  MEDIUM: 'Medium',
  HIGH: 'High',
};

const priorityTone: Record<TaskPriority, BadgeTone> = {
  LOW: 'neutral',
  MEDIUM: 'soft',
  HIGH: 'warning',
};

export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <Badge tone={priorityTone[priority]}>{priorityLabel[priority]}</Badge>;
}
