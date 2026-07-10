import { useState, useEffect, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { Warehouse, Truck, Package, Plus, Eye, X, RotateCcw, CheckCircle, AlertCircle, Clock, ArrowRightLeft } from 'lucide-react';
import { TabNav } from '@shared/ui/TabNav';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { Modal } from '@shared/ui/Modal';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { formatUsd } from '@shared/lib/format/currency';
import styles from './WarehouseTransfersPage.module.css';

const STATUS_LABELS: Record<string, string> = {
  pending: 'Pendiente',
  in_transit: 'En tránsito',
  completed: 'Completada',
  cancelled: 'Cancelada',
};
const STATUS_COLORS: Record<string, string> = {
  pending: '#f59e0b',
  in_transit: '#3b82f6',
  completed: '#16a34a',
  cancelled: '#ef4444',
};

export function WarehouseTransfersPage() {
  const { showToast } = useToast();
  const { config } = useTheme();
  const { formatPrice } = useExchangeRate();
  const [transfers, setTransfers] = useState<any[]>([]);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'in_transit' | 'completed'>('all');
  const [search, setSearch] = useState('');
  const [modal, setModal] = useState<{ type: 'create' | 'view'; data?: any } | null>(null);
  const [form, setForm] = useState({
    fromWarehouseId: '',
    toWarehouseId: '',
    notes: '',
    items: [{ productId: '', quantity: 1 }],
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    try {
      const [t, w, p] = await Promise.all([
        api.get('/warehouse-transfers'),
        api.get('/warehouses'),
        api.get('/products?limit=500'),
      ]);
      setTransfers(t || []);
      setWarehouses(w || []);
      setProducts(p || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filtered = useMemo(() => {
    const statusFilter = activeTab === 'all' ? '' : activeTab;
    return transfers.filter(t => {
      const matchStatus = !statusFilter || t.status === statusFilter;
      const matchSearch = !search ||
        t.fromWarehouse?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.toWarehouse?.name?.toLowerCase().includes(search.toLowerCase()) ||
        t.id.slice(0, 8).includes(search);
      return matchStatus && matchSearch;
    });
  }, [transfers, activeTab, search]);

  const counts = useMemo(() => ({
    all: transfers.length,
    pending: transfers.filter(t => t.status === 'pending').length,
    in_transit: transfers.filter(t => t.status === 'in_transit').length,
    completed: transfers.filter(t => t.status === 'completed').length,
  }), [transfers]);

  const addItem = () => setForm(f => ({ ...f, items: [...f.items, { productId: '', quantity: 1 }] }));
  const removeItem = (i: number) => {
    if (form.items.length <= 1) return;
    setForm(f => ({ ...f, items: f.items.filter((_, idx) => idx !== i) }));
  };
  const updateItem = (i: number, field: string, value: any) => {
    setForm(f => ({ ...f, items: f.items.map((it, idx) => idx === i ? { ...it, [field]: value } : it) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.fromWarehouseId || !form.toWarehouseId || !form.items.some(i => i.productId && i.quantity > 0)) {
      showToast('Complete todos los campos requeridos', 'error');
      return;
    }
    if (form.fromWarehouseId === form.toWarehouseId) {
      showToast('Origen y destino deben ser diferentes', 'error');
      return;
    }
    setSaving(true);
    try {
      const items = form.items.filter(i => i.productId && i.quantity > 0).map(i => ({
        productId: i.productId,
        quantity: i.quantity,
      }));
      await api.post('/warehouse-transfers', { ...form, items });
      showToast('Transferencia creada', 'success');
      setModal(null);
      setForm({ fromWarehouseId: '', toWarehouseId: '', notes: '', items: [{ productId: '', quantity: 1 }] });
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (id: string, status: string) => {
    try {
      await api.patch(`/warehouse-transfers/${id}/status`, { status });
      showToast('Estado actualizado', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const canEdit = (t: any) => t.status === 'pending';
  const canTransit = (t: any) => t.status === 'pending';
  const canComplete = (t: any) => t.status === 'in_transit';
  const canCancel = (t: any) => t.status === 'pending' || t.status === 'in_transit';

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={6} cols={7} kpi={4} /> : <LoadingDots text="Cargando..." />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Transferencias entre Almacenes</h2>
      </div>

      <TabNav
        tabs={[
          { key: 'all', label: `Todas (${counts.all})` },
          { key: 'pending', label: `Pendientes (${counts.pending})`, icon: <Clock size={16} /> },
          { key: 'in_transit', label: `En tránsito (${counts.in_transit})`, icon: <Truck size={16} /> },
          { key: 'completed', label: `Completadas (${counts.completed})`, icon: <CheckCircle size={16} /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <KpiGrid
        items={[
          { icon: <Warehouse size={18} />, value: counts.all, label: 'Total' },
          { icon: <Clock size={18} />, value: counts.pending, label: 'Pendientes', color: '#f59e0b' },
          { icon: <Truck size={18} />, value: counts.in_transit, label: 'En tránsito', color: '#3b82f6' },
          { icon: <CheckCircle size={18} />, value: counts.completed, label: 'Completadas', color: '#16a34a' },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por almacén...' }}
        addBtn={{ label: 'Nueva Transferencia', onClick: () => setModal({ type: 'create' }) }}
      />

      <div className="lista-container">
        <table className="lista-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Origen → Destino</th>
              <th>Productos</th>
              <th style={{textAlign:'center'}}>Estado</th>
              <th>Fecha</th>
              <th style={{textAlign:'center'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay transferencias</td></tr>
            ) : filtered.map(t => (
              <tr key={t.id}>
                <td style={{fontFamily:'monospace',color:'var(--text-muted)'}}>{t.id.slice(0,8)}</td>
                <td>
                  <div className={styles.transferRoute}>
                    <span>{t.fromWarehouse?.name}</span>
                    <ArrowRightLeft size={14} className={styles.arrow} />
                    <span>{t.toWarehouse?.name}</span>
                  </div>
                </td>
                <td>{t.items?.length || 0} art.</td>
                <td style={{textAlign:'center'}}>
                  <span className={styles.badge} style={{background: STATUS_COLORS[t.status] + '20', color: STATUS_COLORS[t.status]}}>
                    {STATUS_LABELS[t.status]}
                  </span>
                </td>
                <td>{new Date(t.createdAt).toLocaleDateString()}</td>
                <td style={{textAlign:'center'}}>
                  <div className={styles.actions}>
                    <button className="lista-action-btn" onClick={() => setModal({ type: 'view', data: t })} title="Ver">
                      <Eye size={14} />
                    </button>
                    {canEdit(t) && (
                      <>
                        <button className="lista-action-btn" onClick={() => handleStatusChange(t.id, 'in_transit')} title="Enviar">
                          <Truck size={14} />
                        </button>
                        <button className="lista-action-btn danger" onClick={() => handleStatusChange(t.id, 'cancelled')} title="Cancelar">
                          <X size={14} />
                        </button>
                      </>
                    )}
                    {canTransit(t) && !canEdit(t) && (
                      <>
                        <button className="lista-action-btn" onClick={() => handleStatusChange(t.id, 'completed')} title="Completar">
                          <CheckCircle size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {modal && (
        <Modal open onClose={() => setModal(null)} title={modal.type === 'create' ? 'Nueva Transferencia' : 'Detalle de Transferencia'} wide>
          {modal.type === 'create' && (
            <form onSubmit={handleSubmit} className={styles.form}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Almacén Origen *</label>
                  <select value={form.fromWarehouseId} onChange={e => setForm(f => ({ ...f, fromWarehouseId: e.target.value }))} required>
                    <option value="">Seleccionar...</option>
                    {warehouses.filter(w => w.isActive).map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Almacén Destino *</label>
                  <select value={form.toWarehouseId} onChange={e => setForm(f => ({ ...f, toWarehouseId: e.target.value }))} required>
                    <option value="">Seleccionar...</option>
                    {warehouses.filter(w => w.isActive && w.id !== form.fromWarehouseId).map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>Notas</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Observaciones opcionales" />
              </div>
              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <label>Productos a transferir</label>
                  <button type="button" className={styles.addItemBtn} onClick={addItem}>
                    <Plus size={14} /> Agregar
                  </button>
                </div>
                {form.items.map((item, i) => (
                  <div key={i} className={styles.itemRow}>
                    <select value={item.productId} onChange={e => updateItem(i, 'productId', e.target.value)} required>
                      <option value="">Seleccionar producto</option>
                      {products.filter(p => p.isActive).map(p => <option key={p.id} value={p.id}>{p.name} — {p.code || p.barcode || 'S/C'}</option>)}
                    </select>
                    <input type="number" min={1} value={item.quantity} onChange={e => updateItem(i, 'quantity', parseInt(e.target.value) || 1)} className={styles.qtyInput} />
                    <button type="button" className={styles.removeBtn} onClick={() => removeItem(i)} disabled={form.items.length <= 1}>
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setModal(null)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Creando...' : 'Crear Transferencia'}
                </button>
              </div>
            </form>
          )}
          {modal.type === 'view' && modal.data && (
            <div className={styles.viewContent}>
              <div className={styles.detailGrid}>
                <div className={styles.detailField}><span className={styles.detailLabel}>Origen</span><span>{modal.data.fromWarehouse?.name}</span></div>
                <div className={styles.detailField}><span className={styles.detailLabel}>Destino</span><span>{modal.data.toWarehouse?.name}</span></div>
                <div className={styles.detailField}><span className={styles.detailLabel}>Estado</span><span><span className={styles.badge} style={{background: STATUS_COLORS[modal.data.status] + '20', color: STATUS_COLORS[modal.data.status]}}>{STATUS_LABELS[modal.data.status]}</span></span></div>
                <div className={styles.detailField}><span className={styles.detailLabel}>Fecha</span><span>{new Date(modal.data.createdAt).toLocaleString()}</span></div>
                {modal.data.notes && <div className={styles.detailField}><span className={styles.detailLabel}>Notas</span><span>{modal.data.notes}</span></div>}
              </div>
              <h4 style={{fontSize:14,fontWeight:700,margin:'20px 0 10px'}}>Productos</h4>
              <div className="lista-container">
                <table className="lista-table">
                  <thead><tr><th>Producto</th><th style={{textAlign:'right'}}>Cantidad</th></tr></thead>
                  <tbody>
                    {modal.data.items?.map((it: any) => (
                      <tr key={it.id}><td>{it.product?.name || it.productId}</td><td style={{textAlign:'right'}}><span className="lista-number-value">{it.quantity}</span></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {modal.data.status === 'pending' && (
                <div className={styles.viewActions}>
                  <button className={styles.sendBtn} onClick={() => handleStatusChange(modal.data.id, 'in_transit')}>
                    <Truck size={14} /> Enviar a tránsito
                  </button>
                  <button className={styles.cancelBtn} onClick={() => handleStatusChange(modal.data.id, 'cancelled')}>
                    <X size={14} /> Cancelar
                  </button>
                </div>
              )}
              {modal.data.status === 'in_transit' && (
                <div className={styles.viewActions}>
                  <button className={styles.completeBtn} onClick={() => handleStatusChange(modal.data.id, 'completed')}>
                    <CheckCircle size={14} /> Completar recepción
                  </button>
                </div>
              )}
            </div>
          )}
        </Modal>
      )}
    </div>
  );
}