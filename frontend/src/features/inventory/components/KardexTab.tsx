import { useState, useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { SkeletonTable } from '@shared/ui/Skeleton';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { DataTable } from '@shared/ui/DataTable';
import { getInventoryProducts, getInventoryMovements } from '../api/inventory.api';
import type { Product, InventoryMovement } from '@types';

const typeLabel = (type: string) => {
  const labels: Record<string, string> = {
    sale: 'Venta',
    purchase: 'Compra',
    adjustment: 'Ajuste',
    waste: 'Merma',
    return: 'Devolución',
    theft: 'Robo',
  };
  return labels[type] || type;
};

const typeBadgeVariant = (type: string) => {
  if (type === 'sale' || type === 'exit') return 'danger';
  if (type === 'purchase' || type === 'entry') return 'success';
  return 'warning';
};

export function KardexTab() {
  const { config } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getInventoryProducts()
      .then(setProducts)
      .catch(() => {});
  }, []);

  const filteredProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
          p.barcode?.includes(productSearch)
      ),
    [products, productSearch]
  );

  const loadMovements = async (productId: string) => {
    setLoading(true);
    try {
      setMovements(await getInventoryMovements(productId));
    } catch {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setShowDropdown(false);
    loadMovements(product.id);
  };

  const movementColumns = useMemo(
    () => [
      { key: 'date', header: 'Fecha', render: (m: InventoryMovement) => new Date(m.createdAt).toLocaleString() },
      { key: 'type', header: 'Tipo', render: (m: InventoryMovement) => (
        <Badge variant={typeBadgeVariant(m.type)}>{typeLabel(m.type)}</Badge>
      )},
      { key: 'quantity', header: 'Cantidad', align: 'right' as const, render: (m: InventoryMovement) => (
        <span className={m.quantity > 0 ? 'text-success' : 'text-danger'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</span>
      )},
      { key: 'reference', header: 'Referencia', render: (m: InventoryMovement) => m.reference || '—' },
      { key: 'user', header: 'Usuario', render: (m: InventoryMovement) => m.userId ? m.userId.slice(0, 8) : '—' },
    ],
    []
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text">Kardex de Inventario</h3>
      </div>

      <div className="mb-6">
        <label className="block text-xs font-semibold text-text-muted mb-2">Producto</label>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar producto..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowDropdown(true);
              setSelectedProduct(null);
              setMovements([]);
            }}
            onFocus={() => setShowDropdown(true)}
            className="w-full px-4 py-2.5 border border-border rounded-lg bg-surface text-text placeholder-text-muted focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          {showDropdown && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20 max-h-60 overflow-y-auto">
              {filteredProducts.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProduct(p)}
                  className="w-full px-4 py-2.5 text-left hover:bg-bg-hover transition-colors flex items-center justify-between gap-2"
                >
                  <span>{p.name}</span>
                  <span className="text-xs text-text-muted">Stock: {p.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <>
          <div className="flex items-center gap-2 mb-4 p-3 bg-surface border border-border rounded-lg">
            <Package size={18} className="text-primary" />
            <span>
              <strong>{selectedProduct.name}</strong> — Stock actual: {selectedProduct.stock}
            </span>
          </div>
          {loading ? (
            config.skeletonEnabled ? (
              <SkeletonTable rows={5} cols={5} />
            ) : (
              <LoadingDots text="Cargando movimientos..." />
            )
          ) : (
            <DataTable
              data={movements}
              columns={movementColumns}
              keyExtractor={(m) => m.id}
              emptyMessage="Sin movimientos"
              searchable={false}
              sortable={false}
              showPagination={false}
            />
          )}
        </>
      )}
    </>
  );
}