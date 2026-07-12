import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/lib/http/client';
import { useAuth } from '@contexts/AuthContext';
import { Pencil, Trash2, DollarSign, MessageCircle, Users, Plus, Download, Upload } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { PremiumLockButton } from '@shared/ui/PremiumLockButton';
import { Modal } from '@shared/ui/Modal';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { DataTable } from '@shared/ui/DataTable';
import { FormField } from '@shared/ui/FormField';
import { Input } from '@shared/ui/Input';
import { Select } from '@shared/ui/Select';
import { Badge } from '@shared/ui/Badge';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { ImportModal } from '@shared/ui/ImportModal';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import { useTheme } from '@contexts/ThemeContext';
import type { Customer } from '@types';
import { useExchangeRate } from '@contexts/ExchangeRateContext';

const CUSTOMER_COLUMNS: ColumnMapping[] = [
  { header: 'Nombre', key: 'name', type: 'string' },
  { header: 'Email', key: 'email', type: 'string' },
  { header: 'Teléfono', key: 'phone', type: 'string' },
  { header: 'Dirección', key: 'address', type: 'string' },
  { header: 'Límite de Crédito', key: 'creditLimit', type: 'number' },
];

export function CustomersPage() {
  const { showToast } = useToast();
  const { user, licenseStatus, licenseUsage } = useAuth();
  const navigate = useNavigate();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    taxId: '',
    documentType: 'V',
    fiscalAddress: '',
    creditLimit: 0,
  });
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');

  const isLimitExceeded =
    !editingCustomer &&
    licenseUsage?.customers &&
    licenseUsage.customers.limit !== null &&
    licenseUsage.customers.current >= licenseUsage.customers.limit;
  const nextRequiredPlan = 'pro';

  const loadCustomers = async () => {
    try {
      const data = await api.getCustomers();
      setCustomers(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCustomers();
  }, []);

  const handleExportCustomers = () => {
    exportToExcel(customers, CUSTOMER_COLUMNS, 'clientes', 'xlsx');
    showToast('Lista de clientes exportada correctamente', 'success');
  };

  const handleImportCustomers = async (
    data: any[],
    onProgress: (current: number, total: number) => void
  ) => {
    let successCount = 0;
    let errorCount = 0;
    const details: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) throw new Error('El nombre es obligatorio.');
        const existing = customers.find((c) => c.name.toLowerCase() === row.name.toLowerCase());
        const payload = {
          name: row.name,
          email: row.email || '',
          phone: row.phone || '',
          address: row.address || '',
          creditLimit: Number(row.creditLimit) || 0,
        };
        if (existing) {
          await api.updateCustomer(existing.id, payload);
          details.push(`Actualizado: ${row.name}`);
        } else {
          await api.createCustomer(payload);
          details.push(`Creado: ${row.name}`);
        }
        successCount++;
      } catch (err: any) {
        errorCount++;
        details.push(`Error fila ${i + 1} (${row.name || 'Sin Nombre'}): ${err.message}`);
      }
      onProgress(i + 1, data.length);
    }
    await loadCustomers();
    return { successCount, errorCount, details };
  };

  const openCreate = () => {
    setEditingCustomer(null);
    setForm({
      name: '',
      email: '',
      phone: '',
      address: '',
      taxId: '',
      documentType: 'V',
      fiscalAddress: '',
      creditLimit: 0,
    });
    setError('');
    setShowModal(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setForm({
      name: c.name,
      email: c.email || '',
      phone: c.phone || '',
      address: c.address || '',
      taxId: c.taxId || '',
      documentType: c.documentType || 'V',
      fiscalAddress: c.fiscalAddress || '',
      creditLimit: c.creditLimit,
    });
    setError('');
    setShowModal(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);

    const emailPayload =
      form.email.trim() && !form.email.includes('@')
        ? `${form.email.trim()}@gmail.com`
        : form.email.trim();

    const cleanPhone = form.phone.replace(/[\s\-()]/g, '');
    const phonePayload =
      cleanPhone === '+58'
        ? ''
        : cleanPhone && !cleanPhone.startsWith('+')
          ? `+58${cleanPhone}`
          : cleanPhone;

    const payload = {
      ...form,
      email: emailPayload,
      phone: phonePayload,
    };

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
      } else {
        await api.createCustomer(payload);
      }
      setShowModal(false);
      setEditingCustomer(null);
      setForm({
        name: '',
        email: '',
        phone: '',
        address: '',
        taxId: '',
        documentType: 'V',
        fiscalAddress: '',
        creditLimit: 0,
      });
      await loadCustomers();
      showToast(editingCustomer ? 'Cliente actualizado' : 'Cliente creado', 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async () => {
    if (!payingCustomer || payAmount <= 0) return;
    try {
      await api.addCustomerPayment(payingCustomer.id, payAmount);
      showToast('Abono registrado', 'success');
      setShowPayModal(false);
      setPayingCustomer(null);
      setPayAmount(0);
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openPay = (c: Customer) => {
    setPayingCustomer(c);
    setPayAmount(0);
    setShowPayModal(true);
  };

  const customerColumns = useMemo(
    () => [
      {
        key: 'name',
        header: 'Cliente',
        render: (c: Customer) => (
          <div className="flex items-center gap-3">
            <Users size={18} className="text-text-muted" />
            <span className="font-semibold">{c.name}</span>
          </div>
        ),
      },
      { key: 'email', header: 'Email', render: (c: Customer) => c.email || '—' },
      { key: 'phone', header: 'Teléfono', render: (c: Customer) => c.phone || '—' },
      { key: 'address', header: 'Dirección', render: (c: Customer) => c.address || '—' },
      {
        key: 'balance',
        header: 'Saldo',
        align: 'right' as const,
        render: (c: Customer) => <span className={c.balance >= 0 ? 'text-success' : 'text-danger'}>{formatPrice(c.balance)}</span>,
      },
      {
        key: 'creditLimit',
        header: 'Límite Crédito',
        align: 'right' as const,
        render: (c: Customer) => {
          const pct = c.creditLimit > 0 ? (c.balance / c.creditLimit) * 100 : 0;
          const color = pct >= 100 ? 'danger' : pct >= 80 ? 'warning' : 'success';
          return (
            <div className="flex items-center gap-2">
              <span className={`font-mono ${pct >= 100 ? 'text-danger' : pct >= 80 ? 'text-warning' : 'text-success'}`}>
                {formatPrice(c.creditLimit)}
              </span>
              {c.creditLimit > 0 && (
                <div className="w-24 h-2 bg-surface-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-success'}`}
                    style={{ width: `${Math.min(pct, 100)}%` }}
                  />
                </div>
              )}
            </div>
          );
        },
      },
      {
        key: 'actions',
        header: 'Acciones',
        align: 'center' as const,
        render: (c: Customer) => (
          <div className="flex items-center justify-center gap-1.5">
            <button
              onClick={() => openEdit(c)}
              className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors"
              title="Editar"
            >
              <Pencil size={14} />
            </button>
            <button
              onClick={() => openPay(c)}
              className="p-1.5 rounded-lg hover:bg-success-bg text-success transition-colors"
              title="Abonar"
            >
              <DollarSign size={14} />
            </button>
            <button
              onClick={() => handleDelete(c.id, c.name)}
              className="p-1.5 rounded-lg hover:bg-danger-bg text-danger transition-colors"
              title="Eliminar"
            >
              <Trash2 size={14} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Eliminar cliente "${name}"?`)) return;
    try {
      await api.deleteCustomer(id);
      showToast('Cliente eliminado', 'success');
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const filteredCustomers = useMemo(
    () =>
      customers.filter(
        (c) =>
          c.name.toLowerCase().includes(search.toLowerCase()) ||
          c.email?.toLowerCase().includes(search.toLowerCase()) ||
          c.phone?.includes(search)
      ),
    [customers, search]
  );

  return (
    <div className="space-y-6">
      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar clientes, email, teléfono...' }}
        onExport={handleExportCustomers}
        onImport={() => setShowImport(true)}
        addBtn={isLimitExceeded ? undefined : { label: 'Nuevo Cliente', onClick: openCreate, icon: <Plus size={18} /> }}
      />

      <DataTable
        data={filteredCustomers}
        columns={customerColumns}
        keyExtractor={(c) => c.id}
        searchable
        searchPlaceholder="Buscar clientes, email, teléfono..."
        searchKeys={['name', 'email', 'phone']}
        sortable
        emptyMessage="No hay clientes registrados"
        loading={loading}
      />

      <Modal open={showModal} onClose={() => setShowModal(false)} title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'} wide>
        <form onSubmit={handleSave}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Nombre *" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </FormField>

            <FormField label="Email">
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                placeholder="email@ejemplo.com"
              />
            </FormField>

            <FormField label="Teléfono">
              <Input
                value={form.phone}
                onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                placeholder="+58 4XX XXX XXXX"
              />
            </FormField>

            <FormField label="Dirección" className="md:col-span-2">
              <Input
                value={form.address}
                onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                placeholder="Dirección de entrega"
              />
            </FormField>

            <FormField label="RIF / Cédula" className="md:col-span-2">
              <div className="flex gap-2">
                <Select
                  value={form.documentType}
                  onChange={(v) => setForm((p) => ({ ...p, documentType: v }))}
                  options={[
                    { value: 'V', label: 'V' },
                    { value: 'J', label: 'J' },
                    { value: 'E', label: 'E' },
                    { value: 'G', label: 'G' },
                  ]}
                  className="w-20"
                />
                <Input
                  value={form.taxId}
                  onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))}
                  placeholder="12345678-9"
                  className="flex-1"
                />
              </div>
            </FormField>

            <FormField label="Dirección Fiscal" className="md:col-span-3">
              <Input
                value={form.fiscalAddress}
                onChange={(e) => setForm((p) => ({ ...p, fiscalAddress: e.target.value }))}
                placeholder="Dirección fiscal completa"
              />
            </FormField>

            <FormField label="Límite de Crédito ($)">
              <Input
                type="number"
                step="0.01"
                value={form.creditLimit || ''}
                onChange={(e) => setForm((p) => ({ ...p, creditLimit: Number(e.target.value) }))}
                placeholder="0.00"
              />
            </FormField>
          </div>

          {error && <div className="mt-4 p-3 bg-danger/10 text-danger rounded-lg text-sm">{error}</div>}

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-border rounded-lg text-text hover:bg-bg-hover transition-colors">
              Cancelar
            </button>
            {isLimitExceeded ? (
              <PremiumLockButton
                requiredPlan={nextRequiredPlan as any}
                width="140px"
                height="38px"
                label="Límite Superado"
                sublabel="Mantén pulsado para ampliar"
              />
            ) : (
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={saving}>
                {saving ? <ButtonLoader /> : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </Modal>

      {showPayModal && payingCustomer && (
        <Modal
          open={showPayModal}
          onClose={() => {
            setShowPayModal(false);
            setPayingCustomer(null);
          }}
          title={`Abonar a ${payingCustomer.name}`}
        >
          <div className="space-y-4">
            <div className="flex flex-col gap-2 p-4 bg-bg-hover rounded-lg">
              <div className="flex justify-between">
                <span>Saldo actual</span>
                <span className="font-bold">{formatPrice(payingCustomer.balance)}</span>
              </div>
              <div className="flex justify-between">
                <span>Límite de crédito</span>
                <span>{formatPrice(payingCustomer.creditLimit)}</span>
              </div>
            </div>
            <FormField label="Monto a abonar">
              <Input
                type="number"
                min="0"
                step="0.01"
                max={payingCustomer.balance}
                value={payAmount || ''}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                autoFocus
                placeholder="Monto a abonar"
              />
            </FormField>
            <div className="flex justify-end gap-2 pt-4 border-t border-border">
              <button onClick={() => { setShowPayModal(false); setPayingCustomer(null); }} className="px-4 py-2 border border-border rounded-lg text-text hover:bg-bg-hover transition-colors">
                Cancelar
              </button>
              <button className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={saving || payAmount <= 0} onClick={handlePay}>
                {saving ? <ButtonLoader /> : 'Registrar Abono'}
              </button>
            </div>
          </div>
        </Modal>
      )}

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Clientes"
        columns={CUSTOMER_COLUMNS}
        templateFilename="plantilla_clientes"
        onImport={handleImportCustomers}
      />
    </div>
  );
}