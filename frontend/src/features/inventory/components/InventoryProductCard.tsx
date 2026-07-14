import { Eye, Edit2, Trash2 } from 'lucide-react';
import { MediaCard } from '@shared/ui';
import { formatUsd } from '@shared/lib/format/currency';

interface InventoryProductCardProps {
  product: any;
  onView?: (product: any) => void;
  onEdit?: (product: any) => void;
  onDelete?: (product: any) => void;
  showActions?: boolean;
  canEdit?: boolean;
}

export function InventoryProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  showActions = true,
  canEdit = true,
}: InventoryProductCardProps) {
  const isLowStock = product.stock <= product.minStock;
  const isOutOfStock = product.stock === 0;

  const actions = showActions && canEdit ? [
    onView && {
      icon: <Eye size={14} />,
      label: 'Ver',
      onClick: () => onView?.(product),
      variant: 'secondary' as const,
    },
    onEdit && {
      icon: <Edit2 size={14} />,
      label: 'Editar',
      onClick: () => onEdit?.(product),
      variant: 'secondary' as const,
    },
    onDelete && {
      icon: <Trash2 size={14} />,
      label: 'Eliminar',
      onClick: () => onDelete?.(product),
      variant: 'danger' as const,
    },
  ].filter(Boolean) as any[] : [];

  return (
    <MediaCard
      image={product.imageUrl}
      imageAlt={product.name}
      title={product.name}
      subtitle={product.barcode || undefined}
      price={formatUsd(product.price)}
      badges={[
        ...(isOutOfStock ? [{ label: 'Agotado', variant: 'danger' as const }] : []),
        ...(isLowStock && !isOutOfStock ? [{ label: 'Bajo Stock', variant: 'danger' as const }] : []),
      ]}
      stats={[
        { label: 'Stock', value: `${product.stock} ud.`, color: isLowStock || isOutOfStock ? 'danger' : 'success' },
        { label: 'Mín.', value: `${product.minStock}`, color: 'info' },
      ]}
      actions={actions}
      aspectRatio="1"
    />
  );
}