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
        'block w-full h-9 px-3 text-base text-text-primary bg-surface border rounded-md',
        'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
        'transition-colors duration-DEFAULT ease-DEFAULT',
        invalid ? 'border-danger' : 'border-border-default hover:border-border-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </select>
  );
});
