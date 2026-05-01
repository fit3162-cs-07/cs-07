import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNotifications } from '../../hooks/useNotifications';
import { cn } from '../../lib/cn';
import { formatDateTime } from '../../lib/format';
import type { Notification } from '../../api/notifications';

export function NotificationsBell() {
  const { notifications, unreadCount, loading, markRead, markAllRead, refresh } =
    useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    window.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const handleToggle = () => {
    setOpen(prev => {
      const next = !prev;
      if (next) void refresh();
      return next;
    });
  };

  const handleClick = async (n: Notification) => {
    if (!n.isRead) await markRead(n.id);
    setOpen(false);
    if (n.link) navigate(n.link);
  };

  const badge = unreadCount > 99 ? '99+' : String(unreadCount);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        aria-label={
          unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
        }
        aria-haspopup="true"
        aria-expanded={open}
        onClick={handleToggle}
        className="relative h-9 w-9 inline-flex items-center justify-center rounded-md hover:bg-surface-muted text-text-secondary hover:text-text-primary transition-colors duration-DEFAULT ease-DEFAULT"
      >
        <BellIcon />
        {unreadCount > 0 && (
          <span
            data-testid="notifications-badge"
            className="absolute top-0.5 right-0.5 min-w-[16px] h-[16px] px-1 rounded-full bg-danger text-text-on-primary text-[10px] font-semibold flex items-center justify-center ring-2 ring-surface"
          >
            {badge}
          </span>
        )}
      </button>

      {open && (
        <div
          role="dialog"
          aria-label="Notifications"
          className="absolute right-0 mt-2 z-30 w-80 sm:w-96 max-h-[70vh] bg-surface border border-border-default rounded-md shadow-lg flex flex-col overflow-hidden"
        >
          <div className="px-4 py-3 border-b border-border-default flex items-center justify-between">
            <span className="text-sm font-semibold text-text-primary">Notifications</span>
            {notifications.some(n => !n.isRead) && (
              <button
                type="button"
                className="text-sm font-medium text-primary hover:text-primary-hover transition-colors duration-DEFAULT ease-DEFAULT"
                onClick={() => void markAllRead()}
              >
                Mark all read
              </button>
            )}
          </div>
          <div className="overflow-y-auto flex-1">
            {loading && notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-text-tertiary">Loading…</div>
            ) : notifications.length === 0 ? (
              <div className="px-4 py-6 text-sm text-text-tertiary">
                You&rsquo;re all caught up.
              </div>
            ) : (
              <ul>
                {notifications.map((n, idx) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => void handleClick(n)}
                      className={cn(
                        'w-full text-left px-4 py-3 hover:bg-surface-muted transition-colors duration-DEFAULT ease-DEFAULT',
                        idx > 0 && 'border-t border-border-default',
                        !n.isRead && 'bg-primary-subtle/40',
                      )}
                    >
                      <div className="flex items-start gap-2">
                        {!n.isRead && (
                          <span
                            aria-hidden
                            className="mt-1 h-2 w-2 rounded-full bg-primary shrink-0"
                          />
                        )}
                        <div className="min-w-0 flex-1">
                          <p
                            className={cn(
                              'text-sm',
                              !n.isRead
                                ? 'text-text-primary font-medium'
                                : 'text-text-primary',
                            )}
                          >
                            {n.title}
                          </p>
                          <p className="text-xs text-text-tertiary mt-1">
                            {formatDateTime(n.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function BellIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      className="h-5 w-5"
      aria-hidden
    >
      <path d="M10 2a6 6 0 0 0-6 6v3.586l-.707.707A1 1 0 0 0 4 14h12a1 1 0 0 0 .707-1.707L16 11.586V8a6 6 0 0 0-6-6Zm-2 14a2 2 0 1 0 4 0H8Z" />
    </svg>
  );
}
