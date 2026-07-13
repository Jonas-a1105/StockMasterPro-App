import { Package, Eye, Edit2, Trash2, Plus, ShoppingCart } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Card } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';
import { formatUsd, formatBs } from '@shared/lib/format/currency';
import styles from './ProductCard.module.css';

type Variant = 'inventory' | 'pos';

interface ProductCardProps {
  product: any;
  variant?: Variant;
  onView?: (product: any) => void;
  onEdit?: (product: any) => void;
  onDelete?: (product: any) => void;
  onAdd?: (product: any) => void;
  showActions?: boolean;
  canEdit?: boolean;
  cartItem?: { quantity: number } | null;
}

export function ProductCard({
  product,
  variant = 'inventory',
  onView,
  onEdit,
  onDelete,
  onAdd,
  showActions = true,
  canEdit = true,
  cartItem = null,
}: ProductCardProps) {
  const { formatUsd: formatUsdHook, formatBs: formatBsHook } = useExchangeRate();
  const isLowStock = product.stock <= product.minStock;
  const isOutOfStock = product.stock === 0;
  
  // POS-specific calculations
  const addedQty = cartItem ? cartItem.quantity : 0;
  const availableStock = product.stock - addedQty;
  const isLocked = product.stock === 0 || availableStock <= 0;

  if (variant === 'pos') {
    return (
      <div className={`${styles.posCard} ${isLocked ? styles.posLocked : ''}`}>
        <div className={styles.posImageContainer} onClick={() => !isLocked && onAdd?.(product)}>
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" />
          ) : (
            <Package size={28} className={styles.posPlaceholder} />
          )}
          {addedQty > 0 && <div className={styles.posCartBadge}>{addedQty}</div>}
          {product.stock === 0 ? (
            <div className={`${styles.posBadge} ${styles.posBadgeOut}`}>Agotado</div>
          ) : availableStock === 0 ? (
            <div className={`${styles.posBadge} ${styles.posBadgeOut}`}>Sin stock</div>
          ) : null}
        </div>
        <div className={styles.posInfoGrid}>
          <div className={styles.posPriceUsd}>{formatUsdHook(product.price)}</div>
          <div className={styles.posUnitsStock}>{product.stock} ud.</div>
          <div className={styles.posProductName}>{product.name}</div>
        </div>
        <div className={styles.posBottomCapsule}>
          <div className={styles.posPriceBsRow}>
            <span className={styles.posPriceBsLabel}>Ref. Bs</span>
            <span className={styles.posPriceBsValue}>{formatBsHook(product.price)}</span>
          </div>
          <div className={styles.posActionsRow}>
            <button 
              className={styles.posAddBtn} 
              onClick={() => onAdd?.(product)} 
              disabled={isLocked}
            >
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
              <span>Agregar</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Inventory variant
  return (
    <Card className={styles.inventoryCard} padding={false}>
      <div
        className={styles.inventoryImageContainer}
        onClick={() => onView?.(product)}
      >
        {product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt=""
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-surface-muted">
            <Package size={28} className="text-text-muted" />
          </div>
        )}
        {isOutOfStock ? (
          <div className={styles.badgeOutOfStock}>Agotado</div>
        ) : isLowStock ? (
          <div className={styles.badgeLowStock}>Bajo Stock</div>
        ) : null}
      </div>

      <div className={styles.inventoryContent}>
        <div className={styles.inventoryHeader}>
          <div className="flex-1 min-w-0">
            <Text variant="h4" weight="semibold" className="truncate" title={product.name}>
              {product.name}
            </Text>
            {product.barcode && (
              <Text variant="caption" color="muted" className="truncate">
                {product.barcode}
              </Text>
            )}
          </div>
          <Text variant="h3" weight="semibold">
            {formatUsd(product.price)}
          </Text>
        </div>

        <div className={styles.inventoryStock}>
          <div className="flex items-center gap-1">
            <Text variant="caption" color="muted">Stock</Text>
            <Text 
              variant="bodySm" 
              weight="semibold" 
              color={isLowStock ? 'danger' : isOutOfStock ? 'danger' : 'success'}
            >
              {product.stock} ud.
            </Text>
            <Text variant="caption" color="muted">
              / {product.minStock} min.
            </Text>
          </div>
          <span className={styles.inventoryStatusBadge}>
            {isLowStock || isOutOfStock ? 'Crítico' : 'OK'}
          </span>
        </div>

        {canEdit && showActions && (
          <div className={styles.inventoryActions}>
            {onView && (
              <button
                onClick={() => onView(product)}
                className={styles.inventoryActionBtn}
                title="Ver detalles"
              >
                <Eye size={14} /> Ver
              </button>
            )}
            {onEdit && (
              <button
                onClick={() => onEdit(product)}
                className={styles.inventoryActionBtn}
                title="Editar"
              >
                <Edit2 size={14} /> Editar
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(product)}
                className={`${styles.inventoryActionBtn} ${styles.inventoryActionBtnDanger}`}
                title="Eliminar"
              >
                <Trash2 size={14} /> Eliminar
              </button>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}