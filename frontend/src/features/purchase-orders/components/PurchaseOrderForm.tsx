import { useState, useEffect } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { getSuppliers } from '@features/suppliers/api/suppliers.api';
import { api } from '@shared/lib/http/client';
import type { Product, Supplier } from '@types';
import styles from '@features/inventory/pages/InventoryPage.module.css';

export function PurchaseOrderForm({
  open, onClose, onSubmit, loading,
}: {
  open: boolean; onClose: () => void; onSubmit: (data: any) => Promise<void>; loading: boolean;
}) {
  const { formatPrice } = useExchangeRate();
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [] as { productId: string; quantity: number; cost: number }[] });

  useEffect(() => {
    if (open) {
      api.getProducts().then(setProducts).catch(() => {});
      getSuppliers().then(setSuppliers).catch(() => {});
    }
  }, [open]);

  const addItem = () => setForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1, cost: 0 }] }));
  const removeItem = (idx: number) => setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  const updateItem = (idx: number, field: string, value: any) => {
    setForm(p => { const items = [...p.items]; items[idx] = { ...items[idx], [field]: value }; return { ...p, items }; });
  };
  const total = form.items.reduce((sum, item) => sum + item.quantity * item.cost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit({
      supplierId: form.supplierId || null,
      notes: form.notes || null,
      items: form.items.map(i => ({ productId: i.productId, quantity: i.quantity, cost: i.cost })),
    });
    setForm({ supplierId: '', notes: '', items: [] });
  };

  return (
    <Modal open={open} onClose={onClose} title="Nueva Orden de Compra" wide>
      <form onSubmit={handleSubmit}>
        <div className={styles.formGrid}>
          <div className={styles.field}>
            <label>Proveedor</label>
            <select value={form.supplierId} onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}>
              <option value="">Sin proveedor</option>
              {suppliers.map(s => (<option key={s.id} value={s.id}>{s.name}</option>))}
            </select>
          </div>
          <div className={styles.fieldFull}>
            <label>Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
        </div>
        <div className={styles.poItemsHeader}>
          <h4>Productos</h4>
          <button type="button" className={styles.addBtn} onClick={addItem}><Plus size={16} /> Agregar Producto</button>
        </div>
        {form.items.length > 0 && (
          <div className={styles.poItems}>
            {form.items.map((item, idx) => (
              <div key={idx} className={styles.poItemRow}>
                <div className={styles.field} style={{ flex: 2 }}>
                  <label>Producto</label>
                  <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} required>
                    <option value="">Seleccionar...</option>
                    {products.map(p => (<option key={p.id} value={p.id}>{p.name} ({formatPrice(p.cost)})</option>))}
                  </select>
                </div>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Cantidad</label>
                  <input type="number" min="1" value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} required placeholder="1" />
                </div>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Costo Uni.</label>
                  <input type="number" step="0.01" min="0" value={item.cost || ''} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} required placeholder="0.00" />
                </div>
                <div className={styles.field} style={{ flex: 1 }}>
                  <label>Subtotal</label>
                  <div className={styles.poSubtotal}>{formatPrice(item.quantity * item.cost)}</div>
                </div>
                <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(idx)}><X size={16} /></button>
              </div>
            ))}
          </div>
        )}
        <div className={styles.poTotal}><strong>Total: {formatPrice(total)}</strong></div>
        <div className={styles.formActions}>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>Cancelar</button>
          <button type="submit" className={styles.saveBtn} disabled={loading || form.items.length === 0}>
            {loading ? <ButtonLoader /> : 'Crear Orden'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
