import { useState, useEffect } from 'react';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { DollarSign, CreditCard, Smartphone, Banknote, CreditCard as TransferIcon, Users } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import type { SalePayment } from '../hooks/useCheckout';
import styles from '../pages/POSPage.module.css';

interface MixedPaymentModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (payments: SalePayment[]) => void;
  total: number;
  loading: boolean;
  paymentMethod?: string;
}

const METHOD_CONFIG = {
  cash: { label: 'Efectivo', icon: DollarSign, color: '#16a34a', bg: '#dcfce7' },
  card: { label: 'Tarjeta', icon: CreditCard, color: '#2563eb', bg: '#dbeafe' },
  mobile: { label: 'Pago Móvil', icon: Smartphone, color: '#7c3aed', bg: '#ede9fe' },
  transfer: { label: 'Transferencia', icon: TransferIcon, color: '#0891b2', bg: '#cffafe' },
  credit: { label: 'Crédito', icon: Users, color: '#ca8a04', bg: '#fef9c3' },
};

export function MixedPaymentModal({ open, onClose, onSubmit, total, loading, paymentMethod }: MixedPaymentModalProps) {
  const { formatPrice } = useExchangeRate();
  const [payments, setPayments] = useState<SalePayment[]>([]);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      const defaultMethod = paymentMethod || 'cash';
      setPayments([{ paymentMethod: defaultMethod as any, amount: total }]);
      setError('');
    }
  }, [open, total, paymentMethod]);

  const paidTotal = payments.reduce((sum, p) => sum + p.amount, 0);
  const remaining = total - paidTotal;

  const updatePayment = (idx: number, field: keyof SalePayment, value: any) => {
    setPayments(prev => prev.map((p, i) => i === idx ? { ...p, [field]: value } : p));
  };

  const addPayment = () => {
    if (paidTotal >= total) return;
    setPayments(prev => [...prev, { paymentMethod: 'cash', amount: Math.min(remaining, 0) }]);
  };

  const removePayment = (idx: number) => {
    if (payments.length <= 1) return;
    setPayments(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const totalPaid = payments.reduce((sum, p) => sum + (p.amount || 0), 0);
    if (Math.abs(totalPaid - total) > 0.01) {
      setError(`El total pagado (${formatPrice(totalPaid)}) debe ser igual al total de la venta (${formatPrice(total)})`);
      return;
    }

    if (payments.some(p => !p.amount || p.amount <= 0)) {
      setError('Todos los pagos deben tener un monto mayor a 0');
      return;
    }

    onSubmit(payments);
  };

  const methods = Object.entries(METHOD_CONFIG).map(([key, config]) => ({ key, ...config }));

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} title="Pago Mixto" wide>
      <form onSubmit={handleSubmit}>
        <p style={{ marginBottom: 16, color: 'var(--text-muted)', fontSize: 14 }}>
          Total a pagar: <strong>{formatPrice(total)}</strong> &nbsp;|&nbsp;
          Pagado: <strong style={{ color: remaining <= 0.01 ? '#16a34a' : '#ca8a04' }}>{formatPrice(paidTotal)}</strong> &nbsp;|&nbsp;
          Pendiente: <strong style={{ color: remaining > 0.01 ? '#dc2626' : '#16a34a' }}>{formatPrice(Math.max(0, remaining))}</strong>
        </p>

        {error && (
          <div style={{ padding: '12px', background: 'rgba(220,38,38,0.1)', border: '1px solid #dc2626', borderRadius: 8, marginBottom: 16, color: '#dc2626', fontSize: 13 }}>
            {error}
          </div>
        )}

        <table className="lista-table" style={{ marginBottom: 16 }}>
          <thead>
            <tr>
              <th>Método</th>
              <th style={{ width: 120 }}>Monto</th>
              {methods.map(m => (
                <th key={m.key} style={{ width: 140 }}>{m.label}</th>
              ))}
              <th style={{ width: 50 }}></th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment, idx) => (
              <tr key={idx}>
                <td>
                  <select
                    value={payment.paymentMethod}
                    onChange={e => updatePayment(idx, 'paymentMethod', e.target.value)}
                    style={{ width: 100, padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)' }}
                  >
                    {methods.map(m => (
                      <option key={m.key} value={m.key} style={{ background: m.bg }}>
                        {m.label}
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
                    style={{ width: '100%', padding: '6px 10px', borderRadius: 6, border: '1px solid var(--border)', textAlign: 'right' }}
                  />
                </td>
                {methods.map(m => (
                  <td key={m.key} style={{ textAlign: 'center', color: m.color, fontWeight: 600 }}>
                    {payment.paymentMethod === m.key ? formatPrice(payment.amount || 0) : '—'}
                  </td>
                ))}
                <td style={{ textAlign: 'center' }}>
                  {payments.length > 1 && (
                    <button type="button" onClick={() => removePayment(idx)} style={{ background: 'none', border: 'none', color: '#dc2626', cursor: 'pointer', fontSize: 16 }}>
                      ✕
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paidTotal < total - 0.01 && (
          <button type="button" className={styles.addBtn} onClick={addPayment} style={{ marginBottom: 16, width: '100%' }}>
            + Agregar otro método de pago (Pendiente: {formatPrice(Math.max(0, remaining))})
          </button>
        )}

        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" className={styles.saveBtn} disabled={loading || paidTotal >= total}>
            {loading ? <ButtonLoader /> : 'Cobrar'}
          </button>
        </div>
      </form>
    </Modal>
  );
}