import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/common/Modal';
import { LoadingDots } from '../components/common/LoadingDots';
import { KpiGrid } from '../components/common/KpiGrid';
import { TabNav } from '../components/common/TabNav';
import { Toolbar } from '../components/common/Toolbar';
import { SkeletonTablePage } from '../components/common/Skeleton';
import { useTheme } from '../contexts/ThemeContext';
import { DollarSign, Calendar } from 'lucide-react';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import styles from './AccountsPayablePage.module.css';

interface Payable {
  id: string;
  tenantId: string;
  supplierId: string;
  purchaseOrderId: string | null;
  totalAmount: number;
  pendingAmount: number;
  dueDate: string;
  status: 'pending' | 'paid' | 'overdue';
  notes: string | null;
  createdAt: string;
  supplier: { id: string; name: string };
}

export function AccountsPayablePage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [payables, setPayables] = useState<Payable[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showPayModal, setShowPayModal] = useState(false);
  const [payingPayable, setPayingPayable] = useState<Payable | null>(null);
  const [payAmount, setPayAmount] = useState(0);
  const [payMethod, setPayMethod] = useState<'cash' | 'card' | 'transfer'>('cash');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ supplierId: '', totalAmount: 0, dueDate: '', notes: '' });
  const [search, setSearch] = useState('');

  const loadData = async () => {
    try {
      const [p, s] = await Promise.all([api.getAccountsPayable(), api.getSuppliers()]);
      setPayables(p);
      setSuppliers(s);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setForm({ supplierId: '', totalAmount: 0, dueDate: '', notes: '' });
    setError('');
    setShowCreateModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSaving(true);
    try {
      await api.createAccountsPayable(form);
      setShowCreateModal(false);
      showToast('Cuenta por pagar creada correctamente', 'success');
      loadData();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handlePay = async () => {
    if (!payingPayable || payAmount <= 0) return;
    setSaving(true);
    try {
      await api.payAccountsPayable({ accountPayableId: payingPayable.id, amount: payAmount, paymentMethod: payMethod });
      setShowPayModal(false);
      setPayingPayable(null);
      setPayAmount(0);
      showToast('Abono registrado correctamente', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const statusBadge = (status: string, dueDate: string) => {
    if (status === 'paid') return <span className={`${styles.badge} ${styles.badgePaid}`}>Pagada</span>;
    if (status === 'pending' && new Date() > new Date(dueDate)) return <span className={`${styles.badge} ${styles.badgeOverdue}`}>Vencida</span>;
    return <span className={`${styles.badge} ${styles.badgePending}`}>Pendiente</span>;
  };

  const filteredPayables = payables.filter(p =>
    !search ||
    (p.supplier?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    (p.notes || '').toLowerCase().includes(search.toLowerCase())
  );

  const totalPending = payables.reduce((sum, p) => sum + (p.pendingAmount || 0), 0);
  const totalAmount = payables.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
  const overdueCount = payables.filter(p => p.status === 'overdue' || (p.status === 'pending' && new Date(p.dueDate) < new Date())).length;

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={6} cols={6} tabs={0} kpi={3} /> : <LoadingDots text="Cargando cuentas por pagar" />;

  return (
    <div className={styles.container}>
      <TabNav tabs={[{ key: 'main', label: 'Cuentas por Pagar', icon: <DollarSign size={16} /> }]} activeTab="main" onTabChange={() => {}} />
      <KpiGrid
        items={[
          { icon: <DollarSign size={18} />, value: formatPrice(totalPending), label: 'Total Pendiente' },
          { icon: <DollarSign size={18} />, value: formatPrice(totalAmount), label: 'Total Cuentas' },
          { icon: <Calendar size={18} />, value: overdueCount, label: 'Vencidas', color: overdueCount > 0 ? '#dc2626' : '#16a34a' },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar cuentas...' }}
        addBtn={{ label: 'Nueva Cuenta', onClick: openCreate }}
      />

      <div className="lista-container">
        <table className="lista-table">
          <thead>
            <tr>
              <th>Proveedor</th>
              <th style={{textAlign:'right'}}>Monto Total</th>
              <th style={{textAlign:'right'}}>Pendiente</th>
              <th>Vencimiento</th>
              <th style={{textAlign:'center'}}>Estado</th>
              <th style={{textAlign:'center'}}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPayables.map(p => {
              const isOverdue = p.status === 'pending' && new Date() > new Date(p.dueDate);
              return (
                <tr key={p.id}>
                  <td><span className="lista-name-text">{p.supplier?.name || '—'}</span></td>
                  <td style={{textAlign:'right'}}><span className="lista-number-value">{formatPrice(p.totalAmount)}</span></td>
                  <td style={{textAlign:'right'}}>
                    <span className="lista-number-value" style={{color: p.pendingAmount > 0 ? 'var(--color-warning)' : 'var(--color-success)'}}>
                      {formatPrice(p.pendingAmount)}
                    </span>
                  </td>
                  <td>{new Date(p.dueDate).toLocaleDateString()}</td>
                  <td style={{textAlign:'center'}}>{statusBadge(p.status, p.dueDate)}</td>
                  <td style={{textAlign:'center'}}>
                    <div className="lista-actions" style={{justifyContent:'center'}}>
                      {p.status !== 'paid' && (
                        <button className="lista-action-btn" onClick={() => { setPayingPayable(p); setPayAmount(0); setPayMethod('cash'); setShowPayModal(true); }} title="Abonar">
                          <DollarSign size={14} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
            {filteredPayables.length === 0 && (
              <tr>
                <td colSpan={6} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay cuentas por pagar</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreateModal && (
        <Modal open={showCreateModal} onClose={() => setShowCreateModal(false)} title="Nueva Cuenta por Pagar">
          <div className={styles.modalContent}>
            <form onSubmit={handleCreate} className={styles.form}>
              {error && <div className={styles.error}>{error}</div>}
              <div className={styles.field}>
                <label>Proveedor</label>
                <select value={form.supplierId} onChange={e => setForm(f => ({ ...f, supplierId: e.target.value }))} required>
                  <option value="">Seleccionar proveedor</option>
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className={styles.field}>
                <label>Monto Total ($)</label>
                <input type="number" min="0.01" step="0.01" value={form.totalAmount || ''} onChange={e => setForm(f => ({ ...f, totalAmount: parseFloat(e.target.value) || 0 }))} required placeholder="0.00" />
              </div>
              <div className={styles.field}>
                <label>Fecha de Vencimiento</label>
                <input type="date" value={form.dueDate} onChange={e => setForm(f => ({ ...f, dueDate: e.target.value }))} required />
              </div>
              <div className={styles.field}>
                <label>Notas (opcional)</label>
                <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} rows={3} placeholder="Notas adicionales..." />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowCreateModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Cuenta'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {showPayModal && payingPayable && (
        <Modal open={showPayModal} onClose={() => { setShowPayModal(false); setPayingPayable(null); }} title={`Abonar a ${payingPayable.supplier?.name || 'proveedor'}`}>
          <div className={styles.modalContent}>
            <div className={styles.payInfo}>
              <div className={styles.payRow}>
                <span>Total</span>
                <span className={styles.payValue}>{formatPrice(payingPayable.totalAmount)}</span>
              </div>
              <div className={styles.payRow}>
                <span>Saldo pendiente</span>
                <span className={styles.payValue}>{formatPrice(payingPayable.pendingAmount)}</span>
              </div>
            </div>
            <div className={styles.field}>
              <label>Monto a abonar</label>
              <input type="number" min="0.01" step="0.01" max={payingPayable.pendingAmount} value={payAmount || ''} onChange={e => setPayAmount(parseFloat(e.target.value) || 0)} autoFocus placeholder="Monto a abonar" />
            </div>
            <div className={styles.field}>
              <label>Método de pago</label>
              <select value={payMethod} onChange={e => setPayMethod(e.target.value as any)}>
                <option value="cash">Efectivo</option>
                <option value="card">Tarjeta</option>
                <option value="transfer">Transferencia</option>
              </select>
            </div>
            <div className={styles.modalActions}>
              <button type="button" className={styles.cancelBtn} onClick={() => { setShowPayModal(false); setPayingPayable(null); }}>Cancelar</button>
              <button className={styles.saveBtn} onClick={handlePay} disabled={saving || payAmount <= 0}>
                {saving ? 'Procesando...' : 'Registrar Abono'}
              </button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
