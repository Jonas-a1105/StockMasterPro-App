import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/lib/http/client';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useTheme } from '@contexts/ThemeContext';
import { Plus, Trash2, DollarSign, Pencil } from 'lucide-react';
import { Stack } from '@shared/ui/Stack';
import { Grid } from '@shared/ui/Grid';
import { SkeletonTable } from '@shared/ui/Skeleton';
import { ImportModal } from '@shared/ui';
import { DataTable } from '@shared/ui';
import { Toolbar } from '@shared/ui';
import { CustomerForm } from '../components/CustomerForm';
import { PaymentModal } from '../components/PaymentModal';
import { CustomerKpiBar } from '../components/CustomerKpiBar';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import type { Customer } from '@types';

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
  const { formatUsd } = useExchangeRate();
  const { config } = useTheme();

  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '', email: '', phone: '', address: '',
    taxId: '', documentType: 'V', fiscalAddress: '', creditLimit: 0,
  });
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showPayment, setShowPayment] = useState(false);
  const [payingCustomer, setPayingCustomer] = useState<Customer | null>(null);
  const [payAmount, setPayAmount] = useState('');
  const [error, setError] = useState('');

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
    setFormData({
      name: '', email: '', phone: '', address: '',
      taxId: '', documentType: 'V', fiscalAddress: '', creditLimit: 0,
    });
    setError('');
    setShowForm(true);
  };

  const openEdit = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({
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
    setShowForm(true);
  };

  const handleSave = async (data: any) => {
    setError('');
    setSaving(true);

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

    const payload = {
      ...data,
      email: emailPayload,
      phone: phonePayload,
    };

    try {
      if (editingCustomer) {
        await api.updateCustomer(editingCustomer.id, payload);
      } else {
        await api.createCustomer(payload);
      }
      setShowForm(false);
      setEditingCustomer(null);
      setFormData({
        name: '', email: '', phone: '', address: '',
        taxId: '', documentType: 'V', fiscalAddress: '', creditLimit: 0,
      });
      await loadCustomers();
      showToast(editingCustomer ? 'Cliente actualizado' : 'Cliente creado', 'success');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async (amount: number, method: 'cash' | 'card' | 'transfer') => {
    if (!payingCustomer || amount <= 0) return;
    try {
      await api.addCustomerPayment(payingCustomer.id, amount);
      showToast('Abono registrado', 'success');
      setShowPayment(false);
      setPayingCustomer(null);
      setPayAmount('');
      await loadCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openPay = (c: Customer) => {
    setPayingCustomer(c);
    setPayAmount('');
    setShowPayment(true);
  };

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

  const canManage = user?.role !== 'cajero';
  const showExportImport = licenseStatus?.tier !== 'free';

  return (
    <>
      <CustomerKpiBar customers={customers} />

      <Stack gap="lg" className="wFull">
        <Toolbar
          search={{ value: search, onChange: setSearch, placeholder: 'Buscar clientes, email, teléfono...' }}
          onExport={showExportImport ? handleExportCustomers : undefined}
          onImport={showExportImport ? () => setShowImport(true) : undefined}
          addBtn={isLimitExceeded ? undefined : {
            label: 'Nuevo Cliente',
            onClick: openCreate,
            icon: <Plus size={18} />,
            show: canManage,
          }}
        />

        {loading ? (
          <SkeletonTable rows={8} cols={6} />
        ) : (
          <DataTable
            data={filteredCustomers}
            columns={[
              {
                key: 'name',
                header: 'Cliente',
                render: (c: Customer) => (
                  <div className="flex items-center gap-3">
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
                render: (c: Customer) => (
                  <span className={c.balance >= 0 ? 'text-success' : 'text-danger'}>
                    {formatUsd(c.balance)}
                  </span>
                ),
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
                        {formatUsd(c.creditLimit)}
                      </span>
                      {c.creditLimit > 0 && (
                        <div className="w-24 h-2 bg-surface-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full transition-all ${
                              pct >= 100 ? 'bg-danger' : pct >= 80 ? 'bg-warning' : 'bg-success'
                            }`}
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
            ]}
            data={filteredCustomers}
            keyExtractor={(c) => c.id}
            searchable
            searchPlaceholder="Buscar clientes, email, teléfono..."
            searchKeys={['name', 'email', 'phone'] as const}
            sortable
            emptyMessage="No hay clientes registrados"
            loading={loading}
          />
        )}

      </Stack>

      <CustomerForm
        open={showForm}
        onClose={() => { setShowForm(false); setEditingCustomer(null); }}
        editingCustomer={editingCustomer}
        initialData={formData}
        onSubmit={handleSave}
        saving={saving}
        error={error}
        isLimitExceeded={isLimitExceeded}
        nextRequiredPlan={nextRequiredPlan}
      />

      <PaymentModal
        open={showPayment}
        onClose={() => { setShowPayment(false); setPayingCustomer(null); setPayAmount(''); }}
        customer={payingCustomer}
        onPay={handlePay}
        loading={saving}
      />

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Clientes"
        columns={CUSTOMER_COLUMNS}
        templateFilename="plantilla_clientes"
        onImport={handleImportCustomers}
      />
    </>
  );
}