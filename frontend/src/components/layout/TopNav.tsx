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
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-4 md:px-6 shrink-0 gap-2">
      <div className="flex items-center gap-2 min-w-0">
        <button
          type="button"
          aria-label="Open navigation"
          onClick={onMenuToggle}
          className="md:hidden h-8 w-8 rounded-md hover:bg-primary-soft text-ink flex items-center justify-center shrink-0"
        >
          <span aria-hidden className="text-lg leading-none">☰</span>
        </button>
        <div className="w-6 h-6 rounded bg-primary shrink-0" aria-hidden />
        <span className="text-base font-semibold text-ink truncate">
          <span className="hidden sm:inline">Monash Club Tasks</span>
          <span className="sm:hidden">MCT</span>
        </span>
      </div>
      {user && (
        <div className="flex items-center gap-2 shrink-0">
          <NotificationsBell />
          <Dropdown
            trigger={
              <button
                type="button"
                className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-primary-soft text-sm shrink-0"
              >
                <span className="w-7 h-7 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm">
                  {user.name.charAt(0).toUpperCase()}
                </span>
                <span className="text-ink font-medium hidden sm:inline truncate max-w-[160px]">
                  {user.name}
                </span>
                <span className="text-muted text-sm hidden md:inline">
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
