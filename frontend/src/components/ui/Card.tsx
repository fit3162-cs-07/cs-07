import type { HTMLAttributes, ReactNode } from 'react';
import { cn } from '../../lib/cn';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  padded?: boolean;
  compact?: boolean;
  interactive?: boolean;
}

export function Card({
  padded = true,
  compact = false,
  interactive = false,
  className,
  children,
  ...rest
}: CardProps) {
  return (
    <div
      className={cn(
        'bg-surface border border-border-default rounded-lg',
        padded && (compact ? 'p-4' : 'p-6'),
        interactive &&
          'transition-shadow duration-DEFAULT ease-DEFAULT hover:border-border-strong hover:shadow-sm',
        className,
      )}
      {...rest}
    >
      {children}
    </div>
  );
}

export function CardHeader({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn('mb-4 flex items-center justify-between gap-4', className)}>{children}</div>
  );
}

export function CardTitle({ children }: { children: ReactNode }) {
  return <h3 className="text-h3 font-semibold text-text-primary">{children}</h3>;
}

export function CardSubtitle({ children }: { children: ReactNode }) {
  return <p className="text-sm text-text-secondary mt-1">{children}</p>;
}
