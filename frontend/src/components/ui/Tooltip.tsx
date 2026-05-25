import { useId, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

type TooltipSide = 'top' | 'bottom';

export interface TooltipProps {
  label: string;
  side?: TooltipSide;
  className?: string;
  children: ReactNode;
}

export function Tooltip({ label, side = 'top', className, children }: TooltipProps) {
  const id = useId();
  const position =
    side === 'top'
      ? 'bottom-full mb-2 left-1/2 -translate-x-1/2'
      : 'top-full mt-2 left-1/2 -translate-x-1/2';

  return (
    <span className={cn('relative inline-flex group', className)}>
      <span aria-describedby={id}>{children}</span>
      <span
        id={id}
        role="tooltip"
        className={cn(
          'pointer-events-none absolute z-40 whitespace-nowrap',
          'px-2 py-1 rounded-md text-xs font-medium',
          'bg-text-primary text-text-on-primary',
          'opacity-0 transition-opacity duration-DEFAULT ease-DEFAULT',
          'group-hover:opacity-100 group-focus-within:opacity-100',
          position,
        )}
      >
        {label}
      </span>
    </span>
  );
}
