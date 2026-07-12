import {
  DollarSign,
  CreditCard,
  Ban,
  Users,
  AlertTriangle,
  Smartphone,
  RotateCcw,
} from 'lucide-react';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { formatUsd } from '@shared/lib/format/currency';
import type { PaymentMethod } from '../types';
import type { Customer } from '@types';
import styles from '../pages/POSPage.module.css';

export function PaymentPanel({
  subtotal,
  tax,
  total,
  paymentMethod,
  onPaymentMethodChange,
  onCheckout,
  loading,
  cartEmpty,
  customers,
  selectedCustomerId,
  onCustomerChange,
  creditExceeded,
  selectedCustomer,
}: {
  subtotal: number;
  tax: number;
  total: number;
  paymentMethod: PaymentMethod;
  onPaymentMethodChange: (m: PaymentMethod) => void;
  onCheckout: () => void;
  loading: boolean;
  cartEmpty: boolean;
  customers: Customer[];
  selectedCustomerId: string;
  onCustomerChange: (id: string) => void;
  creditExceeded: boolean;
  selectedCustomer: Customer | undefined;
}) {
  const { formatPrice } = useExchangeRate();

  return (
    <>
      <div className={styles.cartSummary}>
        <div className={styles.summaryRow}>
          <span>Subtotal</span>
          <span>{formatPrice(subtotal, { showUsd: true })}</span>
        </div>
        <div className={styles.summaryRow}>
          <span>IVA (16%)</span>
          <span>{formatPrice(tax, { showUsd: true })}</span>
        </div>
        <div className={`${styles.summaryRow} ${styles.totalRow}`}>
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>

      <div className={styles.paymentMethods}>
        {(['cash', 'card', 'transfer', 'mobile', 'mixed', 'credit'] as PaymentMethod[]).map(
          (method) => {
            const icons = {
              cash: DollarSign,
              card: CreditCard,
              transfer: Ban,
              mobile: Smartphone,
              mixed: RotateCcw,
              credit: Users,
            };
            const labels = {
              cash: 'Efectivo',
              card: 'Tarjeta',
              transfer: 'Transferencia',
              mobile: 'Pago Móvil',
              mixed: 'Pago Mixto',
              credit: 'Crédito',
            };
            const Icon = icons[method];
            return (
              <button
                key={method}
                className={`${styles.paymentBtn} ${paymentMethod === method ? styles.active : ''}`}
                onClick={() => onPaymentMethodChange(method)}
              >
                <Icon size={16} /> {labels[method]}
              </button>
            );
          }
        )}
      </div>

      {paymentMethod === 'credit' && (
        <div className={styles.customerSelectContainer}>
          <label className={styles.customerLabel}>Seleccionar Cliente</label>
          <select
            className={styles.customerSelect}
            value={selectedCustomerId}
            onChange={(e) => onCustomerChange(e.target.value)}
          >
            <option value="">-- Seleccionar --</option>
            {customers.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} — Saldo: {formatUsd(Number(c.balance))} / Límite:{' '}
                {formatUsd(Number(c.creditLimit))}
              </option>
            ))}
          </select>
          {creditExceeded && selectedCustomer && (
            <div className={styles.creditExceededAlert}>
              <AlertTriangle size={14} />
              <span>
                Límite de crédito excedido. Saldo actual:{' '}
                {formatUsd(Number(selectedCustomer.balance))}
              </span>
            </div>
          )}
        </div>
      )}

      <button
        className={styles.checkoutBtn}
        onClick={onCheckout}
        disabled={
          cartEmpty ||
          loading ||
          (paymentMethod === 'credit' && !selectedCustomerId) ||
          creditExceeded
        }
      >
        {loading ? <ButtonLoader /> : <>Cobrar</>}
      </button>
    </>
  );
}
