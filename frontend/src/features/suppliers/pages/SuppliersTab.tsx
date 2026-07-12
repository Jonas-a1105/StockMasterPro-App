import { useState, useEffect } from 'react';
import { Plus, Download, Upload, Users, Truck } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers.api';
import { SuppliersList } from '../components/SuppliersList';
import { SupplierForm, type SupplierFormData } from '../components/SupplierForm';
import { ImportModal } from '@shared/ui/ImportModal';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import type { Supplier } from '@types';
import styles from '@features/inventory/pages/InventoryPage.module.css';

const SUPPLIER_COLUMNS: ColumnMapping[] = [
  { header: 'Nombre', key: 'name', type: 'string' },
  { header: 'Contacto', key: 'contact', type: 'string' },
  { header: 'Teléfono', key: 'phone', type: 'string' },
  { header: 'Email', key: 'email', type: 'string' },
  { header: 'Dirección', key: 'address', type: 'string' },
];

export function SuppliersTab() {
  const { showToast } = useToast();
  const { user, licenseStatus, licenseUsage } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<SupplierFormData>({ name: '', contact: '', phone: '', email: '', address: '', taxId: '', fiscalAddress: '' });
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const isLimitExceeded = !editingId && licenseUsage?.suppliers && licenseUsage.suppliers.limit !== null && licenseUsage.suppliers.current >= licenseUsage.suppliers.limit;
  const nextRequiredPlan = 'pro';

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try { setSuppliers(await getSuppliers()); } catch {}
  };

  const handleExport = () => {
    exportToExcel(suppliers, SUPPLIER_COLUMNS, 'proveedores', 'xlsx');
    showToast('Lista de proveedores exportada correctamente', 'success');
  };

  const handleImport = async (data: any[], onProgress: (c: number, t: number) => void) => {
    let successCount = 0, errorCount = 0;
    const details: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) throw new Error('El nombre del proveedor es obligatorio.');
        const existing = suppliers.find(s => s.name.toLowerCase() === row.name.toLowerCase());
        const payload = { name: row.name, contact: row.contact || '', phone: row.phone || '', email: row.email || '', address: row.address || '' };
        if (existing) { await updateSupplier(existing.id, payload); details.push(`Actualizado: ${row.name}`); }
        else { await createSupplier(payload); details.push(`Creado: ${row.name}`); }
        successCount++;
      } catch (err: any) { errorCount++; details.push(`Error en fila ${i + 1} (${row.name || 'Sin Nombre'}): ${err.message}`); }
      onProgress(i + 1, data.length);
    }
    await loadSuppliers();
    return { successCount, errorCount, details };
  };

  const handleSubmit = async (data: SupplierFormData) => {
    setLoading(true);
    try {
      const emailPayload = data.email.trim() && !data.email.includes('@') ? `${data.email.trim()}@gmail.com` : data.email.trim();
      const cleanPhone = data.phone.replace(/[\s\-()]/g, '');
      const phonePayload = cleanPhone === '+58' ? '' : (cleanPhone && !cleanPhone.startsWith('+') ? `+58${cleanPhone}` : cleanPhone);
      const payload: any = { name: data.name };
      if (data.contact) payload.contact = data.contact;
      if (phonePayload) payload.phone = phonePayload;
      if (emailPayload) payload.email = emailPayload;
      if (data.address) payload.address = data.address;
      if (data.taxId) payload.taxId = data.taxId;
      if (data.fiscalAddress) payload.fiscalAddress = data.fiscalAddress;
      if (editingId) { await updateSupplier(editingId, payload); } else { await createSupplier(payload); }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', contact: '', phone: '', email: '', address: '', taxId: '', fiscalAddress: '' });
      await loadSuppliers();
    } catch (err: any) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const startEdit = (supplier: Supplier) => {
    setForm({ name: supplier.name, contact: supplier.contact || '', phone: supplier.phone || '', email: supplier.email || '', address: supplier.address || '', taxId: supplier.taxId || '', fiscalAddress: supplier.fiscalAddress || '' });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try { await deleteSupplier(id); await loadSuppliers(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  const openWhatsApp = (phone: string, name: string) => {
    window.open(`https://wa.me/${phone.replace(/[\s\-()]/g, '')}?text=${encodeURIComponent(`Hola ${name}, te contacto desde StockMaster Pro. `)}`, '_blank');
  };

  const totalSuppliers = suppliers.length;
  const suppliersWithPhone = suppliers.filter(s => s.phone).length;

  return (
    <>
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><Users size={18} /></div>
          <div className={styles.kpiContent}><span className={styles.kpiValue}>{totalSuppliers}</span><span className={styles.kpiLabel}>Total Proveedores</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><Truck size={18} /></div>
          <div className={styles.kpiContent}><span className={styles.kpiValue}>{suppliersWithPhone}</span><span className={styles.kpiLabel}>Con Teléfono</span></div>
        </div>
      </div>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Proveedores</h3>
        {user?.role !== 'cajero' && (
          <div className={styles.flexRow}>
            <button className={styles.exportBtn} onClick={handleExport}><Download size={16} /> Exportar</button>
            <button className={styles.importBtn} onClick={() => setShowImport(true)}><Upload size={16} /> Importar</button>
            <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', contact: '', phone: '', email: '', address: '', taxId: '', fiscalAddress: '' }); }}>
              <Plus size={18} /> Nuevo Proveedor
            </button>
          </div>
        )}
      </div>
      <SuppliersList suppliers={suppliers} userRole={user?.role} onEdit={startEdit} onDelete={handleDelete} onWhatsApp={openWhatsApp} />
      <SupplierForm open={showForm} editingId={editingId} initialData={form} onClose={() => { setShowForm(false); setEditingId(null); }} onSubmit={handleSubmit} loading={loading} isLimitExceeded={isLimitExceeded} nextRequiredPlan={nextRequiredPlan} />
      <ImportModal open={showImport} onClose={() => setShowImport(false)} title="Proveedores" columns={SUPPLIER_COLUMNS} templateFilename="plantilla_proveedores" onImport={handleImport} />
    </>
  );
}
