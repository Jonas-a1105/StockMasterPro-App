import { MediaCard } from '@shared/ui';
import { Eye, Edit2, Trash2 } from 'lucide-react';
import type { Product } from '@types';

interface ProductCardViewProps {
  products: Product[];
  canManage: boolean;
  formatUsd: (v: number) => string;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
}

export function ProductCardView({
  products,
  canManage,
  formatUsd,
  onView,
  onEdit,
  onDelete,
}: ProductCardViewProps) {
  if (products.length === 0) {
    return (
      <div className="col-span-full flex items-center justify-center py-12 text-text-muted">
        No hay productos registrados
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {products.map((product) => {
        const isLowStock = product.stock <= product.minStock;
        const isOutOfStock = product.stock === 0;

        return (
          <MediaCard
            key={product.id}
            image={product.imageUrl}
            imageAlt={product.name}
            title={product.name}
            subtitle={product.barcode}
            price={formatUsd(product.price)}
            badges={[
              ...(isOutOfStock ? [{ label: 'Agotado', variant: 'danger' as const }] : []),
              ...(isLowStock && !isOutOfStock ? [{ label: 'Bajo Stock', variant: 'danger' as const }] : []),
            ]}
            stats={[
              { label: 'Stock', value: `${product.stock} ud.`, color: isLowStock || isOutOfStock ? 'danger' : 'success' },
              { label: 'Mín.', value: `${product.minStock}`, color: 'info' },
            ]}
            actions={canManage ? [
              { icon: <Eye size={14} />, label: 'Ver', onClick: () => onView(product), variant: 'secondary' },
              { icon: <Edit2 size={14} />, label: 'Editar', onClick: () => onEdit(product), variant: 'secondary' },
              { icon: <Trash2 size={14} />, label: 'Eliminar', onClick: () => onDelete(product.id, product.name), variant: 'danger' },
            ] : []}
            aspectRatio="1"
          />
        );
      })}
    </div>
  );
}