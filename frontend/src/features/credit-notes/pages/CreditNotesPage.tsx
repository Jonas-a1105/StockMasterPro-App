import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';

import { TabNav } from '@shared/ui/TabNav';
import { Modal } from '@shared/ui/Modal';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { Plus, Eye, Users, DollarSign, RefreshCw } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { formatUsd } from '@shared/lib/format/currency';
import { KpiGrid } from '@shared/ui';
import { Toolbar } from '@shared/ui';
import styles from './CreditNotesPage.module.css';
import tableStyles from '@shared/ui/TableList/TableList.module.css';

const REFUND_METHODS = [
  { value: 'credit', label: 'Crédito' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
];

const methodLabel = (v: string) => REFUND_METHODS.find((m) => m.value === v)?.label || v;

export function CreditNotesPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('credit-notes');
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [notes, setNotes] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [viewNote, setViewNote] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    saleId: '',
    customerId: '',
    reason: '',
    total: 0,
    refundMethod: 'credit',
    items: [{ productId: '', quantity: 1, price: 0 }],
  });

  const loadData = async () => {
    try {
      const [n, c, p] = await Promise.all([
        api.getCreditNotes(),
        api.getCustomers(),
        api.getProducts(),
      ]);
      setNotes(n);
      setCustomers(c);
      setProducts(p);
    } catch {
      // Silently fail
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredNotes = notes.filter(
    (n) =>
      !search ||
      (n.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.reason || '').toLowerCase().includes(search.toLowerCase()) ||
      (n.id || '').includes(search)
  );

  const totalNotes = notes.length;
  const totalRefunded = notes.reduce((sum, n) => sum + (n.total || 0), 0);
  const pendingCount = notes.filter((n) => n.status === 'pending').length;

  const handleItemChange = (index: number, field: string, value: any) => {
    const items = [...form.items];
    items[index] = { ...items[index], [field]: value };
    if (field === 'productId') {
      const prod = products.find((p) => p.id === value);
      if (prod) items[index].price = Number(prod.price);
    }
    const total = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0);
    setForm((f) => ({ ...f, items, total }));
  };

  const addItem = () => {
    setForm((f) => ({ ...f, items: [...f.items, { productId: '', quantity: 1, price: 0 }] }));
  };

  const removeItem = (index: number) => {
    if (form.items.length <= 1) return;
    const items = form.items.filter((_, i) => i !== index);
    const total = items.reduce((sum, it) => sum + (it.price || 0) * (it.quantity || 0), 0);
    setForm((f) => ({ ...f, items, total }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.createCreditNote({
        ...form,
        saleId: form.saleId || undefined,
        customerId: form.customerId || undefined,
      });
      setShowCreate(false);
      showToast('Nota de crédito creada correctamente', 'success');
      loadData();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <SkeletonTablePage rows={6} cols={7} kpi={3} />;

  return (
    <div className={styles.container}>
      <TabNav
        tabs={[{ key: 'credit-notes', label: 'Notas de Crédito', icon: <RefreshCw size={16} /> }]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <KpiGrid
        items={[
          { icon: <RefreshCw size={18} />, value: totalNotes, label: 'Total Notas' },
          {
            icon: <DollarSign size={18} />,
            value: formatPrice(totalRefunded),
            label: 'Total Reembolsado',
            color: 'var(--color-danger)',
          },
          {
            icon: <Users size={18} />,
            value: pendingCount,
            label: 'Pendientes',
            color: pendingCount > 0 ? 'var(--color-warning)' : 'var(--color-success)',
          },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar notas de crédito...' }}
        addBtn={{
          label: 'Nueva Devolución',
          onClick: () => {
            setShowCreate(true);
            setForm({
              saleId: '',
              customerId: '',
              reason: '',
              total: 0,
              refundMethod: 'cash',
              items: [],
            });
          },
        }}
      />

      <div className={tableStyles.container}>
        <table className={tableStyles.table}>
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Motivo</th>
              <th className={styles.textRight}>Total</th>
              <th>Método</th>
              <th className={styles.textCenter}>Estado</th>
              <th className={styles.textCenter}>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredNotes.map((n) => (
              <tr key={n.id}>
                <td>{new Date(n.createdAt).toLocaleDateString()}</td>
                <td>
                  <span className={tableStyles.nameText}>{n.customer?.name || '—'}</span>
                </td>
                <td className={styles.textMuted}>{n.reason}</td>
                <td className={styles.textRight}>
                  <span className={tableStyles.numberValue}>{formatPrice(Number(n.total))}</span>
                </td>
                <td>{methodLabel(n.refundMethod)}</td>
                <td className={styles.textCenter}>
                  <span
                    className={`${tableStyles.badge} ${n.status === 'active' ? tableStyles.badgeActive : tableStyles.badgeInactive}`}
                  >
                    {n.status === 'active' ? 'Activa' : 'Anulada'}
                  </span>
                </td>
                <td className={styles.textCenter}>
                  <div className={`${tableStyles.actions} ${styles.flexCenter}`}>
                    <button
                      className={tableStyles.actionBtn}
                      onClick={() => setViewNote(n)}
                      title="Ver detalle"
                    >
                      <Eye size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {filteredNotes.length === 0 && (
              <tr>
                <td colSpan={7} className={styles.emptyCell}>
                  No hay notas de crédito registradas
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showCreate && (
        <Modal open={showCreate} onClose={() => setShowCreate(false)} title="Nueva Devolución" wide>
          <div className={styles.modalContent}>
            <form onSubmit={handleCreate} className={styles.form}>
              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Venta ID (opcional)</label>
                  <input
                    type="text"
                    value={form.saleId}
                    onChange={(e) => setForm((f) => ({ ...f, saleId: e.target.value }))}
                    placeholder="ID de la venta"
                  />
                </div>
                <div className={styles.field}>
                  <label>Cliente</label>
                  <select
                    value={form.customerId}
                    onChange={(e) => setForm((f) => ({ ...f, customerId: e.target.value }))}
                  >
                    <option value="">Sin cliente</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className={styles.fieldRow}>
                <div className={styles.field}>
                  <label>Método de Reembolso</label>
                  <select
                    value={form.refundMethod}
                    onChange={(e) => setForm((f) => ({ ...f, refundMethod: e.target.value }))}
                  >
                    {REFUND_METHODS.map((m) => (
                      <option key={m.value} value={m.value}>
                        {m.label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className={styles.field}>
                  <label>Total</label>
                  <input
                    type="number"
                    value={formatUsd(form.total)}
                    readOnly
                    className={styles.totalField}
                  />
                </div>
              </div>

              <div className={styles.field}>
                <label>Motivo de la devolución</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  required
                  rows={3}
                  placeholder="Ej: Producto defectuoso, cambio de talla..."
                />
              </div>

              <div className={styles.itemsSection}>
                <div className={styles.itemsHeader}>
                  <label>Productos devueltos</label>
                  <button type="button" className={styles.addItemBtn} onClick={addItem}>
                    <Plus size={14} /> Agregar producto
                  </button>
                </div>
                {form.items.map((item, idx) => (
                  <div key={idx} className={styles.itemRow}>
                    <select
                      value={item.productId}
                      onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                      required
                    >
                      <option value="">Seleccionar producto</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — {formatPrice(Number(p.price))}
                        </option>
                      ))}
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        handleItemChange(idx, 'quantity', parseInt(e.target.value) || 0)
                      }
                      className={styles.qtyInput}
                      required
                    />
                    <input
                      type="number"
                      step="0.01"
                      value={item.price}
                      onChange={(e) =>
                        handleItemChange(idx, 'price', parseFloat(e.target.value) || 0)
                      }
                      className={styles.priceInput}
                      required
                    />
                    <span className={styles.itemSubtotal}>
                      {formatPrice(item.price * item.quantity)}
                    </span>
                    <button
                      type="button"
                      className={styles.removeBtn}
                      onClick={() => removeItem(idx)}
                      disabled={form.items.length <= 1}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>

              <div className={styles.modalActions}>
                <button
                  type="button"
                  className={styles.cancelBtn}
                  onClick={() => setShowCreate(false)}
                >
                  Cancelar
                </button>
                <button type="submit" className={styles.saveBtn} disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear Nota de Crédito'}
                </button>
              </div>
            </form>
          </div>
        </Modal>
      )}

      {viewNote && (
        <Modal
          open={!!viewNote}
          onClose={() => setViewNote(null)}
          title="Detalle de Nota de Crédito"
        >
          <div className={styles.modalContent}>
            <div className={styles.detailGrid}>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Fecha</span>
                <span>{new Date(viewNote.createdAt).toLocaleString()}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Cliente</span>
                <span>{viewNote.customer?.name || '—'}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Motivo</span>
                <span>{viewNote.reason}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Total</span>
                <span className={styles.amountCell}>{formatPrice(Number(viewNote.total))}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Método</span>
                <span>{methodLabel(viewNote.refundMethod)}</span>
              </div>
              <div className={styles.detailField}>
                <span className={styles.detailLabel}>Estado</span>
                <span
                  className={`${styles.statusBadge} ${viewNote.status === 'active' ? styles.active : styles.voided}`}
                >
                  {viewNote.status === 'active' ? 'Activa' : 'Anulada'}
                </span>
              </div>
            </div>

            <div className={tableStyles.container}>
              <h4 className={styles.sectionTitle}>Productos</h4>
              <table className={tableStyles.table}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.textRight}>Cant.</th>
                    <th className={styles.textRight}>Precio</th>
                    <th className={styles.textRight}>Subtotal</th>
                  </tr>
                </thead>
                <tbody>
                  {viewNote.items?.map((it: any) => (
                    <tr key={it.id}>
                      <td>{it.product?.name || it.productId}</td>
                      <td className={styles.textRight}>
                        <span className={tableStyles.numberValue}>{it.quantity}</span>
                      </td>
                      <td className={styles.textRight}>
                        <span className={tableStyles.numberValue}>
                          {formatPrice(Number(it.price))}
                        </span>
                      </td>
                      <td className={styles.textRight}>
                        <span className={tableStyles.numberValue}>
                          {formatPrice(Number(it.subtotal))}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
