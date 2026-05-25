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
        'block w-full h-9 px-3 text-base text-text-primary bg-surface border rounded-md placeholder:text-text-tertiary',
        'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
        'transition-colors duration-DEFAULT ease-DEFAULT',
        invalid ? 'border-danger' : 'border-border-default hover:border-border-strong',
        className,
      )}
      {...rest}
    />
  );
});
