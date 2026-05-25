import { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { TopNav } from './TopNav';
import { Sidebar } from './Sidebar';
import { ErrorBoundary } from '../ErrorBoundary';

export function AppShell() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-full flex flex-col bg-surface-muted">
      <TopNav onMenuToggle={() => setMobileOpen(open => !open)} />
      <div className="flex flex-1 min-h-0">
        <Sidebar mobileOpen={mobileOpen} onMobileClose={() => setMobileOpen(false)} />
        <main className="flex-1 overflow-y-auto bg-surface-muted">
          <div
            key={location.pathname}
            className="max-w-[1200px] mx-auto px-4 md:px-6 lg:px-8 py-6 md:py-8 animate-fade-in"
          >
            <ErrorBoundary key={location.pathname}>
              <Outlet />
            </ErrorBoundary>
          </div>
        </main>
      </div>
    </div>
  );
}
