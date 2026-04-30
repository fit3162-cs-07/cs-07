import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '../ErrorBoundary';

export function AppShell() {
  const location = useLocation();
  return (
    <div className="min-h-full flex flex-col bg-page">
      <TopNav />
      <div className="flex flex-1 min-h-0">
        <Sidebar />
        <main className="flex-1 overflow-y-auto p-6 md:p-8">
          <div className="max-w-6xl mx-auto">
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
