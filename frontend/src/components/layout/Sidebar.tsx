import { useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '../../lib/cn';
import { useAuth } from '../../hooks/useAuth';

interface NavLinkItem {
  to: string;
  label: string;
}

const baseLinks: NavLinkItem[] = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/tasks', label: 'Tasks' },
  { to: '/kanban', label: 'Kanban' },
];

const adminLinks: NavLinkItem[] = [
  { to: '/admin/users', label: 'User Management' },
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
        className="w-56 shrink-0 bg-surface border-r border-border py-4 px-2 hidden md:block"
      >
        <SidebarLinks />
      </aside>

      {mobileOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          className="md:hidden fixed inset-0 z-40 bg-ink/40"
          onClick={onMobileClose}
        />
      )}
      <aside
        data-testid="mobile-drawer"
        aria-label="Mobile navigation"
        aria-hidden={!mobileOpen}
        className={cn(
          'md:hidden fixed top-0 left-0 z-50 h-full w-56 bg-surface border-r border-border py-4 px-2 transition-transform',
          mobileOpen ? 'translate-x-0' : '-translate-x-full',
        )}
      >
        <div className="flex items-center justify-between mb-4 px-2">
          <span className="text-base font-semibold text-ink">Menu</span>
          <button
            type="button"
            aria-label="Close navigation"
            onClick={onMobileClose}
            className="h-8 w-8 rounded-md hover:bg-primary-soft text-ink"
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
  const links = isAdmin ? [...baseLinks, ...adminLinks] : baseLinks;
  return (
    <nav className="flex flex-col gap-1">
      {links.map(link => (
        <NavLink
          key={link.to}
          to={link.to}
          className={({ isActive }) =>
            cn(
              'px-3 py-2 rounded-md text-base font-medium',
              isActive ? 'bg-primary-soft text-primary' : 'text-ink hover:bg-primary-soft',
            )
          }
        >
          {link.label}
        </NavLink>
      ))}
    </nav>
  );
}
