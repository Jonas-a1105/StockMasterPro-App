import { ShoppingCart, PauseCircle, Wallet, Receipt } from 'lucide-react';
import { CartItemRow } from './CartItem';
import type { CartItem } from '@types';
import type { PausedCart } from '../types';
import styles from '../pages/POSPage.module.css';

export function Cart({
  items,
  onUpdateQty,
  onRemove,
  totalItems,
  isOnline,
  onPauseOrder,
  onOpenCash,
  onOpenExpense,
  carts,
  onResumeOrder,
  onDiscardCart,
}: {
  items: CartItem[];
  onUpdateQty: (productId: string, delta: number) => void;
  onRemove: (productId: string) => void;
  totalItems: number;
  isOnline: boolean;
  onPauseOrder: () => void;
  onOpenCash: () => void;
  onOpenExpense: () => void;
  carts: PausedCart[];
  onResumeOrder: (cart: PausedCart) => void;
  onDiscardCart: (cartId: string) => void;
}) {
  return (
    <>
      <div className={styles.cartTabs}>
        <button className={`${styles.cartTab} ${styles.cartTabActive}`}>
          <ShoppingCart size={14} /> Carrito Actual
        </button>
        {carts.map(pc => (
          <div key={pc.id} className={styles.cartTab}>
            <button className={styles.cartTabBtn} onClick={() => onResumeOrder(pc)}>
              <PauseCircle size={14} /> {pc.name}
            </button>
            <button className={styles.cartTabClose} onClick={() => onDiscardCart(pc.id)}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
            </button>
          </div>
        ))}
      </div>

      <div className={styles.cartHeader}>
        <ShoppingCart size={18} />
        <span>Carrito ({items.length})</span>
        <span className={`${styles.status} ${isOnline ? styles.online : styles.offline}`}>
          {isOnline ? 'En línea' : 'Offline'}
        </span>
      </div>

      <div className={styles.toolbarRow}>
        {items.length > 0 && (
          <button className={styles.toolbarBtn} onClick={onPauseOrder}>
            <PauseCircle size={14} /> Pausar Orden
          </button>
        )}
        <button className={styles.toolbarBtn} onClick={onOpenCash}>
          <Wallet size={14} /> Caja
        </button>
        <button className={styles.toolbarBtn} onClick={onOpenExpense}>
          <Receipt size={14} /> Gasto
        </button>
      </div>

      <div className={styles.cartItems}>
        {items.map(item => (
          <CartItemRow key={item.product.id} item={item} onUpdateQty={onUpdateQty} onRemove={onRemove} />
        ))}
        {items.length === 0 && (
          <p className={styles.emptyCart}>Selecciona productos para agregar al carrito</p>
        )}
      </div>
    </>
  );
}
