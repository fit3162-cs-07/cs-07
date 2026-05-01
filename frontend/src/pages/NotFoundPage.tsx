import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-full flex items-center justify-center bg-surface-muted p-6">
      <Card className="max-w-md text-center">
        <div className="text-display font-semibold text-primary tracking-tight">404</div>
        <h1 className="text-h2 font-semibold text-text-primary mt-2">Page not found</h1>
        <p className="text-sm text-text-secondary mt-2">
          That page doesn&rsquo;t exist or has moved.
        </p>
        <div className="mt-6">
          <Link to="/dashboard">
            <Button>Go to dashboard</Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
