import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { Dropdown } from '../ui/Dropdown';

export function TopNav() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  return (
    <header className="h-14 bg-surface border-b border-border flex items-center justify-between px-6 shrink-0">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-primary" aria-hidden />
        <span className="text-base font-semibold text-ink">Monash Club Tasks</span>
      </div>
      {user && (
        <Dropdown
          trigger={
            <button
              type="button"
              className="flex items-center gap-2 h-8 px-2 rounded-md hover:bg-primary-soft text-sm"
            >
              <span className="w-7 h-7 rounded-full bg-primary-soft text-primary flex items-center justify-center font-semibold text-sm">
                {user.name.charAt(0).toUpperCase()}
              </span>
              <span className="text-ink font-medium">{user.name}</span>
              <span className="text-muted text-sm">{user.role === 'ADMIN' ? 'Admin' : 'Member'}</span>
            </button>
          }
          items={[
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
      )}
    </header>
  );
}
