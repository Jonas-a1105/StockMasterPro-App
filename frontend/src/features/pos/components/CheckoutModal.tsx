import { createPortal } from 'react-dom';
import { Printer, Plus } from 'lucide-react';
import { formatUsd } from '@shared/lib/format/currency';
import type { LastSale } from '../hooks/useCheckout';
import styles from '../pages/POSPage.module.css';

export function CheckoutModal({
  lastSale,
  onNewSale,
  onPrintTicket,
}: {
  lastSale: LastSale;
  onNewSale: () => void;
  onPrintTicket: () => void;
}) {
  const paymentLabel = (method: string) => {
    const labels: Record<string, string> = { cash: 'Efectivo', card: 'Tarjeta', transfer: 'Transferencia', mobile: 'Pago Móvil', mixed: 'Pago Mixto', credit: 'Crédito' };
    return labels[method] || method;
  };

  const showMixed = lastSale.paymentMethod === 'mixed' && lastSale.payments && lastSale.payments.length > 1;

  return createPortal(
    <div className={styles.modalOverlay} onClick={() => {}}>
      <div className={styles.modalCard} onClick={e => e.stopPropagation()} style={{ maxWidth: 420, padding: 0 }}>
        <div className={styles.successModalContent}>
          <div className={styles.successIconWrapper}>
            <svg className={styles.checkmark} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 52 52">
              <circle className={styles.checkmarkCircle} cx="26" cy="26" r="25" fill="none" />
              <path className={styles.checkmarkCheck} fill="none" d="M14.1 27.2l7.1 7.2 16.7-16.8" />
            </svg>
          </div>
          <div className={styles.successText}>¡Venta Completada!</div>
          <div className={styles.successSubtext}>
            Pago: {showMixed ? 'Pago Mixto' : paymentLabel(lastSale.paymentMethod)}
            {lastSale.customerName && ` — ${lastSale.customerName}`}
          </div>

          <div className={styles.ticketCard} id="sale-ticket">
            <div className={styles.ticketHeader}>
              <div className={styles.ticketBrand}>STOCKMASTER PRO</div>
              <div className={styles.ticketSubtitle}>Comprobante de Venta</div>
            </div>
            <div className={styles.ticketDivider} />
            <div className={styles.ticketDetails}>
              <div>Fecha: {lastSale.date.toLocaleDateString()} {lastSale.date.toLocaleTimeString()}</div>
              {showMixed ? (
                <div style={{ fontSize: 11, color: '#6b7280', marginTop: 4 }}>
                  {lastSale.payments?.map((p, i) => (
                    <div key={i} style={{ display: 'flex', justifyContent: 'space-between', padding: '2px 0', borderBottom: '1px dashed #e5e7eb' }}>
                      <span>{paymentLabel(p.paymentMethod)}</span>
                      <span>${p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div>Método: {paymentLabel(lastSale.paymentMethod)}</div>
              )}
              {lastSale.customerName && <div>Cliente: {lastSale.customerName}</div>}
            </div>
            <div className={styles.ticketDivider} />
            {lastSale.items.map((item, i) => (
              <div key={i} className={styles.ticketItem}>
                <div className={styles.ticketItemInfo}>
                  <span>{item.product.name}</span>
                  <span className={styles.ticketItemQtyPrice}>{item.quantity} x {formatUsd(item.product.price)}</span>
                </div>
                <span>{formatUsd(item.product.price * item.quantity)}</span>
              </div>
            ))}
            <div className={styles.ticketDivider} />
            <div className={styles.ticketTotals}>
              <div className={styles.ticketTotalRow}><span>Subtotal</span><span>{formatUsd(lastSale.subtotal)}</span></div>
              <div className={styles.ticketTotalRow}><span>IVA (16%)</span><span>{formatUsd(lastSale.tax)}</span></div>
              <div className={`${styles.ticketTotalRow} ${styles.ticketGrandTotal}`}><span>TOTAL</span><span>{formatUsd(lastSale.total)}</span></div>
            </div>
            <div className={styles.ticketFooter}>¡Gracias por su compra!</div>
          </div>

          <div className={styles.actionsRow}>
            <button className={styles.printBtn} onClick={onPrintTicket}>
              <Printer size={16} /> Ver Ticket
            </button>
            <button className={styles.newSaleBtn} onClick={onNewSale}>
              <Plus size={16} /> Nueva Venta
            </button>
          </div>
        </div>
      </div>,
    document.body
  );
}