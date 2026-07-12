import { useState, useEffect } from 'react';
import { Plus, AlertTriangle } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { SkeletonTable } from '@shared/ui/Skeleton';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { getInventoryProducts, getInventoryAdjustments, adjustStock } from '../api/inventory.api';
import type { Product } from '@types';
import styles from '../pages/InventoryPage.module.css';
import tableStyles from '@shared/ui/TableList.module.css';

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
    getInventoryAdjustments().then(setAdjustments).catch(() => {}).finally(() => setLoadingAdjustments(false));
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) || p.barcode?.includes(productSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await adjustStock(selectedProduct.id, { quantity: Number(form.quantity), type: form.type, notes: form.notes || null });
      setShowModal(false);
      setSelectedProduct(null);
      setProductSearch('');
      setForm({ quantity: 0, type: 'adjustment', notes: '' });
      getInventoryAdjustments().then(setAdjustments).catch(() => {});
      showToast('Ajuste registrado exitosamente', 'success');
    } catch (err: any) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  return (
    <>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Ajustes de Inventario</h3>
        {user?.role !== 'cajero' && (
          <button className={styles.addBtn} onClick={() => setShowModal(true)}><Plus size={18} /> Nuevo Ajuste</button>
        )}
      </div>

      <div className={tableStyles.container}>
        {loadingAdjustments ? (
          config.skeletonEnabled ? <SkeletonTable rows={6} cols={5} /> : <LoadingDots text="Cargando ajustes..." />
        ) : adjustments.length === 0 ? (
          <div className={styles.empty}>
            <AlertTriangle size={40} /><p>Presiona "Nuevo Ajuste" para registrar una entrada, salida, merma o devolución de inventario.</p>
          </div>
        ) : (
          <table className={tableStyles.table}>
            <thead>
              <tr><th>Fecha</th><th>Producto</th><th>Tipo</th><th className={styles.textAlignRight}>Cantidad</th><th>Notas</th><th>Usuario</th></tr>
            </thead>
            <tbody>
              {adjustments.map((adj: any) => (
                <tr key={adj.id}>
                  <td>{new Date(adj.createdAt).toLocaleDateString()}</td>
                  <td><span className={tableStyles.nameText}>{adj.product?.name || adj.productName || '—'}</span></td>
                  <td className={styles.textMuted}>{adj.type}</td>
                  <td className={styles.textAlignRight}><span className={`${tableStyles.numberValue} ${styles.colorVar}`} style={{ '--color-var': adj.quantity >= 0 ? 'var(--color-success)' : 'var(--color-danger)' } as React.CSSProperties}>{adj.quantity >= 0 ? '+' : ''}{adj.quantity}</span></td>
                  <td>{adj.notes || '—'}</td>
                  <td>{adj.user?.name || adj.userName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setSelectedProduct(null); setProductSearch(''); }} title="Registrar Ajuste de Inventario">
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.fieldFull}>
              <label>Producto</label>
              <div className={styles.selectWithSearch}>
                <input type="text" placeholder="Buscar producto..." value={productSearch} onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct(null); }} onFocus={() => setShowDropdown(true)} />
                {showDropdown && filteredProducts.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredProducts.map(p => (
                      <div key={p.id} className={styles.dropdownItem} onClick={() => { setSelectedProduct(p); setProductSearch(p.name); setShowDropdown(false); }}>
                        <span>{p.name}</span><span className={styles.dropdownMeta}>Stock: {p.stock} | {formatPrice(p.cost)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && <p className={styles.selectedInfo}>Stock actual: <strong>{selectedProduct.stock}</strong> | Costo: <strong>{formatPrice(selectedProduct.cost)}</strong></p>}
            </div>
            <div className={styles.field}>
              <label>Cantidad</label>
              <input type="number" value={form.quantity || ''} onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))} required placeholder="Positivo o negativo" />
            </div>
            <div className={styles.field}>
              <label>Tipo de Ajuste</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="adjustment">Ajuste</option><option value="waste">Merma</option><option value="return">Devolución</option><option value="theft">Robo</option>
              </select>
            </div>
            <div className={styles.fieldFull}>
              <label>Motivo / Notas</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn} disabled={loading || !selectedProduct}>{loading ? <ButtonLoader /> : 'Registrar Ajuste'}</button>
          </div>
        </form>
      </Modal>
    </>
  );
}
