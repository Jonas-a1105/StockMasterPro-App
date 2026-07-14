import { Package } from 'lucide-react';
import { InventoryProductCard } from '@features/inventory/components/InventoryProductCard';
import { useExchangeRate } from '@contexts/ExchangeRateContext';

interface PosProductCardProps {
  product: any;
  onAdd?: (product: any) => void;
  cartQuantity?: number;
}

export function PosProductCard({
  product,
  onAdd,
  cartQuantity = 0,
}: PosProductCardProps) {
  const { formatUsd, formatBs } = useExchangeRate();
  const availableStock = product.stock - cartQuantity;
  const isLocked = product.stock === 0 || availableStock <= 0;

  return (
    <ProductCard
      image={product.imageUrl}
      imageAlt={product.name}
      title={product.name}
      price={formatUsd(product.price)}
      priceSecondary={formatBs(product.price)}
      badges={[
        ...(product.stock === 0 ? [{ label: 'Agotado', variant: 'danger' as const }] : []),
        ...(availableStock === 0 && product.stock > 0 ? [{ label: 'Sin stock', variant: 'warning' as const }] : []),
      ]}
      stats={[
        { label: 'Stock', value: `${product.stock} ud.`, color: availableStock > 0 ? 'success' : 'danger' },
        { label: 'Disponible', value: `${availableStock} ud.`, color: 'info' },
      ]}
      actions={onAdd ? [{
        icon: (
          <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z"
            />
          </svg>
        ),
        label: 'Agregar',
        onClick: () => onAdd?.(product),
        variant: 'primary',
      }] : []}
      aspectRatio="1"
    />
  );
}