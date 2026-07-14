import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { Edit2, Trash2, Building2, ToggleLeft, ToggleRight, MapPin, Package } from 'lucide-react';
import { TabNav } from '@shared/ui/TabNav';
import { KpiGrid } from '@shared/ui';
import { Toolbar } from '@shared/ui';
import styles from './WarehousePage.module.css';
import tableStyles from '@shared/ui/TableList/TableList.module.css';

export function WarehousePage() {
  const { showToast } = useToast();
  const { config } = useTheme();
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ type: 'create' | 'edit'; data?: any } | null>(null);
  const [search, setSearch] = useState('');

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    try {
      setWarehouses(await api.get('/warehouses'));
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(data: any) {
    try {
      await api.post('/warehouses', data);
      showToast('Almacén creado', 'success');
      setModal(null);
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleUpdate(id: string, data: any) {
    try {
      await api.put(`/warehouses/${id}`, data);
      showToast('Almacén actualizado', 'success');
      setModal(null);
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function handleDelete(id: string, name: string) {
    if (!confirm(`¿Eliminar almacén "${name}"? Los productos se desvincularán.`)) return;
    try {
      await api.delete(`/warehouses/${id}`);
      showToast('Almacén eliminado', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  async function toggleActive(w: any) {
    try {
      await api.put(`/warehouses/${w.id}`, { isActive: !w.isActive });
      showToast(w.isActive ? 'Almacén desactivado' : 'Almacén activado', 'success');
      load();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  }

  const filteredWarehouses = warehouses.filter(
    (w) =>
      !search ||
      w.name.toLowerCase().includes(search.toLowerCase()) ||
      (w.code || '').toLowerCase().includes(search.toLowerCase()) ||
      (w.address || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalWarehouses = warehouses.length;
  const activeWarehouses = warehouses.filter((w) => w.isActive).length;

  if (loading)
    return <SkeletonTablePage rows={8} cols={5} kpi={3} />;

  return (
    <div className={styles.container}>
      <TabNav
        tabs={[{ key: 'almacenes', label: 'Almacenes', icon: <Building2 size={16} /> }]}
        activeTab="almacenes"
        onTabChange={() => {}}
      />

      <KpiGrid
        items={[
          { icon: <Building2 size={18} />, value: totalWarehouses, label: 'Total Almacenes' },
          {
            icon: <Package size={18} />,
            value: activeWarehouses,
            label: 'Activos',
            color: 'var(--color-success)',
          },
          {
            icon: <MapPin size={18} />,
            value: totalWarehouses - activeWarehouses,
            label: 'Inactivos',
            color:
              totalWarehouses - activeWarehouses > 0
                ? 'var(--color-danger)'
                : 'var(--color-success)',
          },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar almacenes...' }}
        addBtn={{
          label: 'Nuevo Almacén',
          onClick: () => setModal({ type: 'create', data: { name: '', code: '', address: '' } }),
        }}
      />

      <div className={tableStyles.container}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Código</th>
              <th>Dirección</th>
              <th className={styles.textCenter}>Estado</th>
              <th className={styles.textCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredWarehouses.length === 0 ? (
              <tr>
                <td colSpan={5} className={styles.emptyRow}>
                  No hay almacenes registrados
                </td>
              </tr>
            ) : (
              filteredWarehouses.map((w) => (
                <tr key={w.id}>
                  <td>
                    <div className={tableStyles.nameCell}>
                      <Building2 size={14} className={styles.listAccent} />
                      <span className={tableStyles.nameText}>{w.name}</span>
                    </div>
                  </td>
                  <td>
                    <span className={tableStyles.code}>{w.code}</span>
                  </td>
                  <td className={styles.textMuted}>{w.address || '—'}</td>
                  <td className={styles.textCenter}>
                    <span
                      className={`${tableStyles.badge} ${w.isActive ? tableStyles.badgeActive : tableStyles.badgeInactive}`}
                    >
                      {w.isActive ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className={styles.textCenter}>
                    <div className={`${tableStyles.actions} ${styles.justifyCenter}`}>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => setModal({ type: 'edit', data: w })}
                        title="Editar"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => toggleActive(w)}
                        title={w.isActive ? 'Desactivar' : 'Activar'}
                      >
                        {w.isActive ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                      </button>
                      <button
                        className={`${tableStyles.actionBtn} danger`}
                        onClick={() => handleDelete(w.id, w.name)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {modal && (
        <WarehouseModal
          type={modal.type}
          data={modal.data}
          onSave={
            modal.type === 'create' ? handleCreate : (d: any) => handleUpdate(modal.data.id, d)
          }
          onClose={() => setModal(null)}
        />
      )}
    </div>
  );
}

function WarehouseModal({
  type,
  data,
  onSave,
  onClose,
}: {
  type: string;
  data?: any;
  onSave: (d: any) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState(data?.name || '');
  const [code, setCode] = useState(data?.code || '');
  const [address, setAddress] = useState(data?.address || '');
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !code.trim()) return;
    setSaving(true);
    await onSave({ name: name.trim(), code: code.trim(), address: address.trim() || undefined });
    setSaving(false);
  }

  return (
    <div className={styles.overlay} onClick={onClose}>
      <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
        <h3>{type === 'create' ? 'Nuevo Almacén' : 'Editar Almacén'}</h3>
        <form onSubmit={handleSubmit}>
          <div className={styles.field}>
            <label>Nombre *</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              placeholder="Ej: Sucursal Centro"
            />
          </div>
          <div className={styles.field}>
            <label>Código *</label>
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              required
              placeholder="Ej: SUC-001"
            />
          </div>
          <div className={styles.field}>
            <label>Dirección</label>
            <input
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Opcional"
            />
          </div>
          <div className={styles.modalActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
              Cancelar
            </button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>
              {saving ? 'Guardando...' : type === 'create' ? 'Crear' : 'Guardar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
