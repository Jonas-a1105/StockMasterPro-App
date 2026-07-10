import { useState, useEffect, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { formatUsd } from '@shared/lib/format/currency';
import { Search, RefreshCw, RotateCcw, Eye, ArrowLeft, X, Plus, Minus } from 'lucide-react';
import styles from './ReturnsPage.module.css';

const REFUND_METHODS = [
  { value: 'credit', label: 'Crédito en cuenta' },
  { value: 'cash', label: 'Efectivo' },
  { value: 'transfer', label: 'Transferencia' },
] as const;

const methodLabel = (v: string) => REFUND_METHODS.find(m => m.value === v)?.label || v;

export function ReturnsPage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [returnItems, setReturnItems] = useState<Record<string, { quantity: number }>>({});
  const [reason, setReason] = useState('');
  const [refundMethod, setRefundMethod] = useState<'credit' | 'cash' | 'transfer'>('credit');
  const [saving, setSaving] = useState(false);

  useEffect(() => { loadSales(); }, []);

  const loadSales = async () => {
    setLoading(true);
    try {
      const data = await api.getSales(200);
      setSales(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const filteredSales = useMemo(() => sales.filter(s =>
    !search ||
    (s.customer?.name || '').toLowerCase().includes(search.toLowerCase()) ||
    s.id.slice(0, 8).includes(search) ||
    (s.total || 0).toString().includes(search)
  ), [sales, search]);

  const handleQtyChange = (itemId: string, delta: number) => {
    setReturnItems(prev => {
      const current = prev[itemId]?.quantity || 0;
      const maxQty = selectedSale?.items?.find((i: any) => i.id === itemId)?.quantity || 1;
      const next = Math.max(0, Math.min(maxQty, current + delta));
      if (next === 0) {
        const { [itemId]: _, ...rest } = prev;
        return rest;
      }
      return { ...prev, [itemId]: { quantity: next } };
    });
  };

  const createReturn = async () => {
    if (!selectedSale || Object.keys(returnItems).length === 0) return;
    if (!reason.trim()) { showToast('Ingrese un motivo', 'error'); return; }

    const items = Object.entries(returnItems).map(([productId, { quantity }]) => {
      const item = selectedSale.items.find((i: any) => i.id === productId);
      return { productId, quantity, price: Number(item?.price || 0) };
    }).filter(i => i.quantity > 0);

    const total = items.reduce((sum, i) => sum + i.quantity * i.price, 0);

    setSaving(true);
    try {
      await api.createCreditNote({
        saleId: selectedSale.id,
        customerId: selectedSale.customerId,
        reason,
        total,
        refundMethod,
        items,
      });
      showToast('Devolución creada y nota de crédito generada', 'success');
      setSelectedSale(null);
      setReturnItems({});
      setReason('');
      loadSales();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const itemTotal = (item: any) => (returnItems[item.id]?.quantity || 0) * Number(item.price || 0);
  const returnTotal = selectedSale?.items?.reduce((sum: number, i: any) => sum + itemTotal(i), 0) || 0;

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={6} cols={6} kpi={2} /> : <LoadingDots text="Cargando ventas..." />;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2>Devoluciones / RMA</h2>
        <p className={styles.subtitle}>Seleccione una venta para iniciar una devolución</p>
      </div>

      <div className={styles.searchBar}>
        <Search size={18} className={styles.searchIcon} />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Buscar venta por cliente, ID o monto..."
        />
      </div>

      {selectedSale ? (
        <div className={styles.returnForm}>
          <div className={styles.backBtn} onClick={() => { setSelectedSale(null); setReturnItems({}); setReason(''); }}>
            <ArrowLeft size={18} /> Volver a lista de ventas
          </div>

          <div className={styles.saleInfo}>
            <div className={styles.saleRow}><strong>Venta:</strong> #{selectedSale.id.slice(0, 8)}</div>
            <div className={styles.saleRow}><strong>Fecha:</strong> {new Date(selectedSale.createdAt).toLocaleDateString()}</div>
            <div className={styles.saleRow}><strong>Cliente:</strong> {selectedSale.customer?.name || 'Consumidor final'}</div>
            <div className={styles.saleRow}><strong>Total original:</strong> {formatPrice(selectedSale.total)}</div>
          </div>

          <div className={styles.sectionTitle}>Productos a devolver</div>
          <div className={styles.itemsTable}>
            <div className={styles.tableHeader}>
              <span>Producto</span>
              <span>Cant. Vendida</span>
              <span>Precio</span>
              <span>Subtotal</span>
              <span>Devolver</span>
            </div>
            {selectedSale.items?.map((item: any) => {
              const maxQty = item.quantity;
              const returnQty = returnItems[item.id]?.quantity || 0;
              return (
                <div key={item.id} className={styles.tableRow}>
                  <span>{item.product?.name || item.name}</span>
                  <span style={{ textAlign: 'center' }}>{maxQty}</span>
                  <span style={{ textAlign: 'right' }}>{formatPrice(item.price)}</span>
                  <span style={{ textAlign: 'right' }}>{formatPrice(itemTotal(item))}</span>
                  <div className={styles.qtyControls}>
                    <button onClick={() => handleQtyChange(item.id, -1)} disabled={returnQty === 0}><Minus size={16} /></button>
                    <span className={styles.qtyValue}>{returnQty}</span>
                    <button onClick={() => handleQtyChange(item.id, 1)} disabled={returnQty >= maxQty}><Plus size={16} /></button>
                    <span style={{ marginLeft: 8, color: 'var(--text-muted)', fontSize: 12 }}>máx {maxQty}</span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className={styles.totals}>
            <div className={styles.totalRow}><span>Total devolución</span><strong>{formatPrice(returnTotal)}</strong></div>
          </div>

          <div className={styles.formGroup}>
            <label>Motivo de la devolución</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              rows={3}
              placeholder="Ej: Producto defectuoso, talla incorrecta, cambio de opinión..."
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label>Método de reembolso</label>
            <select value={refundMethod} onChange={e => setRefundMethod(e.target.value as any)}>
              {REFUND_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>

          <div className={styles.actions}>
            <button className={styles.cancelBtn} onClick={() => { setSelectedSale(null); setReturnItems({}); setReason(''); }}>
              <X size={16} /> Cancelar
            </button>
            <button className={styles.createBtn} onClick={createReturn} disabled={saving || Object.keys(returnItems).length === 0}>
              <RotateCcw size={16} /> {saving ? 'Creando...' : 'Crear devolución'}
            </button>
          </div>
        </div>
      ) : (
        <div className={styles.salesTable}>
          <table className="lista-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Productos</th>
                <th style={{textAlign:'right'}}>Total</th>
                <th style={{textAlign:'center'}}>Método</th>
                <th style={{textAlign:'center'}}>Estado</th>
                <th style={{textAlign:'center'}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map(s => (
                <tr key={s.id} onClick={() => { setSelectedSale(s); setReturnItems({}); setReason(''); }}>
                  <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                  <td><span className="lista-name-text">{s.customer?.name || 'Consumidor final'}</span></td>
                  <td>{s.items?.length || 0} art.</td>
                  <td style={{textAlign:'right'}}><span className="lista-number-value">{formatPrice(s.total)}</span></td>
                  <td>{s.paymentMethod}</td>
                  <td style={{textAlign:'center'}}><span className={`lista-badge ${s.status === 'completed' ? 'active' : 'inactive'}`}>{s.status === 'completed' ? 'Completada' : s.status}</span></td>
                  <td style={{textAlign:'center'}}><button className="lista-action-btn" onClick={e => { e.stopPropagation(); setSelectedSale(s); setReturnItems({}); setReason(''); }} title="Iniciar devolución"><RotateCcw size={14} /></button></td>
                </tr>
              ))}
              {filteredSales.length === 0 && <tr><td colSpan={7} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay ventas registradas</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}