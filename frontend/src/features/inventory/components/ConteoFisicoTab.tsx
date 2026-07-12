import { useState, useEffect, useCallback } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { FileText, Plus, X, Check, ChevronRight, Search, RotateCcw, FileDown, FileUp } from 'lucide-react';
import { formatUsd } from '@shared/lib/format/currency';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import { ImportModal } from '@shared/ui/ImportModal';
import styles from './ConteoFisicoTab.module.css';

interface InventoryCountItem {
  id: string;
  inventoryCountId: string;
  productId: string;
  productWarehouseId: string | null;
  systemQty: number;
  countedQty: number | null;
  difference: number;
  notes: string | null;
  createdAt: string;
  product?: { id: string; name: string; barcode: string | null };
  productWarehouse?: { id: string; warehouseId: string; stock: number };
}

interface InventoryCount {
  id: string;
  tenantId: string;
  warehouseId: string | null;
  userId: string;
  status: 'draft' | 'in_progress' | 'completed' | 'approved' | 'cancelled';
  name: string | null;
  notes: string | null;
  startedAt: string | null;
  completedAt: string | null;
  approvedBy: string | null;
  approvedAt: string | null;
  createdAt: string;
  updatedAt: string;
  items: InventoryCountItem[];
  warehouse?: { id: string; name: string } | null;
  user?: { id: string; name: string } | null;
  approver?: { id: string; name: string } | null;
}

const STATUS_LABELS: Record<string, string> = {
  draft: 'Borrador',
  in_progress: 'En Progreso',
  completed: 'Completado',
  approved: 'Aprobado',
  cancelled: 'Cancelado',
};

const STATUS_STYLES: Record<string, string> = {
  draft: 'status-draft',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  approved: 'status-approved',
  cancelled: 'status-cancelled',
};

function renderLoadingRows(config: any) {
  if (!config.skeletonEnabled) {
    return <tr><td colSpan={8} className={styles.emptyRow}><LoadingDots text="Cargando conteos..." /></td></tr>;
  }
  return Array.from({ length: 5 }).map((_, idx) => (
    <tr key={`loader-${idx}`}>
      <td><div className={`skeleton ${styles.skeletonWidth60}`} /></td>
      <td><div className={`skeleton ${styles.skeletonWidth120}`} /></td>
      <td><div className={`skeleton ${styles.skeletonWidth100}`} /></td>
      <td><div className={`skeleton ${styles.skeletonWidth80}`} /></td>
      <td><div className={`skeleton ${styles.skeletonWidth40}`} /></td>
      <td><div className={`skeleton ${styles.skeletonWidth60b}`} /></td>
      <td><div className={`skeleton ${styles.skeletonWidth100b}`} /></td>
      <td></td>
    </tr>
  ));
}

export function ConteoFisicoTab() {
  const { showToast } = useToast();
  const { config } = useTheme();
  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [form, setForm] = useState({ name: '', notes: '', warehouseId: '', productIds: [] as string[] });
  const [showStartConfirm, setShowStartConfirm] = useState<InventoryCount | null>(null);
  const [showCompleteConfirm, setShowCompleteConfirm] = useState<InventoryCount | null>(null);
  const [showApproveConfirm, setShowApproveConfirm] = useState<InventoryCount | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState<InventoryCount | null>(null);

  const loadWarehouses = useCallback(async () => {
    try {
      const data = await api.get('/warehouses');
      setWarehouses(data);
    } catch {}
  }, []);

  const loadCounts = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const data = await api.get(`/inventory-counts?${params.toString()}`);
      setCounts(data);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, showToast]);

  useEffect(() => {
    loadWarehouses();
    loadCounts();
  }, [loadWarehouses, loadCounts]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreating(true);
    try {
      await api.post('/inventory-counts', {
        name: form.name || null,
        notes: form.notes || null,
        warehouseId: form.warehouseId || null,
        productIds: form.productIds.length > 0 ? form.productIds : undefined,
      });
      setShowCreateModal(false);
      setForm({ name: '', notes: '', warehouseId: '', productIds: [] });
      showToast('Conteo creado', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setCreating(false);
    }
  };

  const handleStart = async (count: InventoryCount) => {
    try {
      await api.patch(`/inventory-counts/${count.id}/start`);
      showToast('Conteo iniciado', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleComplete = async (count: InventoryCount) => {
    try {
      await api.patch(`/inventory-counts/${count.id}/complete`);
      showToast('Conteo completado', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleApprove = async (count: InventoryCount) => {
    try {
      await api.patch(`/inventory-counts/${count.id}/approve`);
      showToast('Conteo aprobado', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = async (count: InventoryCount) => {
    try {
      await api.patch(`/inventory-counts/${count.id}/cancel`);
      showToast('Conteo cancelado', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleUpdateItem = async (countId: string, itemId: string, countedQty: number, notes?: string) => {
    setSavingItem(itemId);
    try {
      await api.patch(`/inventory-counts/${countId}/items/${itemId}`, { countedQty, notes });
      showToast('Cantidad actualizada', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSavingItem(null);
    }
  };

  const handleApplyAdjustments = async (count: InventoryCount) => {
    try {
      await api.post(`/inventory-counts/${count.id}/apply-adjustments`);
      showToast('Ajustes aplicados al stock', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleExport = () => {
    const COLS: ColumnMapping[] = [
      { header: 'ID', key: 'id', type: 'string' },
      { header: 'Nombre', key: 'name', type: 'string' },
      { header: 'Almacén', key: 'warehouse', type: 'string' },
      { header: 'Estado', key: 'status', type: 'string' },
      { header: 'Items', key: 'items.length', type: 'number' },
      { header: 'Diferencias', key: 'differences', type: 'number' },
      { header: 'Creado', key: 'createdAt', type: 'date' },
    ];
    const data = counts.map(c => ({
      id: c.id.slice(0, 8),
      name: c.name || '—',
      warehouse: c.warehouse?.name || 'Todos',
      status: STATUS_LABELS[c.status],
      'items.length': c.items.length,
      differences: c.items.filter(i => i.difference !== 0).length,
      createdAt: new Date(c.createdAt).toLocaleDateString(),
    }));
    exportToExcel(data, COLS, 'conteos-fisicos', 'xlsx');
    showToast('Exportado a Excel', 'success');
  };

  const handleImport = async (data: any[], onProgress: (c: number, t: number) => void) => {
    let success = 0, errors = 0;
    const details: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) throw new Error('Nombre obligatorio');
        await api.post('/inventory-counts', {
          name: row.name,
          notes: row.notes || '',
          warehouseId: row.warehouseId || null,
        });
        success++;
        details.push(`Creado: ${row.name}`);
      } catch (err: any) {
        errors++;
        details.push(`Error fila ${i + 1} (${row.name || 'Sin nombre'}): ${err.message}`);
      }
      onProgress(i + 1, data.length);
    }
    await loadCounts();
    return { successCount: success, errorCount: errors, details };
  };

  const openDetail = (count: InventoryCount) => {
    setSelectedCount(count);
    setShowDetailModal(true);
  };

  const filteredCounts = counts.filter(c => {
    if (search && !c.id.toLowerCase().includes(search.toLowerCase()) &&
        !c.name?.toLowerCase().includes(search.toLowerCase()) &&
        !c.warehouse?.name.toLowerCase().includes(search.toLowerCase())) return false;
    if (statusFilter && c.status !== statusFilter) return false;
    return true;
  });

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Conteo Físico de Inventario</h2>
        <div className={styles.actions}>
          <button className={styles.btnSecondary} onClick={handleExport}>
            <FileDown size={16} /> Exportar
          </button>
          <button className={styles.btnSecondary} onClick={() => setShowImport(true)}>
            <FileUp size={16} /> Importar
          </button>
          <button className={styles.btnPrimary} onClick={() => { setForm({ name: '', notes: '', warehouseId: '', productIds: [] }); setShowCreateModal(true); }}>
            <Plus size={16} /> Nuevo Conteo
          </button>
        </div>
      </div>

      <div className={styles.filters}>
        <input
          type="text"
          placeholder="Buscar por ID, nombre, almacén..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className={styles.searchInput}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={styles.select}>
          <option value="">Todos los estados</option>
          <option value="draft">Borrador</option>
          <option value="in_progress">En Progreso</option>
          <option value="completed">Completado</option>
          <option value="approved">Aprobado</option>
          <option value="cancelled">Cancelado</option>
        </select>
      </div>

      <div className={styles.tableContainer}>
        <table className="lista-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nombre</th>
              <th>Almacén</th>
              <th className={styles.textCenter}>Estado</th>
              <th className={styles.textCenter}>Items</th>
              <th className={styles.textCenter}>Diferencias</th>
              <th>Creado</th>
              <th className={styles.textCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {loading ? renderLoadingRows(config) : filteredCounts.map(count => (
                <tr key={count.id}>
                  <td className={`${styles.monoFont} ${styles.textMuted}`}>{count.id.slice(0, 8)}</td>
                  <td><span className="lista-name-text">{count.name || '—'}</span></td>
                  <td>{count.warehouse?.name || 'Todos'}</td>
                  <td className={styles.textCenter}>
                    <span className={`${styles.badge} ${STATUS_STYLES[count.status]}`}>{STATUS_LABELS[count.status]}</span>
                  </td>
                  <td className={styles.textCenter}>{count.items.length}</td>
                  <td className={styles.textCenter}>
                    <span className={`${styles.fontWeight600} ${count.items.some(i => i.difference !== 0) ? styles.textDanger : styles.textSuccess}`}>
                      {count.items.filter(i => i.difference !== 0).length}
                    </span>
                  </td>
                  <td>{new Date(count.createdAt).toLocaleDateString()}</td>
                  <td className={`${styles.textCenter} ${styles.textCenterWhiteSpace}`}>
                    <div className={styles.actionGroup}>
                      <button className={styles.iconBtn} onClick={() => openDetail(count)} title="Ver detalle"><FileText size={14} /></button>
                      {count.status === 'draft' && (
                        <>
                          <button className={styles.iconBtn} onClick={() => setShowStartConfirm(count)} title="Iniciar"><ChevronRight size={14} /></button>
                          <button className={`${styles.iconBtn} danger`} onClick={() => setShowCancelConfirm(count)} title="Cancelar"><X size={14} /></button>
                        </>
                      )}
                      {count.status === 'in_progress' && (
                        <>
                          <button className={styles.iconBtn} onClick={() => setShowCompleteConfirm(count)} title="Completar"><Check size={14} /></button>
                          <button className={`${styles.iconBtn} danger`} onClick={() => setShowCancelConfirm(count)} title="Cancelar"><X size={14} /></button>
                        </>
                      )}
                      {count.status === 'completed' && (
                        <>
                          <button className={styles.iconBtn} onClick={() => setShowApproveConfirm(count)} title="Aprobar"><Check size={14} /></button>
                          <button className={`${styles.iconBtn} danger`} onClick={() => setShowCancelConfirm(count)} title="Cancelar"><X size={14} /></button>
                        </>
                      )}
                      {count.status === 'approved' && (
                        <button className={`${styles.iconBtn} success`} onClick={() => handleApplyAdjustments(count)} title="Aplicar ajustes al stock"><RotateCcw size={14} /></button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {filteredCounts.length === 0 && (
                <tr><td colSpan={8} className={styles.emptyRow}>No hay conteos de inventario</td></tr>
              )}
          </tbody>
        </table>
      </div>

      <CreateCountModal
        open={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreate}
        loading={creating}
        warehouses={warehouses}
        form={form}
        setForm={setForm}
      />

      <CountDetailModal
        open={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedCount(null); }}
        count={selectedCount}
        onUpdateItem={handleUpdateItem}
        savingItem={savingItem}
      />

      <ConfirmationModal
        open={!!showStartConfirm}
        onClose={() => setShowStartConfirm(null)}
        onConfirm={() => showStartConfirm && handleStart(showStartConfirm)}
        title="Iniciar Conteo"
        message="¿Iniciar este conteo físico? Cambiará el estado a 'En Progreso'."
        confirmLabel="Iniciar"
      />

      <ConfirmationModal
        open={!!showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(null)}
        onConfirm={() => showCompleteConfirm && handleComplete(showCompleteConfirm)}
        title="Completar Conteo"
        message="¿Marcar este conteo como completado? Se calcularán las diferencias."
        confirmLabel="Completar"
      />

      <ConfirmationModal
        open={!!showApproveConfirm}
        onClose={() => setShowApproveConfirm(null)}
        onConfirm={() => showApproveConfirm && handleApprove(showApproveConfirm)}
        title="Aprobar Conteo"
        message="¿Aprobar este conteo? Una vez aprobado, se pueden aplicar los ajustes al stock."
        confirmLabel="Aprobar"
      />

      <ConfirmationModal
        open={!!showCancelConfirm}
        onClose={() => setShowCancelConfirm(null)}
        onConfirm={() => showCancelConfirm && handleCancel(showCancelConfirm)}
        title="Cancelar Conteo"
        message="¿Cancelar este conteo? Esta acción no se puede deshacer."
        confirmLabel="Cancelar"
        danger
      />

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Importar Conteos"
        columns={[
          { header: 'Nombre', key: 'name', type: 'string', required: true },
          { header: 'Notas', key: 'notes', type: 'string', required: false },
          { header: 'Almacén ID', key: 'warehouseId', type: 'string', required: false },
        ]}
        templateFilename="plantilla_conteos"
        onImport={handleImport}
      />
    </div>
  );
}

function CreateCountModal({ open, onClose, onSubmit, loading, warehouses, form, setForm }: any) {
  return (
    <Modal open={open} onClose={onClose} title="Nuevo Conteo Físico" wide>
      <form onSubmit={onSubmit}>
        <div className="form-grid">
          <div className="field">
            <label>Nombre del conteo</label>
            <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej: Conteo mensual enero" required />
          </div>
          <div className="field">
            <label>Almacén (opcional)</label>
            <select value={form.warehouseId} onChange={e => setForm(f => ({ ...f, warehouseId: e.target.value }))}>
              <option value="">Todos los almacenes</option>
              {warehouses.map(w => <option key={w.id} value={w.id}>{w.name} ({w.code})</option>)}
            </select>
          </div>
          <div className="field-full">
            <label>Notas</label>
            <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={2} placeholder="Observaciones..." />
          </div>
        </div>
        <div className="form-actions">
          <button type="button" className="cancelBtn" onClick={onClose}>Cancelar</button>
          <button type="submit" className="saveBtn" disabled={loading}>
            {loading ? <span className="loader" /> : 'Crear'}
          </button>
        </div>
      </form>
    </Modal>
  );
}

function CountDetailModal({ open, onClose, count, onUpdateItem, savingItem }: any) {
  if (!open || !count) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Conteo: ${count.name || count.id.slice(0, 8)}`} wide>
      <div className="detail-header">
        <div className="detail-info">
          <div><strong>Estado:</strong> <span className={`badge ${STATUS_STYLES[count.status]}`}>{STATUS_LABELS[count.status]}</span></div>
          <div><strong>Almacén:</strong> {count.warehouse?.name || 'Todos'}</div>
          <div><strong>Creado por:</strong> {count.user?.name || '—'}</div>
          {count.startedAt && <div><strong>Iniciado:</strong> {new Date(count.startedAt).toLocaleString()}</div>}
          {count.completedAt && <div><strong>Completado:</strong> {new Date(count.completedAt).toLocaleString()}</div>}
          {count.approvedAt && <div><strong>Aprobado por:</strong> {count.approver?.name || '—'} ({new Date(count.approvedAt).toLocaleString()})</div>}
        </div>
        {count.notes && <div className="detail-notes"><strong>Notas:</strong> {count.notes}</div>}
      </div>

      <table className="lista-table">
        <thead>
          <tr>
            <th>Producto</th>
            <th className={styles.thCenter}>Stock Sistema</th>
            <th className={styles.thCenter}>Contado</th>
            <th className={styles.thCenter}>Diferencia</th>
            <th>Notas</th>
          </tr>
        </thead>
        <tbody>
          {count.items.map((item: any) => (
            <tr key={item.id}>
              <td>{item.product?.name || item.productId.slice(0, 8)}</td>
              <td className={styles.tdCenter}>{item.systemQty}</td>
              <td className={styles.tdCenter}>
                <input
                  type="number"
                  min="0"
                  value={item.countedQty ?? ''}
                  onChange={e => onUpdateItem(count.id, item.id, parseInt(e.target.value) || 0, item.notes)}
                  className={styles.inputCell}
                  disabled={count.status !== 'in_progress'}
                />
              </td>
              <td className={`${styles.tdCenter} ${styles.fontWeight600} ${styles.colorVar}`} style={{ '--color-var': item.difference !== 0 ? 'var(--color-danger)' : 'var(--color-success)' } as React.CSSProperties}>
                {item.difference >= 0 ? '+' : ''}{item.difference}
              </td>
              <td>
                <input
                  type="text"
                  value={item.notes || ''}
                  onChange={e => onUpdateItem(count.id, item.id, item.countedQty ?? item.systemQty, e.target.value)}
                  className={styles.inputFull}
                  disabled={count.status !== 'in_progress'}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </Modal>
  );
}

function ConfirmationModal({ open, onClose, onConfirm, title, message, confirmLabel, danger }: any) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p>{message}</p>
      <div className="form-actions">
        <button className="cancelBtn" onClick={onClose}>Cancelar</button>
        <button className={`saveBtn ${danger ? 'danger' : ''}`} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}