import type { ReactNode } from 'react';
import { cn } from '../../lib/cn';
import type { TaskPriority, TaskStatus } from '../../api/types';

type BadgeTone = 'neutral' | 'primary' | 'success' | 'warning' | 'error' | 'soft';

const toneStyles: Record<BadgeTone, string> = {
  neutral: 'bg-page text-muted border border-border',
  primary: 'bg-primary-soft text-primary border border-primary-soft',
  success: 'bg-primary-soft text-success border border-primary-soft',
  warning: 'bg-primary-soft text-warning border border-primary-soft',
  error: 'bg-primary-soft text-error border border-primary-soft',
  soft: 'bg-primary-soft text-ink border border-border',
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
        'inline-flex items-center h-6 px-2 rounded-full text-xs font-semibold whitespace-nowrap',
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
