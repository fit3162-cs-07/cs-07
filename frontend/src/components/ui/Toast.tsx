import { createContext, useCallback, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

export type ToastTone = 'info' | 'success' | 'error';

export interface ToastMessage {
  id: number;
  message: string;
  tone: ToastTone;
}

export interface ToastContextValue {
  show(message: string, tone?: ToastTone): void;
}

// eslint-disable-next-line react-refresh/only-export-components
export const ToastContext = createContext<ToastContextValue | null>(null);

const toneStyles: Record<ToastTone, string> = {
  info: 'border-border-default text-text-primary',
  success: 'border-success text-success',
  error: 'border-danger text-danger',
};

let counter = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const show = useCallback((message: string, tone: ToastTone = 'info') => {
    const id = ++counter;
    setToasts(curr => [...curr, { id, message, tone }]);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts(curr => curr.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ show }}>
      {children}
      {createPortal(
        <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-2">
          {toasts.map(t => (
            <ToastItem
              key={t.id}
              toast={t}
              onDismiss={() => dismiss(t.id)}
              className={toneStyles[t.tone]}
            />
          ))}
        </div>,
        document.body,
      )}
    </ToastContext.Provider>
  );
}

function ToastItem({
  toast,
  onDismiss,
  className,
}: {
  toast: ToastMessage;
  onDismiss: () => void;
  className?: string;
}) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 3500);
    return () => clearTimeout(t);
  }, [onDismiss]);

  return (
    <div
      className={cn(
        'min-w-[240px] max-w-sm bg-surface-elevated border rounded-md shadow-lg px-4 py-3 text-sm flex items-start gap-2',
        className,
      )}
      role="status"
    >
      <span className="flex-1">{toast.message}</span>
      <button
        type="button"
        onClick={onDismiss}
        className="text-text-tertiary hover:text-text-primary leading-none text-base transition-colors duration-DEFAULT ease-DEFAULT"
        aria-label="Dismiss"
      >
        ×
      </button>
    </div>
  );
}
