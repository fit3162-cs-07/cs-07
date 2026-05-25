import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ListChecks,
  KanbanSquare,
  Users,
  X,
  type LucideIcon,
} from 'lucide-react';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';

interface NavLinkItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const baseLinks: NavLinkItem[] = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/tasks', label: 'Tasks', icon: ListChecks },
  { to: '/kanban', label: 'Kanban Board', icon: KanbanSquare },
];

const adminLinks: NavLinkItem[] = [
  { to: '/admin/users', label: 'User Management', icon: Users },
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
        className="w-[220px] shrink-0 bg-surface border-r border-border-default py-5 px-3 hidden md:flex md:flex-col"
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
          'md:hidden fixed top-0 left-0 z-50 h-full w-[260px] bg-surface border-r border-border-default py-4 px-3 transition-transform duration-DEFAULT ease-DEFAULT shadow-lg',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between mb-5 px-2">
          <span className="text-xs font-semibold text-text-tertiary uppercase tracking-wider">
            Menu
          </span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="h-8 w-8 rounded-md hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors duration-DEFAULT ease-DEFAULT inline-flex items-center justify-center"
          >
            <X className="h-4 w-4" aria-hidden />
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
    <nav className="flex flex-col gap-5">
      <NavGroup label="Workspace" items={baseLinks} />
      {isAdmin && <NavGroup label="Admin" items={adminLinks} />}
    </nav>
  );
}

function NavGroup({ label, items }: { label: string; items: NavLinkItem[] }) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="px-3 mb-2 text-[11px] font-semibold text-text-tertiary uppercase tracking-wider">
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
                'flex items-center gap-3 px-3 h-10 rounded-md text-sm transition-colors duration-DEFAULT ease-DEFAULT',
                isActive
                  ? 'bg-primary-subtle text-primary font-semibold'
                  : 'text-text-secondary hover:text-text-primary hover:bg-surface-muted font-medium',
              )
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={cn(
                    'h-[18px] w-[18px] shrink-0',
                    isActive ? 'text-primary' : 'text-text-tertiary',
                  )}
                  strokeWidth={isActive ? 2.25 : 1.75}
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
