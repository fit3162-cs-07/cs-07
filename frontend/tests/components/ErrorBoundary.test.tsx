import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useState } from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorBoundary } from '../../src/components/ErrorBoundary';

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error('kaboom from child');
  return <p>child rendered</p>;
}

describe('ErrorBoundary', () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    // React intentionally logs caught render errors; suppress for clean test output
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('child rendered')).toBeInTheDocument();
  });

  it('renders the default fallback when a child throws', () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('kaboom from child')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Refresh' })).toBeInTheDocument();
  });

  it('renders a custom fallback render-prop when provided', () => {
    render(
      <ErrorBoundary fallback={(error, reset) => (
        <div>
          <p>custom: {error.message}</p>
          <button type="button" onClick={reset}>reset</button>
        </div>
      )}>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText('custom: kaboom from child')).toBeInTheDocument();
  });

  it('clears the error and re-renders children when Try again is clicked', async () => {
    const user = userEvent.setup();

    function Harness() {
      const [shouldThrow, setShouldThrow] = useState(true);
      return (
        <div>
          <button type="button" onClick={() => setShouldThrow(false)}>fix it</button>
          <ErrorBoundary>
            <Boom shouldThrow={shouldThrow} />
          </ErrorBoundary>
        </div>
      );
    }

    render(<Harness />);
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();

    // Simulate the underlying issue being resolved before retrying.
    await user.click(screen.getByRole('button', { name: 'fix it' }));
    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(screen.getByText('child rendered')).toBeInTheDocument();
    expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
  });
});
