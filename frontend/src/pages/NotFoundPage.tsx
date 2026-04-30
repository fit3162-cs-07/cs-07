import { Link } from 'react-router-dom';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  return (
    <div className="min-h-full flex items-center justify-center bg-page p-6">
      <Card className="max-w-md text-center">
        <h1 className="text-3xl font-semibold text-ink">404</h1>
        <p className="text-base text-muted mt-2">
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
