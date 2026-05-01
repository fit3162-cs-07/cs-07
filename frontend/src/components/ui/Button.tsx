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
  'inline-flex items-center justify-center gap-2 font-medium rounded-md transition-colors duration-DEFAULT ease-DEFAULT disabled:cursor-not-allowed select-none';

const sizes: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-sm',
  md: 'h-9 px-4 text-base',
};

const variants: Record<ButtonVariant, string> = {
  primary:
    'bg-primary text-text-on-primary hover:bg-primary-hover active:bg-primary-pressed disabled:bg-primary disabled:text-text-on-primary/70',
  secondary:
    'bg-surface text-text-primary border border-border-default hover:border-border-strong hover:bg-surface-muted disabled:text-text-tertiary disabled:hover:bg-surface disabled:hover:border-border-default',
  ghost:
    'bg-transparent text-text-secondary hover:bg-surface-muted hover:text-text-primary disabled:text-text-tertiary disabled:hover:bg-transparent',
  danger:
    'bg-danger text-text-on-primary hover:bg-danger/90 active:bg-danger/80 disabled:bg-danger disabled:text-text-on-primary/70',
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled,
    className,
    children,
    ...rest
  },
  ref,
) {
  const isDisabled = disabled || loading;
  return (
    <button
      ref={ref}
      className={cn(base, sizes[size], variants[variant], className)}
      disabled={isDisabled}
      aria-busy={loading || undefined}
      {...rest}
    >
      {loading && <Spinner />}
      <span className={loading ? 'opacity-90' : undefined}>
        {loading ? 'Working…' : children}
      </span>
    </button>
  );
});

function Spinner() {
  return (
    <svg
      aria-hidden
      viewBox="0 0 16 16"
      className="h-3.5 w-3.5 animate-spin"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <circle cx="8" cy="8" r="6" className="opacity-25" />
      <path d="M14 8a6 6 0 0 0-6-6" />
    </svg>
  );
}
