import { Minus, Plus, Trash2 } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import type { CartItem as CartItemType } from '@types';
import styles from '../../pages/POSPage/POSPage.module.css';

export function CartItemRow({
  item,
  onUpdateQty,
  onRemove,
}: {
  item: CartItemType;
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
}) {
  const { formatPrice } = useExchangeRate();

  return (
    <div className={styles.cartItem}>
      <div className={styles.cartItemInfo}>
        <div className={styles.cartItemName}>{item.product.name}</div>
        <div className={styles.cartItemPrice}>
          {formatPrice(item.product.price, { showUsd: true })}
        </div>
      </div>
      <div className={styles.cartItemActions}>
        <button onClick={() => onUpdateQty(item.product.id, -1)}>
          <Minus size={14} />
        </button>
        <span className={styles.qty}>{item.quantity}</span>
        <button onClick={() => onUpdateQty(item.product.id, 1)}>
          <Plus size={14} />
        </button>
        <button className={styles.deleteBtn} onClick={() => onRemove(item.product.id)}>
          <Trash2 size={14} />
        </button>
      </div>
      <div className={styles.cartItemTotal}>{formatPrice(item.product.price * item.quantity)}</div>
    </div>
  );
}
