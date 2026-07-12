import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Receipt } from 'lucide-react';
import styles from '../pages/POSPage.module.css';

const STORAGE_KEY_EXPENSES = 'stockmaster-expenses';

export function ExpenseModal({ show, onClose }: { show: boolean; onClose: () => void }) {
  const [amount, setAmount] = useState(0);
  const [reason, setReason] = useState('');

  if (!show) return null;

  const handleSave = () => {
    if (amount <= 0 || !reason.trim()) return;
    const expenses = JSON.parse(localStorage.getItem(STORAGE_KEY_EXPENSES) || '[]');
    expenses.push({ amount, reason, date: new Date().toISOString() });
    localStorage.setItem(STORAGE_KEY_EXPENSES, JSON.stringify(expenses));
    setAmount(0);
    setReason('');
    onClose();
  };

  const handleClose = () => {
    setAmount(0);
    setReason('');
    onClose();
  };

  return createPortal(
    <div className={styles.modalOverlay} onClick={handleClose}>
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>
          <Receipt size={18} /> Registrar Gasto
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Monto</label>
            <input
              type="number"
              className={styles.modalInput}
              value={amount || ''}
              onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
              min={0}
              step={0.01}
              autoFocus
            />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Motivo</label>
            <input
              type="text"
              className={styles.modalInput}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Describa el gasto..."
            />
          </div>
          <div className={styles.modalRow}>
            <span>Fecha</span>
            <span className={styles.modalValue}>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.modalBtnSecondary} onClick={handleClose}>
            Cancelar
          </button>
          <button
            className={styles.modalBtnPrimary}
            onClick={handleSave}
            disabled={amount <= 0 || !reason.trim()}
          >
            Registrar Gasto
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
