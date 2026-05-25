import { forwardRef, type ButtonHTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
}

const base =
  'inline-flex items-center justify-center font-medium rounded-md transition-colors duration-DEFAULT ease-DEFAULT disabled:opacity-50 disabled:cursor-not-allowed select-none';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-base',
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-text-on-primary hover:bg-primary-hover active:bg-primary-pressed',
  secondary:
    'bg-surface text-text-primary border border-border-default hover:border-border-strong hover:bg-surface-muted',
  ghost: 'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary',
  danger: 'bg-danger text-text-on-primary hover:bg-danger/90 active:bg-danger/80',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading = false, disabled, className, children, ...rest },
  ref,
) {
  return (
    <button
      ref={ref}
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={disabled || loading}
      {...rest}
    >
      {loading ? 'Working…' : children}
    </button>
  );
});
