import { useState, useEffect, useMemo } from 'react';
import { Package } from 'lucide-react';
import { Button, Input, Badge, SkeletonTable, Heading, Text } from '@shared/ui';
import { DataTable } from '@shared/ui';
import { getInventoryProducts, getInventoryMovements } from '../../api/inventory.api';
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
        <Text color={m.quantity > 0 ? 'success' : 'danger'}>{m.quantity > 0 ? '+' : ''}{m.quantity}</Text>
      )},
      { key: 'reference', header: 'Referencia', render: (m: InventoryMovement) => m.reference || '—' },
      { key: 'user', header: 'Usuario', render: (m: InventoryMovement) => m.userId ? m.userId.slice(0, 8) : '—' },
    ],
    []
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Heading variant="h3">Kardex de Inventario</Heading>
      </div>

      <div className="mb-6">
        <Text as="label" variant="label" className="block mb-2">Producto</Text>
        <div className="relative">
          <Input
            placeholder="Buscar producto..."
            value={productSearch}
            onChange={(e) => {
              setProductSearch(e.target.value);
              setShowDropdown(true);
              setSelectedProduct(null);
              setMovements([]);
            }}
            onFocus={() => setShowDropdown(true)}
          />
          {showDropdown && filteredProducts.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20 max-h-60 overflow-y-auto">
              {filteredProducts.map((p) => (
                <Button
                  key={p.id}
                  variant="ghost"
                  onClick={() => selectProduct(p)}
                  className="w-full text-left flex items-center justify-between gap-2 px-4 py-2.5"
                >
                  <Text>{p.name}</Text>
                  <Text variant="body-sm" color="muted">Stock: {p.stock}</Text>
                </Button>
              ))}
            </div>
          )}
        </div>
      </div>

      {selectedProduct && (
        <>
          <div className="flex items-center gap-2 mb-4 p-3 bg-surface border border-border rounded-lg">
            <Package size={18} className="text-primary" />
            <Text>
              <strong>{selectedProduct.name}</strong> — Stock actual: {selectedProduct.stock}
            </Text>
          </div>
          {loading ? (
            <SkeletonTable rows={5} cols={5} />
          ) : (
            <DataTable
              data={movements}
              columns={movementColumns}
              keyExtractor={(m) => m.id}
              emptyMessage="Sin movimientos"
              searchable={false}
              sortable={false}
            />
          )}
        </>
      )}
    </>
  );
}
