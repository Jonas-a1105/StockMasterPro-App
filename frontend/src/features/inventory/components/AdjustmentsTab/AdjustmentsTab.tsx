import { useState, useEffect, useMemo } from 'react';
import { Plus } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Button, Modal, ButtonLoader, Badge, FormField, Input, Select, SearchableSelect, Textarea, Text, Heading } from '@shared/ui';
import { DataTable } from '@shared/ui';
import { getInventoryProducts, getInventoryAdjustments, adjustStock } from '../../api/inventory.api';
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

  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [form, setForm] = useState({ quantity: 0, type: 'adjustment', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    getInventoryProducts().then(setProducts).catch(() => {});
    getInventoryAdjustments()
      .then(setAdjustments)
      .catch(() => {});
  }, []);

  const productOptions = useMemo(
    () => products.map((p) => ({ value: p.id, label: `${p.name} (Stock: ${p.stock})` })),
    [products]
  );

  const handleProductChange = (value: string) => {
    const product = products.find((p) => p.id === value);
    if (product) {
      setSelectedProduct(product);
    }
  };

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
        <Text color={a.quantity >= 0 ? 'success' : 'danger'}>
          {a.quantity >= 0 ? '+' : ''}{a.quantity}
        </Text>
      )},
      { key: 'notes', header: 'Notas', render: (a: any) => a.notes || '—' },
      { key: 'user', header: 'Usuario', render: (a: any) => a.user?.name || a.userName || '—' },
    ],
    []
  );

  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <Heading variant="h3">Ajustes de Inventario</Heading>
        {user?.role !== 'cajero' && (
          <Button onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Ajuste
          </Button>
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
      />

      <Modal
        open={showModal}
        onClose={() => {
          setShowModal(false);
          setSelectedProduct(null);
        }}
        title="Registrar Ajuste de Inventario"
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Producto" className="lg:col-span-3" required>
              <SearchableSelect
                value={selectedProduct?.id || ''}
                onChange={handleProductChange}
                options={productOptions}
                placeholder="Buscar producto..."
                emptyLabel="Sin resultados"
              />
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
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))}
                rows={2}
              />
            </FormField>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-border">
            <Button type="submit" disabled={loading || !selectedProduct}>
              {loading ? <ButtonLoader /> : 'Registrar Ajuste'}
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
