import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { Modal } from '@shared/ui/Modal';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { TabNav } from '@shared/ui/TabNav';
import { Toolbar } from '@shared/ui/Toolbar';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { Trash2, TrendingDown, Receipt, Tag } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { ImportModal } from '@shared/ui/ImportModal';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import styles from './ExpensesPage.module.css';

const EXPENSE_COLUMNS: ColumnMapping[] = [
  { header: 'Descripción', key: 'description', type: 'string' },
  { header: 'Monto', key: 'amount', type: 'number' },
  { header: 'Categoría', key: 'category', type: 'string' },
  { header: 'Método Pago', key: 'paymentMethod', type: 'string' },
  { header: 'Fecha', key: 'expenseDate', type: 'string' },
  { header: 'Notas', key: 'notes', type: 'string' },
];

const CATEGORIES = [
  { value: 'rent', label: 'Alquiler' },
  { value: 'utilities', label: 'Servicios (Luz, Agua, Internet)' },
  { value: 'salaries', label: 'Sueldos' },
  { value: 'supplies', label: 'Útiles / Limpieza' },
  { value: 'maintenance', label: 'Mantenimiento' },
  { value: 'transport', label: 'Transporte' },
  { value: 'marketing', label: 'Publicidad' },
  { value: 'food', label: 'Alimentación' },
  { value: 'other', label: 'Otros' },
];

const PAYMENT_METHODS = [
  { value: 'cash', label: 'Efectivo' },
  { value: 'card', label: 'Tarjeta' },
  { value: 'transfer', label: 'Transferencia' },
];

interface Expense {
  id: string;
  description: string;
  amount: number;
  category: string;
  paymentMethod: string;
  notes: string | null;
  expenseDate: string;
  registeredBy: string;
}

export function ExpensesPage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [form, setForm] = useState({ description: '', amount: 0, category: 'other', paymentMethod: 'cash', expenseDate: '', notes: '' });
  const [saving, setSaving] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [search, setSearch] = useState('');

  const loadExpenses = async () => {
    try {
      const params: any = {};
      if (categoryFilter) params.category = categoryFilter;
      if (dateRange.start) params.startDate = dateRange.start;
      if (dateRange.end) params.endDate = dateRange.end;
      const data = await api.getExpenses(Object.keys(params).length ? params : undefined);
      setExpenses(data);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadExpenses(); }, [categoryFilter, dateRange.start, dateRange.end]);

  const handleExportExpenses = () => {
    exportToExcel(expenses, EXPENSE_COLUMNS, 'gastos', 'xlsx');
    showToast('Lista de gastos exportada correctamente', 'success');
  };

  const handleImportExpenses = async (
    data: any[],
    onProgress: (current: number, total: number) => void
  ) => {
    let successCount = 0;
    let errorCount = 0;
    const details: string[] = [];

    const mapCategory = (val: string) => {
      if (!val) return 'other';
      const clean = val.trim().toLowerCase();
      const found = CATEGORIES.find(c => c.label.toLowerCase() === clean || c.value.toLowerCase() === clean);
      return found ? found.value : 'other';
    };

    const mapPaymentMethod = (val: string) => {
      if (!val) return 'cash';
      const clean = val.trim().toLowerCase();
      const found = PAYMENT_METHODS.find(p => p.label.toLowerCase() === clean || p.value.toLowerCase() === clean);
      return found ? found.value : 'cash';
    };

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.description) throw new Error('La descripción es obligatoria.');
        if (!row.amount || isNaN(Number(row.amount))) throw new Error('El monto debe ser un número válido.');

        const payload = {
          description: row.description,
          amount: Number(row.amount),
          category: mapCategory(row.category),
          paymentMethod: mapPaymentMethod(row.paymentMethod),
          expenseDate: row.expenseDate ? new Date(row.expenseDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          notes: row.notes || '',
        };

        await api.createExpense(payload);
        details.push(`Registrado: ${row.description} - ${row.amount}`);
        successCount++;
      } catch (err: any) {
        errorCount++;
        details.push(`Error fila ${i + 1} (${row.description || 'Sin Descripción'}): ${err.message}`);
      }
      onProgress(i + 1, data.length);
    }
    await loadExpenses();
    return { successCount, errorCount, details };
  };

  const openCreateModal = () => {
    setForm({ description: '', amount: 0, category: 'other', paymentMethod: 'cash', expenseDate: '', notes: '' });
    setShowModal(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createExpense(form);
      setShowModal(false);
      showToast('Gasto registrado correctamente', 'success');
      loadExpenses();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Estás seguro de eliminar este gasto?')) return;
    try {
      await api.deleteExpense(id);
      showToast('Gasto eliminado correctamente', 'success');
      loadExpenses();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const categoryLabel = (value: string) => CATEGORIES.find(c => c.value === value)?.label || value;

  const paymentLabel = (value: string) => PAYMENT_METHODS.find(p => p.value === value)?.label || value;

  const filteredExpenses = expenses.filter(e =>
    (!search || e.description.toLowerCase().includes(search.toLowerCase()) || (e.category || '').toLowerCase().includes(search.toLowerCase())) &&
    (categoryFilter === '' || e.category === categoryFilter) &&
    (!dateRange.start || new Date(e.expenseDate) >= new Date(dateRange.start)) &&
    (!dateRange.end || new Date(e.expenseDate) <= new Date(dateRange.end))
  );

  const totalExpenses = filteredExpenses.reduce((sum, e) => sum + e.amount, 0);
  const expenseCount = filteredExpenses.length;

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={8} cols={6} kpi={3} /> : <LoadingDots text="Cargando gastos" />;

  return (
    <div className={styles.container}>
      <TabNav tabs={[{ key: 'main', label: 'Gastos', icon: <TrendingDown size={16} /> }]} activeTab="main" onTabChange={() => {}} />
      <KpiGrid
        items={[
          { icon: <Receipt size={18} />, value: expenseCount, label: 'Gastos Filtrados', color: 'var(--color-blue)' },
          { icon: <TrendingDown size={18} />, value: formatPrice(totalExpenses), label: 'Total Filtrado', color: 'var(--color-red)' },
          { icon: <Tag size={18} />, value: expenses.length, label: 'Total Gastos', color: 'var(--color-purple)' },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar gastos...' }}
        searchExtra={
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className={`${styles.filterSelect} global-search-select`}
          >
            <option value="">Todas las categorías</option>
            {[...new Set(expenses.map(e => e.category).filter(Boolean))].map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        }
        onExport={handleExportExpenses}
        onImport={() => setShowImport(true)}
        addBtn={{ label: 'Nuevo Gasto', onClick: openCreateModal }}
      >
        <div className={styles.flexRowWrapCenter}>
          <span className={`${styles.fontSize12} ${styles.colorMuted} ${styles.fontWeight600}`}>Desde:</span>
          <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} className={styles.dateInput} />
          <span className={`${styles.fontSize12} ${styles.colorMuted} ${styles.fontWeight600}`}>Hasta:</span>
          <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} className={styles.dateInput} />
          {(categoryFilter || dateRange.start || dateRange.end) && (
            <button onClick={() => { setCategoryFilter(''); setDateRange({ start: '', end: '' }); }} className={styles.clearFiltersBtn}>
              Limpiar filtros
            </button>
          )}
        </div>
      </Toolbar>

      <div className="lista-container">
        <table className="lista-table">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Descripción</th>
              <th>Categoría</th>
              <th className={styles.textRight}>Monto</th>
              <th>Método Pago</th>
              <th className={styles.textCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredExpenses.map(e => (
              <tr key={e.id}>
                <td>{new Date(e.expenseDate).toLocaleDateString()}</td>
                <td className={styles.colorMuted}>{e.description}</td>
                <td><span className="lista-badge warning">{categoryLabel(e.category)}</span></td>
                <td className={styles.textRight}><span className="lista-number-value">{formatPrice(Number(e.amount))}</span></td>
                <td>{paymentLabel(e.paymentMethod)}</td>
                <td className={styles.textCenter}>
                  <div className={`lista-actions ${styles.justifyCenter}`}>
                    <button className="lista-action-btn danger" onClick={() => handleDelete(e.id)} title="Eliminar">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredExpenses.length === 0 && (
              <tr>
                <td colSpan={6} className={`${styles.textCenter} ${styles.p40} ${styles.colorMuted}`}>No hay gastos registrados</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <Modal open={showModal} onClose={() => setShowModal(false)} title="Registrar Gasto">
          <div className={styles.modalContent}>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.field}>
                <label>Descripción</label>
                <input
                  type="text"
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                  required
                  placeholder="Ej: Compra de útiles de oficina"
                />
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Monto ($)</label>
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={form.amount || ''}
                    onChange={e => setForm(f => ({ ...f, amount: parseFloat(e.target.value) || 0 }))}
                    required
                    placeholder="0.00"
                  />
                </div>
                <div className={styles.field}>
                  <label>Fecha</label>
                  <input
                    type="date"
                    value={form.expenseDate}
                    onChange={e => setForm(f => ({ ...f, expenseDate: e.target.value }))}
                    required
                  />
                </div>
              </div>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Categoría</label>
                  <select value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))}>
                    {CATEGORIES.map(c => (
                      <option key={c.value} value={c.value}>{c.label}</option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Método de Pago</label>
                  <select value={form.paymentMethod} onChange={e => setForm(f => ({ ...f, paymentMethod: e.target.value }))}>
                    {PAYMENT_METHODS.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div className={styles.field}>
                <label>Notas (opcional)</label>
                <textarea
                  value={form.notes}
                  onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  rows={3}
                  placeholder="Notas adicionales..."
                />
              </div>
              <div className={styles.modalActions}>
                <button type="button" className={styles.cancelBtn} onClick={() => setShowModal(false)}>Cancelar</button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Guardando...' : 'Registrar Gasto'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Gastos"
        columns={EXPENSE_COLUMNS}
        templateFilename="plantilla_gastos"
        onImport={handleImportExpenses}
      />
    </div>
  );
}
