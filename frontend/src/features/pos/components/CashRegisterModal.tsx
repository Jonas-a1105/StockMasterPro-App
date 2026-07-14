import { createPortal } from 'react-dom';
import { Wallet } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import styles from '../pages/POSPage/POSPage.module.css';

export function CashRegisterModal({
  show,
  isTodayOpen,
  cashOpening,
  cashSalesTotal,
  declaredAmount,
  onCashOpeningChange,
  onDeclaredAmountChange,
  onOpenCash,
  onCloseCash,
  onClose,
}: {
  show: boolean;
  isTodayOpen: boolean;
  cashOpening: number;
  cashSalesTotal: number;
  declaredAmount: number;
  onCashOpeningChange: (v: number) => void;
  onDeclaredAmountChange: (v: number) => void;
  onOpenCash: () => void;
  onCloseCash: () => void;
  onClose: () => void;
}) {
  const { formatPrice } = useExchangeRate();

  if (!show) return null;

  return createPortal(
    <div
      className={styles.modalOverlay}
      onClick={() => {
        onClose();
        onDeclaredAmountChange(0);
      }}
    >
      <div className={styles.modalCard} onClick={(e) => e.stopPropagation()}>
        <div className={styles.modalTitle}>
          <Wallet size={18} />
          {isTodayOpen ? 'Cierre de Caja' : 'Apertura de Caja'}
        </div>
        {!isTodayOpen ? (
          <>
            <div className={styles.modalBody}>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Monto de apertura (base)</label>
                <input
                  type="number"
                  className={styles.modalInput}
                  value={cashOpening || ''}
                  onChange={(e) => onCashOpeningChange(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  autoFocus
                />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => {
                  onClose();
                  onCashOpeningChange(0);
                }}
              >
                Cancelar
              </button>
              <button
                className={styles.modalBtnPrimary}
                onClick={onOpenCash}
                disabled={cashOpening <= 0}
              >
                Abrir Caja
              </button>
            </div>
          </>
        ) : (
          <>
            <div className={styles.modalBody}>
              <div className={styles.modalRow}>
                <span>Apertura</span>
                <span className={styles.modalValue}>{formatPrice(cashOpening)}</span>
              </div>
              <div className={styles.modalRow}>
                <span>Ventas del día (efectivo)</span>
                <span className={styles.modalValue}>{formatPrice(cashSalesTotal)}</span>
              </div>
              <div className={styles.modalRow}>
                <span>Esperado</span>
                <span className={styles.modalValue}>
                  {formatPrice(cashOpening + cashSalesTotal)}
                </span>
              </div>
              <div className={styles.modalField}>
                <label className={styles.modalLabel}>Dinero contado</label>
                <input
                  type="number"
                  className={styles.modalInput}
                  value={declaredAmount || ''}
                  onChange={(e) => onDeclaredAmountChange(parseFloat(e.target.value) || 0)}
                  min={0}
                  step={0.01}
                  autoFocus
                />
              </div>
              {declaredAmount > 0 && (
                <div className={`${styles.modalRow} ${styles.modalRowDiff}`}>
                  <span>Diferencia</span>
                  <span
                    className={`${styles.modalValue} ${declaredAmount >= cashOpening + cashSalesTotal ? styles.modalPositive : styles.modalNegative}`}
                  >
                    {formatPrice(declaredAmount - (cashOpening + cashSalesTotal))}
                  </span>
                </div>
              )}
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.modalBtnSecondary}
                onClick={() => {
                  onClose();
                  onDeclaredAmountChange(0);
                }}
              >
                Cancelar
              </button>
              <button className={styles.modalBtnPrimary} onClick={onCloseCash}>
                Cerrar Caja
              </button>
            </div>
          </>
        )}
      </div>
    </div>,
    document.body
  );
}
