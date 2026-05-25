import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Dropdown } from '../ui/Dropdown';
import { NotificationsBell } from '../notifications/NotificationsBell';

export interface TopNavProps {
  onMenuToggle(): void;
}

export function TopNav({ onMenuToggle }: TopNavProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-surface border-b border-border-default flex items-center justify-between px-4 md:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuToggle}
          className="md:hidden h-8 w-8 rounded-md hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors duration-DEFAULT ease-DEFAULT inline-flex items-center justify-center shrink-0"
        >
          <svg
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            className="h-4 w-4"
            aria-hidden
          >
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
        <div className="flex items-center gap-2 min-w-0">
          <div
            aria-hidden
            className="w-6 h-6 rounded bg-primary text-text-on-primary flex items-center justify-center text-xs font-semibold shrink-0"
          >
            M
          </div>
          <span className="text-base font-semibold text-text-primary truncate tracking-tight">
            <span className="hidden sm:inline">Monash Club Tasks</span>
            <span className="sm:hidden">MCT</span>
          </span>
        </div>
      </div>
      {user && (
        <div className="flex items-center gap-1 shrink-0">
          <NotificationsBell />
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 h-9 px-2 rounded-md hover:bg-surface-muted transition-colors duration-DEFAULT ease-DEFAULT shrink-0"
              >
                <span className="w-7 h-7 rounded-full bg-primary-subtle text-primary flex items-center justify-center font-medium text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-text-primary font-medium text-sm hidden sm:inline truncate max-w-[160px]">
                  {user.name}
                </span>
                <span className="text-text-tertiary text-xs hidden md:inline font-medium">
                  {user.role === 'ADMIN' ? 'Admin' : 'Member'}
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
