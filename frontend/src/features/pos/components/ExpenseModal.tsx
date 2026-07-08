import { createPortal } from 'react-dom';
import { Receipt } from 'lucide-react';
import styles from '../pages/POSPage.module.css';

export function ExpenseModal({
  show,
  expenseAmount,
  expenseReason,
  onAmountChange,
  onReasonChange,
  onSave,
  onClose,
}: {
  show: boolean;
  expenseAmount: number;
  expenseReason: string;
  onAmountChange: (v: number) => void;
  onReasonChange: (v: string) => void;
  onSave: () => void;
  onClose: () => void;
}) {
  if (!show) return null;

  return createPortal(
    <div className={styles.modalOverlay} onClick={() => { onClose(); onAmountChange(0); onReasonChange(''); }}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()}>
        <div className={styles.modalTitle}>
          <Receipt size={18} /> Registrar Gasto
        </div>
        <div className={styles.modalBody}>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Monto</label>
            <input type="number" className={styles.modalInput} value={expenseAmount || ''} onChange={e => onAmountChange(parseFloat(e.target.value) || 0)} min={0} step={0.01} autoFocus />
          </div>
          <div className={styles.modalField}>
            <label className={styles.modalLabel}>Motivo</label>
            <input type="text" className={styles.modalInput} value={expenseReason} onChange={e => onReasonChange(e.target.value)} placeholder="Describa el gasto..." />
          </div>
          <div className={styles.modalRow}>
            <span>Fecha</span>
            <span className={styles.modalValue}>{new Date().toLocaleDateString()}</span>
          </div>
        </div>
        <div className={styles.modalActions}>
          <button className={styles.modalBtnSecondary} onClick={() => { onClose(); onAmountChange(0); onReasonChange(''); }}>Cancelar</button>
          <button className={styles.modalBtnPrimary} onClick={onSave} disabled={expenseAmount <= 0 || !expenseReason.trim()}>Registrar Gasto</button>
        </div>
      </div>
    </div>,
    document.body
  );
}
