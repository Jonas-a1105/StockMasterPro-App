import { Eye, Edit2, Trash2, Package } from 'lucide-react';
import { Card } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { formatUsd, formatBs } from '@shared/lib/format/currency';

interface ProductCardProps {
  product: any;
  onView: (product: any) => void;
  onEdit: (product: any) => void;
  onDelete: (product: any) => void;
  canEdit: boolean;
  onImageClick?: () => void;
}

export function ProductCard({
  product,
  onView,
  onEdit,
  onDelete,
  canEdit,
  onImageClick,
}: ProductCardProps) {
  const isLowStock = product.stock <= product.minStock;
  const isOutOfStock = product.stock === 0;

  return (
    <Card className="flex flex-col gap-2" padding={false}>
      <div
        className="relative aspect-square rounded-t-xl overflow-hidden cursor-pointer"
        onClick={onImageClick || (() => onView(product))}
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
          <div className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-danger text-white rounded-sm">
            Agotado
          </div>
        ) : isLowStock ? (
          <div className="absolute top-2 right-2 px-2 py-1 text-xs font-semibold bg-warning text-warning-fg rounded-sm">
            Bajo Stock
          </div>
        ) : null}
      </div>

      <div className="p-3 flex flex-col gap-2 flex-1">
        <div className="flex justify-between items-baseline gap-2">
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

        <div className="flex justify-between items-center gap-2">
          <div className="flex items-center gap-1">
            <Text variant="caption" color="muted">Stock</Text>
            <Text variant="bodySm" weight="semibold" color={isLowStock ? 'danger' : isOutOfStock ? 'danger' : 'success'}>
              {product.stock} ud.
            </Text>
            <Text variant="caption" color="muted">
              / {product.minStock} min.
            </Text>
          </div>
          <span
            className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
              isLowStock || isOutOfStock
                ? 'bg-danger/10 text-danger'
                : 'bg-success/10 text-success'
            }`}
          >
            {isLowStock || isOutOfStock ? 'Crítico' : 'OK'}
          </span>
        </div>

        {canEdit && (
          <div className="flex gap-2 pt-2 border-t border-border">
            <button
              onClick={() => onView(product)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors border border-border rounded-md"
              title="Ver detalles"
            >
              <Eye size={14} /> Ver
            </button>
            <button
              onClick={() => onEdit(product)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors border border-border rounded-md"
              title="Editar"
            >
              <Edit2 size={14} /> Editar
            </button>
            <button
              onClick={() => onDelete(product)}
              className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-danger transition-colors border border-danger/20 rounded-md hover:border-danger"
              title="Eliminar"
            >
              <Trash2 size={14} /> Eliminar
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}