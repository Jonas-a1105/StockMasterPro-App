import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '@shared/lib/http/client';
import { useAuth } from '@contexts/AuthContext';
import { Pencil, Trash2, DollarSign, MessageCircle, Users } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { PremiumLockButton } from '@shared/ui/PremiumLockButton';
import { Modal } from '@shared/ui/Modal';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { TabNav } from '@shared/ui/TabNav';
import { Toolbar } from '@shared/ui/Toolbar';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { useTheme } from '@contexts/ThemeContext';
import type { Customer } from '@types';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { ImportModal } from '@shared/ui/ImportModal';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import styles from './CustomersPage.module.css';
import tableStyles from '@shared/ui/TableList.module.css';

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

  const isLimitExceeded =
    !editingCustomer &&
    licenseUsage?.customers &&
    licenseUsage.customers.limit !== null &&
    licenseUsage.customers.current >= licenseUsage.customers.limit;
  const nextRequiredPlan = 'pro';
  const [search, setSearch] = useState('');

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
      loadCustomers();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este cliente?')) return;
    try {
      await api.deleteCustomer(id);
      loadCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handlePay = async () => {
    if (!payingCustomer || payAmount <= 0) return;
    setSaving(true);
    try {
      await api.payCustomerCredit(payingCustomer.id, payAmount);
      setShowPayModal(false);
      setPayingCustomer(null);
      setPayAmount(0);
      loadCustomers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const creditStatusClass = (balance: number, limit: number) => {
    if (limit === 0) return '';
    const ratio = balance / limit;
    if (ratio >= 0.9) return styles.creditDanger;
    if (ratio >= 0.6) return styles.creditWarning;
    return styles.creditOk;
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const message = encodeURIComponent(`Hola ${name}, te contacto desde StockMaster Pro. `);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleEmailBlur = () => {
    const email = form.email.trim();
    if (email && !email.includes('@')) {
      setForm((p) => ({ ...p, email: email + '@gmail.com' }));
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      !search ||
      c.name.toLowerCase().includes(search.toLowerCase()) ||
      (c.email || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.phone || '').includes(search)
  );

  const totalCustomers = customers.length;
  const totalCredit = customers.reduce((sum, c) => sum + (c.creditLimit || 0), 0);
  const totalBalance = customers.reduce((sum, c) => sum + (c.balance || 0), 0);

  if (loading)
    return config.skeletonEnabled ? (
      <SkeletonTablePage rows={8} cols={7} kpi={3} />
    ) : (
      <LoadingDots text="Cargando clientes" />
    );

  return (
    <div className={styles.container}>
      <TabNav
        tabs={[{ key: 'main', label: 'Clientes', icon: <Users size={16} /> }]}
        activeTab="main"
        onTabChange={() => {}}
      />
      <KpiGrid
        items={[
          { icon: <Users size={18} />, value: totalCustomers, label: 'Total Clientes' },
          {
            icon: <DollarSign size={18} />,
            value: formatPrice(totalCredit),
            label: 'Límite de Crédito',
          },
          {
            icon: <DollarSign size={18} />,
            value: formatPrice(totalBalance),
            label: 'Saldo Pendiente',
            color: totalBalance > 0 ? 'var(--color-danger)' : 'var(--color-success)',
          },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar clientes...' }}
        onExport={handleExportCustomers}
        onImport={() => setShowImport(true)}
        addBtn={{ label: 'Nuevo Cliente', onClick: openCreate }}
      />

      <div className={tableStyles.container}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Email</th>
              <th>Teléfono</th>
              <th className={styles.textRight}>Límite Crédito</th>
              <th className={styles.textRight}>Saldo Actual</th>
              <th>Estado</th>
              <th className={styles.textCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredCustomers.map((c) => (
              <tr key={c.id}>
                <td>
                  <span className={tableStyles.nameText}>{c.name}</span>
                </td>
                <td className={styles.colorMuted}>{c.email || '—'}</td>
                <td>{c.phone || '—'}</td>
                <td className={styles.textRight}>
                  <span className={tableStyles.numberValue}>{formatPrice(c.creditLimit)}</span>
                </td>
                <td className={styles.textRight}>
                  <span
                    className={`${tableStyles.numberValue} ${styles.balanceColor}`}
                    style={
                      {
                        '--balance-color':
                          c.balance > c.creditLimit * 0.8
                            ? 'var(--color-danger)'
                            : c.balance > 0
                              ? 'var(--color-warning)'
                              : 'var(--color-success)',
                      } as React.CSSProperties
                    }
                  >
                    {formatPrice(c.balance)}
                  </span>
                </td>
                <td>
                  {c.creditLimit > 0 ? (
                    <div className={tableStyles.progressBar}>
                      <div className={`${tableStyles.progressTrack} ${styles.w80px}`}>
                        <div
                          className={`${tableStyles.progressFill} ${styles.barFillWidth} ${c.balance > c.creditLimit * 0.8 ? 'red' : c.balance > 0 ? 'orange' : 'green'}`}
                          style={
                            {
                              '--bar-fill-width': `${Math.min(100, (c.balance / c.creditLimit) * 100)}%`,
                            } as React.CSSProperties
                          }
                        />
                      </div>
                    </div>
                  ) : (
                    <span className={styles.noCredit}>Sin crédito</span>
                  )}
                </td>
                <td className={styles.textCenter}>
                  <div className={`${styles.actions} ${styles.justifyCenter}`}>
                    {c.phone && (
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => openWhatsApp(c.phone!, c.name)}
                        title="Enviar WhatsApp"
                      >
                        <MessageCircle size={14} />
                      </button>
                    )}
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => openEdit(c)}
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    {c.balance > 0 && (
                      <button
                        className={tableStyles.actionBtn}
                        onClick={() => {
                          setPayingCustomer(c);
                          setPayAmount(0);
                          setShowPayModal(true);
                        }}
                        title="Abonar"
                      >
                        <DollarSign size={14} />
                      </button>
                    )}
                    {user?.role === 'admin' && (
                      <button
                        className={`${tableStyles.actionBtn} danger`}
                        onClick={() => handleDelete(c.id)}
                        title="Eliminar"
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredCustomers.length === 0 && (
              <tr>
                <td
                  colSpan={7}
                  className={`${styles.textCenter} ${styles.p40} ${styles.colorMuted}`}
                >
                  No hay clientes registrados
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal
          open={showModal}
          onClose={() => setShowModal(false)}
          title={editingCustomer ? 'Editar Cliente' : 'Nuevo Cliente'}
        >
          <div className={styles.modalContent}>
            <form onSubmit={handleSave} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label>Nombre</label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  required
                  placeholder="Nombre del cliente"
                />
              </div>
              <div className={styles.field}>
                <label>Email</label>
                {!form.email.includes('@') || form.email.endsWith('@gmail.com') ? (
                  <div className={styles.inputSuffix}>
                    <input
                      type="text"
                      value={
                        form.email.endsWith('@gmail.com') ? form.email.slice(0, -10) : form.email
                      }
                      onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      placeholder="usuario"
                    />
                    <span>@gmail.com</span>
                  </div>
                ) : (
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                    placeholder="usuario@gmail.com"
                  />
                )}
              </div>
              <div className={styles.field}>
                <label>Teléfono / WhatsApp</label>
                {form.phone.startsWith('+58') || !form.phone.startsWith('+') ? (
                  <div className={styles.inputPrefix}>
                    <span>+58</span>
                    <input
                      type="text"
                      value={form.phone.startsWith('+58') ? form.phone.slice(3) : form.phone}
                      onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      placeholder="4XX XXX XXXX"
                    />
                  </div>
                ) : (
                  <input
                    type="text"
                    value={form.phone}
                    onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                    placeholder="+58 4XX XXX XXXX"
                  />
                )}
              </div>
              <div className={styles.field}>
                <label>Dirección</label>
                <input
                  value={form.address}
                  onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                  placeholder="Dirección del cliente"
                />
              </div>
              <div className={styles.field}>
                <label>RIF / CI / J</label>
                <input
                  value={form.taxId}
                  onChange={(e) => setForm((p) => ({ ...p, taxId: e.target.value }))}
                  placeholder="J-12345678-9 / V-12345678"
                />
              </div>
              <div className={styles.field}>
                <label>Tipo Doc.</label>
                <select
                  value={form.documentType}
                  onChange={(e) => setForm((p) => ({ ...p, documentType: e.target.value }))}
                >
                  <option value="V">V - Venezolano</option>
                  <option value="E">E - Extranjero</option>
                  <option value="J">J - Jurídico</option>
                  <option value="G">G - Gobierno</option>
                  <option value="P">P - Pasaporte</option>
                </select>
              </div>
              <div className={styles.fieldFull}>
                <label>Dirección Fiscal</label>
                <input
                  value={form.fiscalAddress}
                  onChange={(e) => setForm((p) => ({ ...p, fiscalAddress: e.target.value }))}
                  placeholder="Dirección fiscal del cliente"
                />
              </div>
              <div className={styles.field}>
                <label>Límite de crédito ($)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.creditLimit || ''}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, creditLimit: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0.00"
                />
              </div>
              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowModal(false)}
                >
                  Cancelar
                </button>
                {isLimitExceeded ? (
                  <PremiumLockButton
                    requiredPlan={nextRequiredPlan}
                    width="140px"
                    height="38px"
                    label="Límite Superado"
                    sublabel="Mantén pulsado para ampliar"
                  />
                ) : (
                  <button type="submit" className={styles.saveBtn} disabled={saving}>
                    {saving ? <ButtonLoader /> : editingCustomer ? 'Actualizar' : 'Crear Cliente'}
                  </button>
                )}
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showPayModal && payingCustomer && (
        <Modal
          open={showPayModal}
          onClose={() => {
            setShowPayModal(false);
            setPayingCustomer(null);
          }}
          title={`Abonar a ${payingCustomer.name}`}
        >
          <div className={styles.modalContent}>
            <div className={styles.payInfo}>
              <div className={styles.payRow}>
                <span>Saldo actual</span>
                <span className={styles.payValue}>{formatPrice(payingCustomer.balance)}</span>
              </div>
              <div className={styles.payRow}>
                <span>Límite de crédito</span>
                <span>{formatPrice(payingCustomer.creditLimit)}</span>
              </div>
            </div>
            <div className={styles.field}>
              <label>Monto a abonar</label>
              <input
                type="number"
                min="0"
                step="0.01"
                max={payingCustomer.balance}
                value={payAmount || ''}
                onChange={(e) => setPayAmount(parseFloat(e.target.value) || 0)}
                autoFocus
                placeholder="Monto a abonar"
              />
            </div>
            <div className={styles.modalActions}>
              <button
                type="button"
                className={styles.cancelBtn}
                onClick={() => {
                  setShowPayModal(false);
                  setPayingCustomer(null);
                }}
              >
                Cancelar
              </button>
              <button
                className={styles.saveBtn}
                onClick={handlePay}
                disabled={saving || payAmount <= 0}
              >
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
