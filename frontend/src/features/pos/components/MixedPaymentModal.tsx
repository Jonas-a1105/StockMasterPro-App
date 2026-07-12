import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@shared/ui/Modal';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import type { PaymentMethod } from '../types';
import styles from '../pages/POSPage.module.css';
import { Plus, DollarSign, CreditCard, Landmark, SmartphoneNfc, Users } from 'lucide-react';

const METHOD_CONFIG = {
  cash: { label: 'Efectivo', icon: DollarSign, color: '#16a34a', bg: '#dcfce7' },
  card: { label: 'Tarjeta', icon: CreditCard, color: '#2563eb', bg: '#dbeafe' },
  transfer: { label: 'Transferencia', icon: Landmark, color: '#0891b2', bg: '#cffafe' },
  mobile: { label: 'Pago Móvil', icon: SmartphoneNfc, color: '#7c3aed', bg: '#ede9fe' },
  credit: { label: 'Crédito', icon: Users, color: '#ca8a04', bg: '#fef9c3' },
};

export function MixedPaymentModal({
  open,
  onClose,
  onSubmit,
  total,
  loading,
  paymentMethod,
}: {
  open: boolean;
  onClose: () => void;
  onSubmit: (payments: { paymentMethod: PaymentMethod; amount: number; exchangeRate?: number; reference?: string }[]) => Promise<void>;
  total: number;
  loading: boolean;
  paymentMethod?: PaymentMethod;
}) {
  const { formatPrice } = useExchangeRate();
  const [payments, setPayments] = useState<{ paymentMethod: PaymentMethod; amount: number; exchangeRate?: number; reference?: string }[]>([
    { paymentMethod: 'cash', amount: 0 },
  ]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open && payments.length === 1) {
      setPayments([{ paymentMethod: paymentMethod || 'cash', amount: total }]);
      setError('');
    }
  }, [open, total, paymentMethod]);

  const paidTotal = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
  const remaining = total - paidTotal;

  const updatePayment = (idx: number, field: keyof typeof payments[0], value: any) => {
    setPayments(p => {
      const next = [...p];
      next[idx] = { ...next[idx], [field]: value };
      return next;
    });
  };

  const addPayment = () => {
    if (paidTotal >= total) return;
    setPayments(p => [...p, { paymentMethod: 'cash', amount: 0 }]);
  };

  const removePayment = (idx: number) => {
    if (payments.length <= 1) return;
    setPayments(p => p.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (Math.abs(totalPaid - total) > 0.01) {
      setError(`El total pagado (${paidTotal.toFixed(2)}) debe ser igual al total (${total.toFixed(2)})`);
      return;
    }

    if (payments.some(p => (p.amount || 0) <= 0)) {
      setError('Todos los pagos deben tener un monto mayor a 0');
      return;
    }

    await onSubmit(payments);
  };

  const paidStyle = paidTotal > total ? styles.paymentSummaryDanger : paidTotal === total ? styles.paymentSummarySuccess : styles.paymentSummaryWarning;
  const remStyle = remaining > 0 ? styles.paymentSummaryWarning : remaining < 0 ? styles.paymentSummaryDanger : styles.paymentSummarySuccess;

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Pago Mixto" wide>
      <form onSubmit={handleSubmit}>
        <p className={styles.paymentSummary}>
          Total a pagar: <strong className={styles.paymentSummaryStrong}>{formatPrice(total)}</strong> &nbsp;|&nbsp;
          Pagado: <strong className={`${styles.paymentSummaryStrong} ${paidStyle}`}>{formatPrice(paidTotal)}</strong> &nbsp;|&nbsp;
          Pendiente: <strong className={`${styles.paymentSummaryStrong} ${remStyle}`}>{formatPrice(Math.max(0, remaining))}</strong>
        </p>

        {error && <div className={styles.paymentError}>{error}</div>}

        <table className={`lista-table ${styles.mb16}`}>
          <thead>
            <tr>
              <th>Método</th>
              <th className={`${styles.w120} ${styles.textCenter}`}>Monto</th>
              <th className={styles.w140}>Tasa</th>
              <th className={styles.w140}>Referencia</th>
              <th className={styles.w50}></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, idx) => {
              const config = METHOD_CONFIG[payment.paymentMethod];
              return (
                <tr key={idx}>
                  <td>
                    <select
                      value={payment.paymentMethod}
                      onChange={e => updatePayment(idx, 'paymentMethod', e.target.value)}
                      className={styles.selectField}
                    >
                      {Object.entries(METHOD_CONFIG).map(([key, m]) => (
                        <option key={key} value={key} className={styles.optionBg} style={{ '--option-bg': m.bg } as React.CSSProperties}>
                          {m.icon} {m.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max={total}
                      value={payment.amount || ''}
                      onChange={e => updatePayment(idx, 'amount', parseFloat(e.target.value) || 0)}
                      className={`${styles.inputField} ${styles.inputFieldRight}`}
                    />
                  </td>
                  <td className={styles.textCenter}>
                    {payment.paymentMethod === 'transfer' || payment.paymentMethod === 'mobile' ? (
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={payment.exchangeRate || ''}
                        onChange={e => updatePayment(idx, 'exchangeRate', parseFloat(e.target.value) || undefined)}
                        placeholder="Tasa"
                        className={`${styles.inputField} ${styles.inputFieldRight}`}
                      />
                    ) : (
                      <span className={`${styles.textMuted} ${styles.fontSize12}`}>—</span>
                    )}
                  </td>
                  <td className={styles.textCenter}>
                    <input
                      type="text"
                      value={payment.reference || ''}
                      onChange={e => updatePayment(idx, 'reference', e.target.value)}
                      placeholder="Ref/Últ. 4 díg."
                      className={`${styles.inputField} ${styles.inputFieldCenter}`}
                    />
                  </td>
                  <td className={styles.textCenter}>
                    {payments.length > 1 && (
                      <button type="button" onClick={() => removePayment(idx)} className={styles.removeBtn}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {paidTotal < total && (
          <button type="button" className={styles.addPaymentBtn} onClick={addPayment}>
            <Plus size={16} /> Agregar otro método de pago (Pendiente: {formatPrice(Math.max(0, remaining))})
          </button>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" className={styles.saveBtn} disabled={loading}>
            {loading ? <span className={styles.spinnerInline} /> : 'Cobrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
