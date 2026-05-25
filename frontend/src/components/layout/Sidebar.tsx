import { useEffect, type ReactElement, type SVGProps } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';

interface NavLinkItem {
  to: string;
  label: string;
  icon: (props: SVGProps<SVGSVGElement>) => ReactElement;
}

const baseLinks: NavLinkItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: DashboardIcon },
  { to: '/tasks', label: 'Tasks', icon: TasksIcon },
  { to: '/kanban', label: 'Kanban', icon: KanbanIcon },
];

const adminLinks: NavLinkItem[] = [
  { to: '/admin/users', label: 'User Management', icon: UsersIcon },
];

export interface SidebarProps {
  mobileOpen: boolean;
  onMobileClose(): void;
}

export function Sidebar({ mobileOpen, onMobileClose }: SidebarProps) {
  const location = useLocation();

  useEffect(() => {
    if (mobileOpen) onMobileClose();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onMobileClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [mobileOpen, onMobileClose]);

  return (
    <>
      <aside
        aria-label="Primary navigation"
        className="w-60 shrink-0 bg-surface border-r border-border-default py-6 px-3 hidden md:flex md:flex-col"
      >
        <SidebarLinks />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="md:hidden fixed inset-0 z-40 bg-text-primary/40"
          onClick={onMobileClose}
        />
      )}
      <aside
        data-testid="mobile-drawer"
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
        className={cn(
          'md:hidden fixed top-0 left-0 z-50 h-full w-64 bg-surface border-r border-border-default py-4 px-3 transition-transform duration-DEFAULT ease-DEFAULT',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between mb-6 px-2">
          <span className="text-sm font-medium text-text-secondary uppercase tracking-wider">
            Menu
          </span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="h-8 w-8 rounded-md hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors duration-DEFAULT ease-DEFAULT inline-flex items-center justify-center"
          >
            ✕
          </button>
        </div>
        <SidebarLinks />
      </aside>
    </>
  );
}

function SidebarLinks() {
  const { isAdmin } = useAuth();
  return (
    <nav className="flex flex-col gap-6">
      <NavGroup label="Workspace" items={baseLinks} />
      {isAdmin && <NavGroup label="Admin" items={adminLinks} />}
    </nav>
  );
}

function NavGroup({ label, items }: { label: string; items: NavLinkItem[] }) {
  return (
    <div className="flex flex-col gap-1">
      <span className="px-3 mb-1 text-xs font-medium text-text-tertiary uppercase tracking-wider">
        {label}
      </span>
      {items.map(link => {
        const Icon = link.icon;
        return (
          <NavLink
            key={link.to}
            to={link.to}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-3 h-9 rounded-md text-sm transition-colors duration-DEFAULT ease-DEFAULT',
                isActive
                  ? 'bg-primary-subtle text-primary font-medium'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted font-normal',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'h-4 w-4 shrink-0',
                    isActive ? 'text-primary' : 'text-text-tertiary',
                  )}
                  aria-hidden
                />
                <span className="truncate">{link.label}</span>
              </>
            )}
          </NavLink>
        );
      })}
    </div>
  );
}

function DashboardIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="2" y="2" width="5" height="5" rx="1" />
      <rect x="9" y="2" width="5" height="5" rx="1" />
      <rect x="2" y="9" width="5" height="5" rx="1" />
      <rect x="9" y="9" width="5" height="5" rx="1" />
    </svg>
  );
}

function TasksIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <path d="M2 4h12M2 8h12M2 12h8" strokeLinecap="round" />
    </svg>
  );
}

function KanbanIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <rect x="2" y="2" width="3.5" height="12" rx="1" />
      <rect x="6.25" y="2" width="3.5" height="8" rx="1" />
      <rect x="10.5" y="2" width="3.5" height="10" rx="1" />
    </svg>
  );
}

function UsersIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" {...props}>
      <circle cx="6" cy="6" r="2.5" />
      <path d="M2 13.5c0-2.21 1.79-4 4-4s4 1.79 4 4" strokeLinecap="round" />
      <circle cx="11.5" cy="5.5" r="1.5" />
      <path d="M14 11.5c0-1.38-1.12-2.5-2.5-2.5" strokeLinecap="round" />
    </svg>
  );
}
