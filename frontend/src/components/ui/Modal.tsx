import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '../../lib/cn';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizes = {
  sm: 'md:max-w-md',
  md: 'md:max-w-lg',
  lg: 'md:max-w-2xl',
};

export function Modal({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = 'md',
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-text-primary/40 md:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
    >
      <div
        className={cn(
          'w-full bg-surface-elevated border border-border-default flex flex-col',
          'rounded-t-xl rounded-b-none max-h-[92vh]',
          'md:rounded-xl md:max-h-[90vh] md:shadow-md',
          sizes[size],
        )}
        onClick={e => e.stopPropagation()}
      >
        <div
          aria-hidden
          className="md:hidden flex justify-center pt-3 pb-1"
        >
          <span className="h-1 w-10 rounded-full bg-border-strong" />
        </div>
        {(title || description) && (
          <div className="px-6 py-4 border-b border-border-default">
            {title && (
              <h2 className="text-h2 font-semibold text-text-primary">{title}</h2>
            )}
            {description && (
              <p className="text-sm text-text-secondary mt-1">{description}</p>
            )}
          </div>
        )}
        <div className="px-6 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="px-6 py-4 border-t border-border-default flex items-center justify-end gap-2">
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}
