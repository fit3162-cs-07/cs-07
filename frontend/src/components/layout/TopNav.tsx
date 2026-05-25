import { useNavigate } from 'react-router-dom';
import { Menu } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { Dropdown } from '../ui/Dropdown';
import { Logo } from '../ui/Logo';
import { NotificationsBell } from '../notifications/NotificationsBell';

export interface TopNavProps {
  onMenuToggle(): void;
}

export function TopNav({ onMenuToggle }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-16 bg-surface border-b border-border-default flex items-center justify-between px-4 md:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuToggle}
          className="md:hidden h-9 w-9 rounded-md hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors duration-DEFAULT ease-DEFAULT inline-flex items-center justify-center shrink-0"
        >
          <Menu className="h-5 w-5" aria-hidden />
        </button>
        <Logo size="md" />
      </div>
      {user && (
        <div className="flex items-center gap-2 shrink-0">
          <NotificationsBell />
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 h-10 pl-1.5 pr-2 rounded-md hover:bg-surface-muted transition-colors duration-DEFAULT ease-DEFAULT shrink-0"
              >
                <span className="w-8 h-8 rounded-full bg-primary text-text-on-primary flex items-center justify-center font-semibold text-sm shadow-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="hidden sm:flex flex-col items-start leading-tight">
                  <span className="text-text-primary font-semibold text-sm truncate max-w-[140px]">
                    {user.name}
                  </span>
                  <span className="text-text-tertiary text-[11px] font-medium">
                    {user.role === 'ADMIN' ? 'Admin' : 'Member'}
                  </span>
                </span>
              </button>
            }
            items={[
              {
                label: 'Account settings',
                onClick: () => navigate('/account'),
              },
              {
                label: 'Sign out',
                destructive: true,
                onClick: () => {
                  logout();
                  navigate('/login', { replace: true });
                },
              },
            ]}
          />
        </div>
      )}
    </header>
  );
}
