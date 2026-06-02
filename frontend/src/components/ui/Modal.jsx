import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from './Button';
import { cn } from '../../lib/cn';

/**
 * Modal — accessible dialog. Props:
 *  - open, onClose
 *  - title, footer (nodes)
 *  - size: sm | md (default) | lg
 * Closes on Escape and backdrop click; locks body scroll while open.
 */
export function Modal({ open, onClose, title, footer, size = 'md', children, className }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose?.();
    document.addEventListener('keydown', onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-modal__backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose?.()}>
      <div className={cn('ui-modal', size !== 'md' && `ui-modal--${size}`, className)} role="dialog" aria-modal="true" aria-label={title}>
        {title && (
          <div className="ui-modal__head">
            <h2 className="ui-modal__title">{title}</h2>
            <button className="ui-modal__close" onClick={onClose} aria-label="Close dialog">
              <X size={20} />
            </button>
          </div>
        )}
        <div className="ui-modal__body">{children}</div>
        {footer && <div className="ui-modal__foot">{footer}</div>}
      </div>
    </div>
  );
}

/**
 * ConfirmDialog — yes/no confirmation built on Modal.
 * Props: open, onClose, onConfirm, title, message, confirmLabel, danger, loading.
 */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  loading = false,
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      size="sm"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>{cancelLabel}</Button>
          <Button variant={danger ? 'danger' : 'primary'} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </>
      }
    >
      <p style={{ color: 'var(--text-muted)', lineHeight: 1.6 }}>{message}</p>
    </Modal>
  );
}

export default Modal;
