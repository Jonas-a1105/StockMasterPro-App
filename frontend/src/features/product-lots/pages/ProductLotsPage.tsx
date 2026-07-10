import { useState, useEffect, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { formatUsd } from '@shared/lib/format/currency';
import { Plus, Calendar, AlertTriangle, Trash2, Eye, Filter, X, Clock, Package, AlertCircle } from 'lucide-react';
import { TabNav } from '@shared/ui/TabNav';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { Modal } from '@shared/ui/Modal';
import styles from './ProductLotsPage.module.css';

const TAB_ITEMS = [
  { key: 'all', label: 'Todos', icon: <Package size={16} /> },
  { key: 'expiring', label: 'Por vencer', icon: <Clock size={16} /> },
  { key: 'expired', label: 'Vencidos', icon: <AlertCircle size={16} /> },
] as const;

type TabKey = typeof TAB_ITEMS[number]['key'];

export function ProductLotsPage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [lots, setLots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; lot?: any } | null>(null);
  const [form, setForm] = useState({
    productId: '',
    lotNumber: '',
    quantity: 1,
    expiryDate: '',
    manufactureDate: '',
  });
  const [saving, setSaving] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const data = await api.get('/product-lots');
      setLots(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const filtered = useMemo(() => {
    let result = lots;
    if (activeTab === 'expiring') {
      const limit = new Date();
      limit.setDate(limit.getDate() + 30);
      result = result.filter(l => l.expiryDate && new Date(l.expiryDate) <= limit && new Date(l.expiryDate) >= new Date() && l.quantity > 0);
    } else if (activeTab === 'expired') {
      result = result.filter(l => l.expiryDate && new Date(l.expiryDate) < new Date() && l.quantity > 0);
    }
    if (search) {
      result = result.filter(l =>
        (l.product?.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.lotNumber || '').toLowerCase().includes(search.toLowerCase()) ||
        (l.product?.barcode || '').includes(search)
      );
    }
    return result;
  }, [lots, activeTab, search]);

  const statusOf = (lot: any) => {
    if (!lot.expiryDate || lot.quantity === 0) return { label: 'Sin vencimiento', color: '#6b7280' };
    const now = new Date();
    const exp = new Date(lot.expiryDate);
    const diffDays = Math.ceil((exp.getTime() - now.getTime()) / 86400000);
    if (diffDays < 0) return { label: 'Vencido', color: '#ef4444' };
    if (diffDays <= 30) return { label: `Vence en ${diffDays}d`, color: '#f59e0b' };
    return { label: 'Vigente', color: '#16a34a' };
  };

  const totalLots = lots.length;
  const totalStock = lots.reduce((s, l) => s + (l.quantity || 0), 0);
  const expiringCount = lots.filter(l => l.expiryDate && new Date(l.expiryDate) <= new Date(Date.now() + 30*86400000) && new Date(l.expiryDate) >= new Date() && l.quantity > 0).length;
  const expiredCount = lots.filter(l => l.expiryDate && new Date(l.expiryDate) < new Date() && l.quantity > 0).length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.productId || !form.lotNumber || form.quantity <= 0) return;
    setSaving(true);
    try {
      if (modal?.type === 'create') {
        await api.post('/product-lots', form);
        showToast('Lote creado', 'success');
      } else if (modal?.type === 'edit' && modal.lot) {
        await api.patch(`/product-lots/${modal.lot.id}`, form);
        showToast('Lote actualizado', 'success');
      }
      setModal(null);
      setForm({ productId: '', lotNumber: '', quantity: 1, expiryDate: '', manufactureDate: '' });
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este lote? Se restará su stock del producto.')) return;
    try {
      await api.delete(`/product-lots/${id}`);
      showToast('Lote eliminado', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openCreate = () => setForm({ productId: '', lotNumber: '', quantity: 1, expiryDate: '', manufactureDate: '' }) || setModal({ type: 'create' });
  const openEdit = (lot: any) => setForm({
    productId: lot.productId,
    lotNumber: lot.lotNumber,
    quantity: lot.quantity,
    expiryDate: lot.expiryDate ? lot.expiryDate.slice(0, 10) : '',
    manufactureDate: lot.manufactureDate ? lot.manufactureDate.slice(0, 10) : '',
  }) || setModal({ type: 'edit', lot });

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={6} cols={7} kpi={4} /> : <LoadingDots text="Cargando lotes..." />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Lotes y Vencimientos</h2>
      </div>

      <TabNav tabs={TAB_ITEMS} activeTab={activeTab} onTabChange={setActiveTab} />

      <KpiGrid items={[
        { icon: <Package size={18} />, value: totalLots, label: 'Total Lotes' },
        { icon: <Package size={18} />, value: totalStock, label: 'Stock en Lotes' },
        { icon: <Clock size={18} />, value: expiringCount, label: 'Por vencer (30d)', color: expiringCount > 0 ? '#f59e0b' : '#16a34a' },
        { icon: <AlertCircle size={18} />, value: expiredCount, label: 'Vencidos', color: expiredCount > 0 ? '#ef4444' : '#16a34a' },
      ]} />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por producto, lote, código...' }}
        addBtn={{ label: 'Nuevo Lote', onClick: openCreate }}
      />

      <div className="lista-container">
        <table className="lista-table">
          <thead>
            <tr>
              <th>Producto</th>
              <th>N° Lote</th>
              <th style={{textAlign:'right'}}>Stock</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th style={{textAlign:'center'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay lotes</td></tr>
            ) : filtered.map(lot => {
              const st = statusOf(lot);
              return (
                <tr key={lot.id}>
                  <td><span className="lista-name-text">{lot.product?.name || lot.productId}</span></td>
                  <td><span className="lista-code">{lot.lotNumber}</span></td>
                  <td style={{textAlign:'right'}}><span className="lista-number-value">{lot.quantity}</span></td>
                  <td>{lot.expiryDate ? new Date(lot.expiryDate).toLocaleDateString() : '—'}</td>
                  <td><span className={`lista-badge`} style={{background: st.color + '20', color: st.color}}>{st.label}</span></td>
                  <td style={{textAlign:'center'}}>
                    <div className="lista-actions" style={{justifyContent:'center'}}>
                      <button className="lista-action-btn" onClick={() => openEdit(lot)} title="Editar"><Eye size={14} /></button>
                      <button className="lista-action-btn danger" onClick={() => handleDelete(lot.id)} title="Eliminar"><Trash2 size={14} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal open onClose={() => setModal(null)} title={modal.type === 'create' ? 'Nuevo Lote' : 'Editar Lote'} wide>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Producto *</label>
                <select value={form.productId} onChange={e => setForm(f => ({ ...f, productId: e.target.value }))} required>
                  <option value="">Seleccionar...</option>
                  {lots.map(l => <option key={l.productId} value={l.productId}>{l.product?.name || l.productId}</option>)}
                </select>
              </div>
              <div className={styles.field}>
                <label>N° de Lote *</label>
                <input type="text" value={form.lotNumber} onChange={e => setForm(f => ({ ...f, lotNumber: e.target.value }))} required placeholder="LOTE-001" />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Cantidad *</label>
                <input type="number" min={1} value={form.quantity} onChange={e => setForm(f => ({ ...f, quantity: parseInt(e.target.value) || 1 }))} required />
              </div>
              <div className={styles.field}>
                <label>Fecha de Vencimiento</label>
                <input type="date" value={form.expiryDate} onChange={e => setForm(f => ({ ...f, expiryDate: e.target.value }))} />
              </div>
            </div>
            <div className={styles.fieldRow}>
              <div className={styles.field}>
                <label>Fecha de Fabricación</label>
                <input type="date" value={form.manufactureDate} onChange={e => setForm(f => ({ ...f, manufactureDate: e.target.value }))} />
              </div>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setModal(null)}>Cancelar</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? 'Guardando...' : modal.type === 'create' ? 'Crear Lote' : 'Guardar Cambios'}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}