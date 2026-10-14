import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/utils/cn';
import './Toast.css';

export type ToastTone = 'default' | 'success' | 'danger' | 'info';

export interface ToastProps {
  message: ReactNode | null;
  tone?: ToastTone;
  duration?: number;
  onClose?: () => void;
}

export function Toast({ message, tone = 'default', duration = 2500, onClose }: ToastProps) {
  useEffect(() => {
    if (!message || !onClose) return;
    const id = setTimeout(onClose, duration);
    return () => clearTimeout(id);
  }, [message, duration, onClose]);

  if (!message) return null;

  return createPortal(
    <div className={cn('toast', `toast--${tone}`)} role="status" aria-live="polite">
      <span className="toast__dot" aria-hidden />
      <span className="toast__text">{message}</span>
    </div>,
    document.body,
  );
}
