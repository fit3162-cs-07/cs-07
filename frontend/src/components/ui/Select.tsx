import { forwardRef, type SelectHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  invalid?: boolean;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { invalid = false, className, children, ...rest },
  ref,
) {
  return (
    <select
      ref={ref}
      className={cn(
        'block w-full h-9 px-3 text-base text-ink bg-surface border rounded-md',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
        invalid ? 'border-error' : 'border-border',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});
