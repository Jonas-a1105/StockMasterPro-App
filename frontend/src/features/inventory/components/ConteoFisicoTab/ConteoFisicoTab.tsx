import { useState, useEffect, useCallback, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Button, Modal, ButtonLoader, Badge, FormField, Input, Select, ImportModal, Textarea, Text, Heading } from '@shared/ui';
import { DataTable } from '@shared/ui';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import {
  FileText,
  Plus,
  X,
  Check,
  ChevronRight,
  RotateCcw,
  FileDown,
  FileUp,
} from 'lucide-react';

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

function statusBadgeVariant(status: string) {
  if (status === 'draft') return 'warning';
  if (status === 'in_progress') return 'info';
  if (status === 'approved' || status === 'completed') return 'success';
  if (status === 'cancelled') return 'danger';
  return 'warning';
}

export function ConteoFisicoTab() {
  const { showToast } = useToast();

  const [counts, setCounts] = useState<InventoryCount[]>([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedCount, setSelectedCount] = useState<InventoryCount | null>(null);
  const [creating, setCreating] = useState(false);
  const [savingItem, setSavingItem] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [form, setForm] = useState({
    name: '',
    notes: '',
    warehouseId: '',
    productIds: [] as string[],
  });
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
    try {
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const data = await api.get(`/inventory-counts?${params.toString()}`);
      setCounts(data);
    } catch (err: any) {
      showToast(err.message, 'error');
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

  const handleUpdateItem = async (
    countId: string,
    itemId: string,
    countedQty: number,
    notes?: string
  ) => {
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

  const handleApplyAdjustments = useCallback(async (count: InventoryCount) => {
    try {
      await api.post(`/inventory-counts/${count.id}/apply-adjustments`);
      showToast('Ajustes aplicados al stock', 'success');
      loadCounts();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }, [showToast, loadCounts]);

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
    const data = counts.map((c) => ({
      id: c.id.slice(0, 8),
      name: c.name || '—',
      warehouse: c.warehouse?.name || 'Todos',
      status: STATUS_LABELS[c.status],
      'items.length': c.items.length,
      differences: c.items.filter((i) => i.difference !== 0).length,
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

  const filteredCounts = useMemo(
    () =>
      counts.filter((c) => {
        if (
          search &&
          !c.id.toLowerCase().includes(search.toLowerCase()) &&
          !c.name?.toLowerCase().includes(search.toLowerCase()) &&
          !c.warehouse?.name.toLowerCase().includes(search.toLowerCase())
        )
          return false;
        if (statusFilter && c.status !== statusFilter) return false;
        return true;
      }),
    [counts, search, statusFilter]
  );

  const countColumns = useMemo(
    () => [
      { key: 'id', header: 'ID', render: (c: InventoryCount) => c.id.slice(0, 8) },
      { key: 'name', header: 'Nombre', render: (c: InventoryCount) => c.name || '—' },
      { key: 'warehouse', header: 'Almacén', render: (c: InventoryCount) => c.warehouse?.name || 'Todos' },
      { key: 'status', header: 'Estado', render: (c: InventoryCount) => (
        <Badge variant={statusBadgeVariant(c.status)}>{STATUS_LABELS[c.status]}</Badge>
      )},
      { key: 'items', header: 'Items', align: 'center' as const, render: (c: InventoryCount) => c.items.length },
      { key: 'differences', header: 'Diferencias', align: 'center' as const, render: (c: InventoryCount) => {
        const diffs = c.items.filter((i) => i.difference !== 0).length;
        return <Text weight="semibold" color={diffs > 0 ? 'danger' : 'success'}>{diffs}</Text>;
      }},
      { key: 'createdAt', header: 'Creado', render: (c: InventoryCount) => new Date(c.createdAt).toLocaleDateString() },
      { key: 'actions', header: 'Acciones', align: 'center' as const, render: (c: InventoryCount) => (
        <div className="flex items-center justify-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => openDetail(c)} title="Ver detalle"><FileText size={14} /></Button>
          {c.status === 'draft' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowStartConfirm(c)} title="Iniciar"><ChevronRight size={14} /></Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(c)} title="Cancelar" className="text-danger"><X size={14} /></Button>
            </>
          )}
          {c.status === 'in_progress' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowCompleteConfirm(c)} title="Completar"><Check size={14} /></Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(c)} title="Cancelar" className="text-danger"><X size={14} /></Button>
            </>
          )}
          {c.status === 'completed' && (
            <>
              <Button variant="ghost" size="sm" onClick={() => setShowApproveConfirm(c)} title="Aprobar"><Check size={14} /></Button>
              <Button variant="ghost" size="sm" onClick={() => setShowCancelConfirm(c)} title="Cancelar" className="text-danger"><X size={14} /></Button>
            </>
          )}
          {c.status === 'approved' && (
            <Button variant="ghost" size="sm" onClick={() => handleApplyAdjustments(c)} title="Aplicar ajustes al stock" className="text-success"><RotateCcw size={14} /></Button>
          )}
        </div>
      )},
    ],
    [handleApplyAdjustments]
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Heading variant="h2">Conteo Físico de Inventario</Heading>
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={handleExport}>
            <FileDown size={16} /> Exportar
          </Button>
          <Button variant="outline" onClick={() => setShowImport(true)}>
            <FileUp size={16} /> Importar
          </Button>
          <Button onClick={() => { setForm({ name: '', notes: '', warehouseId: '', productIds: [] }); setShowCreateModal(true); }}>
            <Plus size={16} /> Nuevo Conteo
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Buscar por ID, nombre, almacén..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 min-w-[250px]"
        />
        <Select
          value={statusFilter}
          onChange={(val) => setStatusFilter(val)}
          options={[
            { value: '', label: 'Todos los estados' },
            { value: 'draft', label: 'Borrador' },
            { value: 'in_progress', label: 'En Progreso' },
            { value: 'completed', label: 'Completado' },
            { value: 'approved', label: 'Aprobado' },
            { value: 'cancelled', label: 'Cancelado' },
          ]}
          className="min-w-[180px]"
        />
      </div>

      <DataTable
        data={filteredCounts}
        columns={countColumns}
        keyExtractor={(c) => c.id}
        searchable
        searchPlaceholder="Buscar por ID, nombre, almacén..."
        searchKeys={['id', 'name', 'warehouse?.name']}
        sortable
        emptyMessage="No hay conteos de inventario"
      />

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
        onConfirm={() => showStartConfirm && handleStart(showStartConfirm!)}
        title="Iniciar Conteo"
        message="¿Iniciar este conteo físico? Cambiará el estado a 'En Progreso'."
        confirmLabel="Iniciar"
      />

      <ConfirmationModal
        open={!!showCompleteConfirm}
        onClose={() => setShowCompleteConfirm(null)}
        onConfirm={() => showCompleteConfirm && handleComplete(showCompleteConfirm!)}
        title="Completar Conteo"
        message="¿Marcar este conteo como completado? Se calcularán las diferencias."
        confirmLabel="Completar"
      />

      <ConfirmationModal
        open={!!showApproveConfirm}
        onClose={() => setShowApproveConfirm(null)}
        onConfirm={() => showApproveConfirm && handleApprove(showApproveConfirm!)}
        title="Aprobar Conteo"
        message="¿Aprobar este conteo? Una vez aprobado, se pueden aplicar los ajustes al stock."
        confirmLabel="Aprobar"
      />

      <ConfirmationModal
        open={!!showCancelConfirm}
        onClose={() => setShowCancelConfirm(null)}
        onConfirm={() => showCancelConfirm && handleCancel(showCancelConfirm!)}
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
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <FormField label="Nombre del conteo" required>
            <Input
              value={form.name}
              onChange={(e) => setForm((f: any) => ({ ...f, name: e.target.value }))}
              placeholder="Ej: Conteo mensual enero"
              required
            />
          </FormField>
          <FormField label="Almacén (opcional)">
            <Select
              value={form.warehouseId}
              onChange={(val) => setForm((f: any) => ({ ...f, warehouseId: val }))}
              options={[
                { value: '', label: 'Todos los almacenes' },
                ...warehouses.map((w: any) => ({ value: w.id, label: `${w.name} (${w.code})` })),
              ]}
            />
          </FormField>
          <FormField label="Notas" className="lg:col-span-3">
            <Textarea
              value={form.notes}
              onChange={(e) => setForm((f: any) => ({ ...f, notes: e.target.value }))}
              rows={2}
              placeholder="Observaciones..."
            />
          </FormField>
        </div>
        <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button type="submit" disabled={loading}>{loading ? <ButtonLoader /> : 'Crear'}</Button>
        </div>
      </form>
    </Modal>
  );
}

function CountDetailModal({ open, onClose, count, onUpdateItem, savingItem: _savingItem }: any) {
  if (!open || !count) return null;

  return (
    <Modal open={open} onClose={onClose} title={`Conteo: ${count.name || count.id.slice(0, 8)}`} wide>
      <div className="mb-4 space-y-2">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><strong>Estado:</strong> <Badge variant={statusBadgeVariant(count.status)}>{STATUS_LABELS[count.status]}</Badge></div>
          <div><strong>Almacén:</strong> {count.warehouse?.name || 'Todos'}</div>
          <div><strong>Creado por:</strong> {count.user?.name || '—'}</div>
          {count.startedAt && <div><strong>Iniciado:</strong> {new Date(count.startedAt).toLocaleString()}</div>}
          {count.completedAt && <div><strong>Completado:</strong> {new Date(count.completedAt).toLocaleString()}</div>}
          {count.approvedAt && <div><strong>Aprobado por:</strong> {count.approver?.name || '—'} ({new Date(count.approvedAt).toLocaleString()})</div>}
        </div>
        {count.notes && <div className="mt-3 p-3 bg-bg rounded-lg"><strong>Notas:</strong> {count.notes}</div>}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-border">
              <th className="text-left p-3">Producto</th>
              <th className="text-center p-3">Stock Sistema</th>
              <th className="text-center p-3">Contado</th>
              <th className="text-center p-3">Diferencia</th>
              <th className="p-3">Notas</th>
            </tr>
          </thead>
          <tbody>
            {count.items.map((item: any) => (
              <tr key={item.id} className="border-b border-border">
                <td className="p-3">{item.product?.name || item.productId.slice(0, 8)}</td>
                <td className="text-center p-3">{item.systemQty}</td>
                <td className="text-center p-3">
                  <Input
                    type="number"
                    min="0"
                    value={item.countedQty ?? ''}
                    onChange={(e) => onUpdateItem(count.id, item.id, parseInt(e.target.value) || 0, item.notes)}
                    className="w-24 text-center"
                    disabled={count.status !== 'in_progress'}
                  />
                </td>
                <td className="text-center p-3 font-semibold" style={{ color: item.difference !== 0 ? 'var(--color-danger)' : 'var(--color-success)' }}>
                  {item.difference >= 0 ? '+' : ''}{item.difference}
                </td>
                <td className="p-3">
                  <Input
                    value={item.notes || ''}
                    onChange={(e) => onUpdateItem(count.id, item.id, item.countedQty ?? item.systemQty, e.target.value)}
                    className="w-full"
                    disabled={count.status !== 'in_progress'}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

function ConfirmationModal({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel,
  danger,
}: any) {
  if (!open) return null;
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancelar</Button>
        <Button variant={danger ? 'danger' : 'primary'} onClick={() => { onConfirm(); onClose(); }}>
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}
