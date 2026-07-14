import { useState, useEffect } from 'react';
import { Plus, Download, Upload, Users, Truck } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { getSuppliers, createSupplier, updateSupplier, deleteSupplier } from '../api/suppliers.api';
import { SuppliersList } from '../components/SuppliersList';
import { SupplierForm, type SupplierFormData } from '../components/SupplierForm';
import { ImportModal, Card, Button, Heading, Text } from '@shared/ui';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import type { Supplier } from '@types';

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
  const [form, setForm] = useState<SupplierFormData>({
    name: '',
    contact: '',
    phone: '',
    email: '',
    address: '',
    taxId: '',
    fiscalAddress: '',
  });
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);

  const isLimitExceeded =
    !editingId &&
    licenseUsage?.suppliers &&
    licenseUsage.suppliers.limit !== null &&
    licenseUsage.suppliers.current >= licenseUsage.suppliers.limit;
  const nextRequiredPlan = 'pro';

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      setSuppliers(await getSuppliers());
    } catch {}
  };

  const handleExport = () => {
    exportToExcel(suppliers, SUPPLIER_COLUMNS, 'proveedores', 'xlsx');
    showToast('Lista de proveedores exportada correctamente', 'success');
  };

  const handleImport = async (data: any[], onProgress: (c: number, t: number) => void) => {
    let successCount = 0,
      errorCount = 0;
    const details: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) throw new Error('El nombre del proveedor es obligatorio.');
        const existing = suppliers.find((s) => s.name.toLowerCase() === row.name.toLowerCase());
        const payload = {
          name: row.name,
          contact: row.contact || '',
          phone: row.phone || '',
          email: row.email || '',
          address: row.address || '',
        };
        if (existing) {
          await updateSupplier(existing.id, payload);
          details.push(`Actualizado: ${row.name}`);
        } else {
          await createSupplier(payload);
          details.push(`Creado: ${row.name}`);
        }
        successCount++;
      } catch (err: any) {
        errorCount++;
        details.push(`Error en fila ${i + 1} (${row.name || 'Sin Nombre'}): ${err.message}`);
      }
      onProgress(i + 1, data.length);
    }
    await loadSuppliers();
    return { successCount, errorCount, details };
  };

  const handleSubmit = async (data: SupplierFormData) => {
    setLoading(true);
    try {
      const emailPayload =
        data.email.trim() && !data.email.includes('@')
          ? `${data.email.trim()}@gmail.com`
          : data.email.trim();
      const cleanPhone = data.phone.replace(/[\s\-()]/g, '');
      const phonePayload =
        cleanPhone === '+58'
          ? ''
          : cleanPhone && !cleanPhone.startsWith('+')
            ? `+58${cleanPhone}`
            : cleanPhone;
      const payload: any = { name: data.name };
      if (data.contact) payload.contact = data.contact;
      if (phonePayload) payload.phone = phonePayload;
      if (emailPayload) payload.email = emailPayload;
      if (data.address) payload.address = data.address;
      if (data.taxId) payload.taxId = data.taxId;
      if (data.fiscalAddress) payload.fiscalAddress = data.fiscalAddress;
      if (editingId) {
        await updateSupplier(editingId, payload);
      } else {
        await createSupplier(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({
        name: '',
        contact: '',
        phone: '',
        email: '',
        address: '',
        taxId: '',
        fiscalAddress: '',
      });
      await loadSuppliers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (supplier: Supplier) => {
    setForm({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
      taxId: supplier.taxId || '',
      fiscalAddress: supplier.fiscalAddress || '',
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      await deleteSupplier(id);
      await loadSuppliers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    window.open(
      `https://wa.me/${phone.replace(/[\s\-()]/g, '')}?text=${encodeURIComponent(`Hola ${name}, te contacto desde StockMaster Pro. `)}`,
      '_blank'
    );
  };

  const totalSuppliers = suppliers.length;
  const suppliersWithPhone = suppliers.filter((s) => s.phone).length;

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 bg-primary-light text-primary rounded-lg">
            <Users size={18} />
          </div>
          <div>
            <Text variant="h3" weight="bold" className="block">{totalSuppliers}</Text>
            <Text variant="caption" color="muted">Total Proveedores</Text>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="p-3 bg-success-light text-success rounded-lg">
            <Truck size={18} />
          </div>
          <div>
            <Text variant="h3" weight="bold" className="block">{suppliersWithPhone}</Text>
            <Text variant="caption" color="muted">Con Teléfono</Text>
          </div>
        </Card>
      </div>

      <div className="flex items-center justify-between mb-6">
        <Heading variant="h3">Proveedores</Heading>
        {user?.role !== 'cajero' && (
          <div className="flex items-center gap-2">
            <Button variant="secondary" size="sm" onClick={handleExport}>
              <Download size={16} /> Exportar
            </Button>
            <Button variant="secondary" size="sm" onClick={() => setShowImport(true)}>
              <Upload size={16} /> Importar
            </Button>
            <Button
              size="sm"
              onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setForm({
                  name: '',
                  contact: '',
                  phone: '',
                  email: '',
                  address: '',
                  taxId: '',
                  fiscalAddress: '',
                });
              }}
            >
              <Plus size={16} /> Nuevo Proveedor
            </Button>
          </div>
        )}
      </div>
      <SuppliersList
        suppliers={suppliers}
        userRole={user?.role}
        onEdit={startEdit}
        onDelete={handleDelete}
        onWhatsApp={openWhatsApp}
      />
      <SupplierForm
        open={showForm}
        editingId={editingId}
        initialData={form}
        onClose={() => {
          setShowForm(false);
          setEditingId(null);
        }}
        onSubmit={handleSubmit}
        loading={loading}
        isLimitExceeded={isLimitExceeded}
        nextRequiredPlan={nextRequiredPlan}
      />
      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Proveedores"
        columns={SUPPLIER_COLUMNS}
        templateFilename="plantilla_proveedores"
        onImport={handleImport}
      />
    </>
  );
}
