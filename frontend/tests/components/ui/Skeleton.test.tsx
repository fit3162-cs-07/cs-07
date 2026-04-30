import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Skeleton, SkeletonText } from '../../../src/components/ui/Skeleton';

describe('Skeleton', () => {
  it('exposes status role with default Loading label', () => {
    render(<Skeleton />);
    expect(screen.getByRole('status', { name: 'Loading' })).toBeInTheDocument();
  });

  it('applies width and height as inline styles', () => {
    render(<Skeleton width={80} height={20} label="bar" />);
    const node = screen.getByRole('status', { name: 'bar' });
    expect(node).toHaveStyle({ width: '80px', height: '20px' });
  });

  it('accepts string dimensions and aria-busy', () => {
    render(<Skeleton width="50%" label="row" />);
    const node = screen.getByRole('status', { name: 'row' });
    expect(node).toHaveStyle({ width: '50%' });
    expect(node).toHaveAttribute('aria-busy', 'true');
  });

  it('applies the rounded shape class for circles', () => {
    render(<Skeleton shape="circle" label="avatar" />);
    expect(screen.getByRole('status', { name: 'avatar' })).toHaveClass('rounded-full');
  });
});

describe('SkeletonText', () => {
  it('renders the requested number of lines plus the wrapper status', () => {
    render(<SkeletonText lines={4} />);
    const all = screen.getAllByRole('status');
    expect(all).toHaveLength(5); // 1 wrapper + 4 lines
  });

  it('defaults to three lines when lines prop is omitted', () => {
    render(<SkeletonText />);
    expect(screen.getAllByRole('status')).toHaveLength(4);
  });
});
