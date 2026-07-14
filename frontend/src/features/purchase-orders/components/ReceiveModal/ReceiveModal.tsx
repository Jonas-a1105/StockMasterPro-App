import { useState } from 'react';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import type { PurchaseOrder, Product } from '@types';
import styles from '../ReceiveModal/ReceiveModal.module.css';

export function ReceiveModal({
  open,
  order,
  onClose,
  onSubmit,
  loading,
}: {
  open: boolean;
  order: PurchaseOrder | null;
  onClose: () => void;
  onSubmit: (id: string, items: { productId: string; quantity: number }[]) => Promise<void>;
  loading: boolean;
}) {
  const { formatPrice } = useExchangeRate();
  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const initQuantities = () => {
    if (!order) return;
    const q: Record<string, number> = {};
    for (const item of order.items) {
      q[item.id] = item.quantity - item.receivedQty;
    }
    setQuantities(q);
  };

  if (open && order && Object.keys(quantities).length === 0) {
    initQuantities();
  }

  const updateQty = (itemId: string, item: PurchaseOrder['items'][0], val: number) => {
    const remaining = item.quantity - item.receivedQty;
    setQuantities((p) => ({ ...p, [itemId]: Math.max(0, Math.min(val, remaining)) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;
    const items = order.items
      .filter((i) => (quantities[i.id] ?? 0) > 0)
      .map((i) => ({ productId: i.productId, quantity: quantities[i.id] ?? 0 }));
    if (items.length === 0) return;
    await onSubmit(order.id, items);
    setQuantities({});
  };

  const total = order
    ? order.items.reduce((sum, i) => sum + (quantities[i.id] ?? 0) * Number(i.cost), 0)
    : 0;

  if (!order) return null;

  return (
    <Modal open={open} onClose={onClose} title="Recibir Orden de Compra" wide>
      <form onSubmit={handleSubmit}>
        <p className={`${styles.colorMuted} ${styles.fontSize14} ${styles.mb16}`}>
          Orden #{order.id.slice(0, 8)} — Ajusta las cantidades a recibir por producto.
        </p>
        <table className="table" className={styles.mb16}>
          <thead>
            <tr>
              <th>Producto</th>
              <th className={styles.textCenter}>Pedido</th>
              <th className={styles.textCenter}>Recibido</th>
              <th className={styles.textCenter}>Por recibir</th>
              <th className={`${styles.textCenter} ${styles.w100}`}>Recibir ahora</th>
              <th className={styles.textRight}>Costo</th>
              <th className={styles.textRight}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item) => {
              const remaining = item.quantity - item.receivedQty;
              return (
                <tr key={item.id}>
                  <td>{item.productId.slice(0, 8)}</td>
                  <td className={styles.textCenter}>{item.quantity}</td>
                  <td className={styles.textCenter}>{item.receivedQty}</td>
                  <td className={styles.textCenter}>{remaining}</td>
                  <td className={styles.textCenter}>
                    <input
                      type="number"
                      min={0}
                      max={remaining}
                      value={quantities[item.id] ?? 0}
                      onChange={(e) => updateQty(item.id, item, Number(e.target.value))}
                      className={`${styles.w70} ${styles.p4px8} ${styles.rounded6} ${styles.borderBorder} ${styles.textCenter}`}
                    />
                  </td>
                  <td className={styles.textRight}>{formatPrice(item.cost)}</td>
                  <td className={styles.textRight}>
                    {formatPrice((quantities[item.id] ?? 0) * Number(item.cost))}
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr>
              <td colSpan={5}></td>
              <td className={`${styles.textRight} ${styles.bold}`}>Total:</td>
              <td className={`${styles.textRight} ${styles.bold}`}>{formatPrice(total)}</td>
            </tr>
          </tfoot>
        </table>
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            Cancelar
          </button>
          <button
            type="submit"
            className={styles.saveBtn}
            disabled={loading || Object.values(quantities).every((v) => v <= 0)}
          >
            {loading ? <ButtonLoader /> : 'Recibir'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
