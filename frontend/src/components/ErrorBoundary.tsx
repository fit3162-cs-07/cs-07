import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Button } from './ui/Button';
import { Card, CardSubtitle, CardTitle } from './ui/Card';

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, reset: () => void) => ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    console.error('ErrorBoundary caught', error, info);
  }

  reset = (): void => {
    this.setState({ error: null });
  };

  render(): ReactNode {
    const { error } = this.state;
    const { children, fallback } = this.props;

    if (!error) return children;
    if (fallback) return fallback(error, this.reset);

    return (
      <Card className="max-w-xl mx-auto mt-8 text-center">
        <CardTitle>Something went wrong</CardTitle>
        <CardSubtitle>
          The page hit an unexpected error. You can try again, or refresh.
        </CardSubtitle>
        <p className="text-sm text-muted mt-4 break-words">{error.message}</p>
        <div className="mt-6 flex justify-center gap-2">
          <Button variant="secondary" onClick={() => window.location.reload()}>
            Refresh
          </Button>
          <Button onClick={this.reset}>Try again</Button>
        </div>
      </Card>
    );
  }
}
