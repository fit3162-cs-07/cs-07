import { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import * as notificationsApi from '../api/notifications';
import type { Notification } from '../api/notifications';
import { useAuth } from '../hooks/useAuth';

export interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
  refresh(): Promise<void>;
  markRead(id: string): Promise<void>;
  markAllRead(): Promise<void>;
}

// eslint-disable-next-line react-refresh/only-export-components
export const NotificationsContext = createContext<NotificationsContextValue | null>(null);

const POLL_INTERVAL_MS = 30_000;

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [list, count] = await Promise.all([
        notificationsApi.listNotifications({ limit: 20 }),
        notificationsApi.getUnreadCount(),
      ]);
      setNotifications(list);
      setUnreadCount(count);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load notifications');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refresh();
    if (!isAuthenticated) {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
      return;
    }
    pollRef.current = setInterval(() => {
      void refresh();
    }, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) {
        clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [isAuthenticated, refresh]);

  const markRead = useCallback(
    async (id: string) => {
      await notificationsApi.markNotificationRead(id);
      setNotifications(curr => curr.map(n => (n.id === id ? { ...n, isRead: true } : n)));
      setUnreadCount(c => Math.max(0, c - 1));
    },
    [],
  );

  const markAllRead = useCallback(async () => {
    await notificationsApi.markAllNotificationsRead();
    setNotifications(curr => curr.map(n => ({ ...n, isRead: true })));
    setUnreadCount(0);
  }, []);

  const value = useMemo<NotificationsContextValue>(
    () => ({ notifications, unreadCount, loading, error, refresh, markRead, markAllRead }),
    [notifications, unreadCount, loading, error, refresh, markRead, markAllRead],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}
