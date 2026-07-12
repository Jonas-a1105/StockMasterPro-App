import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Modal } from '@shared/ui/Modal';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { DollarSign, Calendar, Users } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import styles from './AccountsReceivablePage.module.css';

interface Receivable {
  id: string;
  tenantId: string;
  customerId: string;
  saleId: string | null;
  totalAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes: string | null;
  createdAt: string;
  customer: { id: string; name: string };
}

export function AccountsReceivablePage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [receivables, setReceivables] = useState<Receivable[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingReceivable, setPayingReceivable] = useState<Receivable | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ customerId: '', totalAmount: 0, dueDate: '', notes: '' });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [r, c] = await Promise.all([api.getAccountsReceivable(), api.getCustomers()]);
      setReceivables(r);
      setCustomers(c);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setForm({ customerId: '', totalAmount: 0, dueDate: '', notes: '' });
    setError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createAccountsReceivable(form);
      setShowCreateModal(false);
      showToast('Cuenta por cobrar creada correctamente', 'success');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const openPay = (receivable: Receivable) => {
    setPayingReceivable(receivable);
    setPayAmount(receivable.pendingAmount);
    setPayMethod('cash');
    setError('');
    setShowPayModal(true);
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingReceivable) return;
    setError('');
    setSaving(true);
    try {
      await api.payAccountsReceivable(payingReceivable.id, { amount: payAmount, paymentMethod: payMethod });
      setShowPayModal(false);
      setPayingReceivable(null);
      showToast('Pago registrado correctamente', 'success');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const getStatusLabel = (status: string, dueDate: string) => {
    if (status === 'paid') return { label: 'Cobrada', className: styles.statusPaid };
    if (status === 'overdue') return { label: 'Vencida', className: styles.statusOverdue };
    const due = new Date(dueDate);
    const today = new Date();
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { label: 'Vencida', className: styles.statusOverdue };
    if (diffDays <= 5) return { label: 'Por vencer', className: styles.statusWarning };
    return { label: 'Pendiente', className: styles.statusPending };
  };

  const filtered = receivables.filter(r =>
    r.customer.name.toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = filtered.reduce((sum, r) => sum + (r.status !== 'paid' ? r.pendingAmount : 0), 0);
  const totalOverdue = filtered.reduce((sum, r) => sum + (r.status === 'overdue' || (r.status === 'pending' && new Date(r.dueDate) < new Date()) ? r.pendingAmount : 0), 0);
  const overdueCount = filtered.filter(r => r.status === 'overdue' || (r.status === 'pending' && new Date(r.dueDate) < new Date())).length;

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage /> : <LoadingDots text="Cargando cuentas por cobrar..." />;

  return (
    <>
      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por cliente...' }}
        addBtn={{ label: 'Nueva Cuenta', onClick: openCreate }}
      />

      <KpiGrid
        kpis={[
          { label: 'Total por Cobrar', value: formatPrice(totalPending), icon: DollarSign, color: '#f59e0b' },
          { label: 'Vencidas', value: formatPrice(totalOverdue), icon: Calendar, color: '#ef4444', subtitle: `${overdueCount} cuenta${overdueCount !== 1 ? 's' : ''}` },
          { label: 'Clientes', value: customers.length, icon: Users, color: '#3b82f6' },
        ]}
      />

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Cliente</th>
              <th>Total</th>
              <th>Pendiente</th>
              <th>Vencimiento</th>
              <th>Estado</th>
              <th>Notas</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={7} className={styles.emptyRow}>No hay cuentas por cobrar</td></tr>
            ) : filtered.map(r => {
              const statusInfo = getStatusLabel(r.status, r.dueDate);
              return (
                <tr key={r.id}>
                  <td><strong>{r.customer.name}</strong></td>
                  <td>{formatPrice(r.totalAmount)}</td>
                  <td>{formatPrice(r.pendingAmount)}</td>
                  <td>{new Date(r.dueDate).toLocaleDateString()}</td>
                  <td><span className={`${styles.statusBadge} ${statusInfo.className}`}>{statusInfo.label}</span></td>
                  <td className={styles.notesCell}>{r.notes || '—'}</td>
                  <td>
                    {r.status !== 'paid' && (
                      <button className={styles.payBtn} onClick={() => openPay(r)}>Cobrar</button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva Cuenta por Cobrar">
        <form onSubmit={handleCreate}>
          <div className={styles.formFields}>
            {error && <div className={styles.error}>{error}</div>}
            <label>Cliente *</label>
            <select value={form.customerId} onChange={e => setForm(p => ({ ...p, customerId: e.target.value }))} required>
              <option value="">Seleccionar cliente</option>
              {customers.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
            <label>Monto Total ($) *</label>
            <input type="number" step="0.01" min="0.01" value={form.totalAmount || ''} onChange={e => setForm(p => ({ ...p, totalAmount: Number(e.target.value) }))} required />
            <label>Fecha de Vencimiento *</label>
            <input type="date" value={form.dueDate} onChange={e => setForm(p => ({ ...p, dueDate: e.target.value }))} required />
            <label>Notas</label>
            <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Cancelar</button>
            <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? <LoadingDots /> : 'Crear'}</button>
          </div>
        </form>
      </Modal>

      <Modal open={showPayModal} onClose={() => setShowPayModal(false)} title="Registrar Cobro">
        {payingReceivable && (
          <form onSubmit={handlePay}>
            <div className={styles.formFields}>
              {error && <div className={styles.error}>{error}</div>}
              <p className={styles.mb12}>Cliente: <strong>{payingReceivable.customer.name}</strong></p>
              <p className={styles.mb12}>Pendiente: <strong>{formatPrice(payingReceivable.pendingAmount)}</strong></p>
              <label>Monto a cobrar *</label>
              <input type="number" step="0.01" min="0.01" max={payingReceivable.pendingAmount} value={payAmount || ''} onChange={e => setPayAmount(Number(e.target.value))} required />
              <label>Método de pago *</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)} required>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
            <div className={styles.formActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => setShowPayModal(false)}>Cancelar</button>
              <button type="submit" className={styles.saveBtn} disabled={saving}>{saving ? <LoadingDots /> : 'Confirmar Pago'}</button>
            </div>
          </form>
        )}
      </Modal>
    </>
  );
}
