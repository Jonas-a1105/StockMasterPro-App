import { Package } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import type { Product, CartItem } from '@types';
import styles from '../pages/POSPage.module.css';

export function ProductCard({
  product,
  onAdd,
  cartItem,
}: {
  product: Product;
  onAdd: (product: Product) => void;
  cartItem?: CartItem;
}) {
  const { formatUsd, formatBs } = useExchangeRate();
  const addedQty = cartItem ? cartItem.quantity : 0;
  const availableStock = product.stock - addedQty;
  const isLocked = product.stock === 0 || availableStock <= 0;

  return (
    <div className={`${styles.productCard} ${isLocked ? styles.prodOutOfStock : ''}`}>
      <div
        className={styles.prodImageContainer}
        onClick={() => {
          if (!isLocked) onAdd(product);
        }}
      >
        {product.imageUrl ? (
          <img src={product.imageUrl} alt="" />
        ) : (
          <Package size={28} className={styles.placeholderIcon} />
        )}
        {addedQty > 0 && <div className={styles.prodCartCountBadge}>{addedQty}</div>}
        {product.stock === 0 ? (
          <div className={`${styles.prodBadge} ${styles.prodBadgeOut}`}>Agotado</div>
        ) : availableStock === 0 ? (
          <div className={`${styles.prodBadge} ${styles.prodBadgeOut}`}>Sin stock</div>
        ) : null}
      </div>
      <div className={styles.prodInfoGrid}>
        <div className={styles.prodPriceUsd}>{formatUsd(product.price)}</div>
        <div className={styles.prodUnitsStock}>{product.stock} ud.</div>
        <div className={styles.prodProductName}>{product.name}</div>
      </div>
      <div className={styles.prodBottomCapsule}>
        <div className={styles.prodPriceBsRow}>
          <span className={styles.prodPriceBsLabel}>Ref. Bs</span>
          <span className={styles.prodPriceBsValue}>{formatBs(product.price)}</span>
        </div>
        <div className={styles.prodActionsRow}>
          <button className={styles.prodAddBtn} onClick={() => onAdd(product)} disabled={isLocked}>
            <svg
              width="12"
              height="12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"
              />
            </svg>
            Agregar
          </button>
        </div>
      </div>
    </div>
  );
}
