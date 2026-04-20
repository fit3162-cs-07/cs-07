import { forwardRef, type InputHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  invalid?: boolean;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { invalid = false, className, ...rest },
  ref,
) {
  return (
    <input
      ref={ref}
      className={cn(
        'block w-full h-9 px-3 text-base text-ink bg-surface border rounded-md placeholder:text-muted',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
        invalid ? 'border-error' : 'border-border',
        className,
      )}
      {...rest}
    />
  );
});
