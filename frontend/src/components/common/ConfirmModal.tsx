import { useEffect } from 'react';
import { AlertTriangle, Trash2, X } from 'lucide-react';
import styles from './ConfirmModal.module.css';

interface ConfirmModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
}

export function ConfirmModal({
  open,
  onClose,
  onConfirm,
  title = '¿Estás seguro?',
  message = 'Esta acción no se puede deshacer.',
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'warning'
}: ConfirmModalProps) {
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, onClose]);

  if (!open) return null;

  const getIcon = () => {
    switch (type) {
      case 'danger':
        return <Trash2 size={28} className={styles.dangerIcon} />;
      case 'info':
        return <AlertTriangle size={28} className={styles.infoIcon} />;
      default:
        return <AlertTriangle size={28} className={styles.warningIcon} />;
    }
  };

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={e => e.stopPropagation()}>
        <button className={styles.closeBtn} onClick={onClose} aria-label="Cerrar">
          <X size={18} />
        </button>
        <div className={styles.content}>
          <div className={`${styles.iconWrapper} ${styles[type]}`}>
            {getIcon()}
          </div>
          <h3 className={styles.title}>{title}</h3>
          <p className={styles.message}>{message}</p>
        </div>
        <div className={styles.actions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            {cancelText}
          </button>
          <button
            type="button"
            className={`${styles.confirmBtn} ${styles[type + 'Confirm']}`}
            onClick={() => {
              onConfirm();
              onClose();
            }}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
