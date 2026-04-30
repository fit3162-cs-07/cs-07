import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PageHeader } from '../../../src/components/ui/PageHeader';

describe('PageHeader', () => {
  it('renders the title as a level-1 heading', () => {
    render(<PageHeader title="Dashboard" />);
    expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
  });

  it('renders the optional description when provided', () => {
    render(<PageHeader title="Tasks" description="A list of all tasks" />);
    expect(screen.getByText('A list of all tasks')).toBeInTheDocument();
  });

  it('omits the description paragraph when not provided', () => {
    const { container } = render(<PageHeader title="Tasks" />);
    expect(container.querySelectorAll('p')).toHaveLength(0);
  });

  it('renders actions next to the title', () => {
    render(<PageHeader title="Tasks" actions={<button type="button">+ New</button>} />);
    expect(screen.getByRole('button', { name: '+ New' })).toBeInTheDocument();
  });
});
