import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '@shared/ui/Modal';
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
  type = 'warning',
}: ConfirmModalProps) {
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
    <Modal open={open} onClose={onClose} narrow>
      <div className={styles.content}>
        <div className={`${styles.iconWrapper} ${styles[type]}`}>{getIcon()}</div>
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
    </Modal>
  );
}
