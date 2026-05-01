import type { ReactNode } from 'react';
import { Card } from './Card';

export interface EmptyStateProps {
  title: string;
  description?: string;
  action?: ReactNode;
}

export function EmptyState({ title, description, action }: EmptyStateProps) {
  return (
    <Card className="text-center py-12">
      <div className="max-w-sm mx-auto">
        <h3 className="text-h3 font-semibold text-text-primary">{title}</h3>
        {description && <p className="text-base text-text-secondary mt-2">{description}</p>}
        {action && <div className="mt-6">{action}</div>}
      </div>
    </Card>
  );
}
