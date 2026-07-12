import { useState, useEffect, useMemo } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { SkeletonTable } from '@shared/ui/Skeleton';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { DataTable } from '@shared/ui/DataTable';
import { Badge } from '@shared/ui/Badge';
import { FormField } from '@shared/ui/FormField';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { getInventoryProducts, getInventoryAdjustments, adjustStock } from '../api/inventory.api';
import type { Product } from '@types';

const typeBadge = (type: string) => {
  if (type === 'waste' || type === 'theft') return 'danger';
  if (type === 'return') return 'info';
  return 'warning';
};

const typeLabel = (type: string) => {
  const labels: Record<string, string> = {
    adjustment: 'Ajuste',
    waste: 'Merma',
    return: 'Devolución',
    theft: 'Robo',
  };
  return labels[type] || type;
};

export function AdjustmentsTab() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();

  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({ quantity: 0, type: 'adjustment', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getInventoryProducts().then(setProducts).catch(() => {});
    getInventoryAdjustments()
      .then(setAdjustments)
      .catch(() => {})
      .finally(() => setLoadingAdjustments(false));
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await adjustStock(selectedProduct.id, {
        quantity: Number(form.quantity),
        type: form.type,
        notes: form.notes || null,
      });
      setShowModal(false);
      setSelectedProduct(null);
      setProductSearch('');
      setForm({ quantity: 0, type: 'adjustment', notes: '' });
      getInventoryAdjustments().then(setAdjustments).catch(() => {});
      showToast('Ajuste registrado exitosamente', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const adjustmentColumns = useMemo(
    () => [
      { key: 'date', header: 'Fecha', render: (a: any) => new Date(a.createdAt).toLocaleDateString() },
      { key: 'product', header: 'Producto', render: (a: any) => a.product?.name || a.productName || '—' },
      { key: 'type', header: 'Tipo', render: (a: any) => <Badge variant={typeBadge(a.type)}>{typeLabel(a.type)}</Badge> },
      { key: 'quantity', header: 'Cantidad', align: 'right' as const, render: (a: any) => (
        <span className={a.quantity >= 0 ? 'text-success' : 'text-danger'}>
          {a.quantity >= 0 ? '+' : ''}{a.quantity}
        </span>
      )},
      { key: 'notes', header: 'Notas', render: (a: any) => a.notes || '—' },
      { key: 'user', header: 'Usuario', render: (a: any) => a.user?.name || a.userName || '—' },
    ],
    []
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-text">Ajustes de Inventario</h3>
        {user?.role !== 'cajero' && (
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors" onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Ajuste
          </button>
        )}
      </div>

      <DataTable
        data={adjustments}
        columns={adjustmentColumns}
        keyExtractor={(a) => a.id}
        searchable
        searchPlaceholder="Buscar ajustes..."
        searchKeys={['productName', 'product?.name', 'notes', 'userName']}
        sortable
        emptyMessage="Sin ajustes registrados"
        loading={loadingAdjustments}
      />

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
          setProductSearch('');
        }}
        title="Registrar Ajuste de Inventario"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Producto" className="lg:col-span-3" required>
              <div className="relative">
                <Input
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={(e) => {
                    setProductSearch(e.target.value);
                    setShowDropdown(true);
                    setSelectedProduct(null);
                  }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && filteredProducts.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-surface border border-border rounded-lg shadow-lg overflow-hidden z-20 max-h-60 overflow-y-auto">
                    {filteredProducts.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setSelectedProduct(p);
                          setProductSearch(p.name);
                          setShowDropdown(false);
                        }}
                        className="w-full px-4 py-2.5 text-left hover:bg-bg-hover transition-colors flex items-center justify-between gap-2"
                      >
                        <span>{p.name}</span>
                        <span className="text-xs text-text-muted">Stock: {p.stock} | {formatPrice(p.cost)}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && (
                <p className="mt-2 text-sm text-text-muted">
                  Stock actual: <strong>{selectedProduct.stock}</strong> | Costo: <strong>{formatPrice(selectedProduct.cost)}</strong>
                </p>
              )}
            </FormField>

            <FormField label="Cantidad" required>
              <Input
                type="number"
                value={form.quantity || ''}
                onChange={(e) => setForm((p) => ({ ...p, quantity: Number(e.target.value) }))}
                placeholder="Positivo o negativo"
                required
              />
            </FormField>

            <FormField label="Tipo de Ajuste" required>
              <Select
                value={form.type}
                onChange={(val) => setForm((p) => ({ ...p, type: val }))}
                options={[
                  { value: 'adjustment', label: 'Ajuste' },
                  { value: 'waste', label: 'Merma' },
                  { value: 'return', label: 'Devolución' },
                  { value: 'theft', label: 'Robo' },
                ]}
                required
              />
            </FormField>

            <FormField label="Motivo / Notas" className="lg:col-span-3">
              <textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </FormField>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-border">
            <button
              type="submit"
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
              disabled={loading || !selectedProduct}
            >
              {loading ? <ButtonLoader /> : 'Registrar Ajuste'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}