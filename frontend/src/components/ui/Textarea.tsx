import { forwardRef, type TextareaHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

export interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  invalid?: boolean;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(function Textarea(
  { invalid = false, className, ...rest },
  ref,
) {
  return (
    <textarea
      ref={ref}
      className={cn(
        'block w-full px-3 py-2 text-base text-text-primary bg-surface border rounded-md placeholder:text-text-tertiary',
        'focus:outline-none focus:border-border-focus focus:ring-1 focus:ring-border-focus',
        'transition-colors duration-DEFAULT ease-DEFAULT',
        invalid ? 'border-danger' : 'border-border-default hover:border-border-strong',
        className,
      )}
      {...rest}
    />
  );
});
