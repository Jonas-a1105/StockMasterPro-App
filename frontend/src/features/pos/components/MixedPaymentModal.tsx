import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@shared/ui/Modal';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import type { PaymentMethod } from '../types';
import styles from '../pages/POSPage.module.css';
import { Plus, DollarSign, CreditCard, Landmark, Smartphone, SmartphoneNfc, Users, X, ChevronRight, RotateCcw } from 'lucide-react';

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

  const METHOD_CONFIG = {
    cash: { label: 'Efectivo', icon: DollarSign, color: '#16a34a', bg: '#dcfce7' },
    card: { label: 'Tarjeta', icon: CreditCard, color: '#2563eb', bg: '#dbeafe' },
    mobile: { label: 'Pago Móvil', icon: SmartphoneNfc, color: '#7c3aed', bg: '#ede9fe' },
    transfer: { label: 'Transferencia', icon: Landmark, color: '#0891b2', bg: '#cffafe' },
    credit: { label: 'Crédito', icon: Users, color: '#ca8a04', bg: '#fef9c3' },
  };

  const methods = Object.entries(METHOD_CONFIG).map(([key, config]) => ({ key: key, ...config }));

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Pago Mixto" wide>
      <form onSubmit={handleSubmit}>
        <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
          Total a pagar: <strong>{formatPrice(total)}</strong> &nbsp;|&nbsp;
          Pagado: <strong style={{ color: paidTotal > total ? '#ef4444' : paidTotal === total ? '#16a34a' : '#ca8a04' }}>{formatPrice(paidTotal)}</strong> &nbsp;|&nbsp;
          Pendiente: <strong style={{ color: remaining > 0 ? '#f59e0b' : remaining < 0 ? '#ef4444' : '#16a34a' }}>{formatPrice(Math.max(0, remaining))}</strong>
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(239,68,68,0.1)', border: '1px solid #ef4444', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        <table className="lista-table" style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>Método</th>
              <th style={{ width: 120, textAlign: 'center' }}>Monto</th>
              <th style={{ width: 140 }}>Tasa</th>
              <th style={{ width: 140 }}>Referencia</th>
              <th style={{ width: 50 }}></th>
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
                      style={{ width: 100, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: 14 }}
                    >
                      {Object.entries(METHOD_CONFIG).map(([key, m]) => (
                        <option key={m.key} value={m.key} style={{ background: m.bg }}>
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
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: 14, textAlign: 'right' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {payment.paymentMethod === 'transfer' || payment.paymentMethod === 'mobile' ? (
                      <input
                        type="number"
                        step="0.0001"
                        min="0"
                        value={payment.exchangeRate || ''}
                        onChange={e => updatePayment(idx, 'exchangeRate', parseFloat(e.target.value) || undefined)}
                        placeholder="Tasa"
                        style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', textAlign: 'right' }}
                      />
                    ) : (
                      <span style={{ color: 'var(--text-muted)', fontSize: 12 }}>—</span>
                    )}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="text"
                      value={payment.reference || ''}
                      onChange={e => updatePayment(idx, 'reference', e.target.value)}
                      placeholder="Ref/Últ. 4 díg."
                      style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--bg-secondary)', fontSize: 14, textAlign: 'center' }}
                    />
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {payments.length > 1 && (
                      <button type="button" onClick={() => removePayment(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 18, padding: 4 }}>
                        ✕
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {paidTotal < total && (
            <button type="button" className={styles.addPaymentBtn} onClick={addPayment} style={{ marginBottom: 16, width: '100%' }}>
              <Plus size={16} /> Agregar otro método de pago (Pendiente: {formatPrice(Math.max(0, remaining))})
            </button>
          )}

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={loading}>
              {loading ? <span className="spinner" style={{width:16,height:16,border:'2px solid var(--border)',borderTopColor:'var(--brand)',borderRadius:'50%',animation:'spin 0.8s linear infinite'}} /> : 'Cobrar'}
            </button>
          </div>
        </form>
      </Modal>
    )
  );
}