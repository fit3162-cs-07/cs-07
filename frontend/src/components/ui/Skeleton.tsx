import type { CSSProperties, HTMLAttributes } from 'react';
import { cn } from '../../lib/cn';

type SkeletonShape = 'rect' | 'text' | 'circle';

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  width?: number | string;
  height?: number | string;
  shape?: SkeletonShape;
  label?: string;
}

const shapeClasses: Record<SkeletonShape, string> = {
  rect: 'rounded-md',
  text: 'rounded-sm h-4',
  circle: 'rounded-full',
};

export function Skeleton({
  width,
  height,
  shape = 'rect',
  label = 'Loading',
  className,
  style,
  ...rest
}: SkeletonProps) {
  const inline: CSSProperties = { ...style };
  if (width !== undefined) inline.width = typeof width === 'number' ? `${width}px` : width;
  if (height !== undefined) inline.height = typeof height === 'number' ? `${height}px` : height;

  return (
    <div
      role="status"
      aria-label={label}
      aria-busy="true"
      className={cn('bg-border-default animate-pulse', shapeClasses[shape], className)}
      style={inline}
      {...rest}
    />
  );
}

export function SkeletonText({
  lines = 3,
  className,
}: {
  lines?: number;
  className?: string;
}) {
  return (
    <div className={cn('flex flex-col gap-2', className)} role="status" aria-label="Loading">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          shape="text"
          width={i === lines - 1 ? '70%' : '100%'}
          label="Loading text"
        />
      ))}
    </div>
  );
}
