import { cn } from '../../lib/cn';

export interface LogoProps {
  size?: 'sm' | 'md' | 'lg';
  showWordmark?: boolean;
  className?: string;
}

const markSize: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'w-6 h-6 text-[11px]',
  md: 'w-8 h-8 text-sm',
  lg: 'w-10 h-10 text-base',
};

const wordSize: Record<NonNullable<LogoProps['size']>, string> = {
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
};

export function Logo({ size = 'md', showWordmark = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2 min-w-0', className)}>
      <div
        aria-hidden
        className={cn(
          'rounded-lg bg-primary text-text-on-primary flex items-center justify-center font-bold shrink-0 shadow-sm',
          markSize[size],
        )}
      >
        MC
      </div>
      {showWordmark && (
        <div className={cn('font-semibold tracking-tight truncate leading-none', wordSize[size])}>
          <span className="text-text-primary">Monash </span>
          <span className="text-primary">Club</span>
        </div>
      )}
    </div>
  );
}
