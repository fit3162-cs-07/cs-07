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
        'block w-full px-3 py-2 text-base text-ink bg-surface border rounded-md placeholder:text-muted',
        'focus:outline-none focus:ring-2 focus:ring-accent focus:border-accent',
        invalid ? 'border-error' : 'border-border',
        className,
      )}
      {...rest}
    />
  );
});
