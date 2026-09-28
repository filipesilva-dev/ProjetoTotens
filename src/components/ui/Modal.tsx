import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { Button } from './Button';
import { Text } from './Text';
import './Modal.css';
export interface ModalProps {
  open: boolean; title: string; description?: ReactNode;
  confirmLabel?: string; cancelLabel?: string;
  variant?: 'default'|'danger';
  onConfirm: () => void; onCancel: () => void;
}
export function Modal({ open, title, description, confirmLabel='Confirmar', cancelLabel='Cancelar',
  variant='default', onConfirm, onCancel }: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onCancel(); };
    document.addEventListener('keydown', k);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = ''; };
  }, [open, onCancel]);
  if (!open) return null;
  return createPortal(
    <div className="modal" role="dialog" aria-modal="true">
      <div className="modal__backdrop" onClick={onCancel} />
      <div className="modal__panel">
        <Text as="h2" size="xl" weight="black" style={{ textAlign: 'center' }}>{title}</Text>
        {description && <div style={{ color: 'var(--color-text-muted)' }}>{description}</div>}
        <div className="modal__actions">
          <Button variant="ghost" size="lg" onClick={onCancel}>{cancelLabel}</Button>
          <Button variant={variant === 'danger' ? 'danger' : 'primary'} size="lg" onClick={onConfirm}>{confirmLabel}</Button>
        </div>
      </div>
    </div>,
    document.body,
  );
}
