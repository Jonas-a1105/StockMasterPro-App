import { useState, useEffect, useCallback } from 'react';
import { TabNav } from '@shared/ui/TabNav';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { getWithholdings, getFiscalBooks } from '../api/fiscal.api';
import styles from '@features/inventory/pages/InventoryPage.module.css';

export function FiscalPage() {
  const { config } = useTheme();
  const [tab, setTab] = useState('retenciones');
  const [withholdings, setWithholdings] = useState<any[]>([]);
  const [books, setBooks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bookType, setBookType] = useState<'ventas' | 'compras'>('ventas');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      if (tab === 'retenciones') {
        setWithholdings(await getWithholdings());
      } else {
        setBooks(await getFiscalBooks(bookType, dateRange.start || undefined, dateRange.end || undefined));
      }
    } catch {} finally { setLoading(false); }
  }, [tab, bookType, dateRange]);

  useEffect(() => { loadData(); }, [loadData]);

  const tabs = [
    { key: 'retenciones', label: 'Retenciones', icon: null },
    { key: 'libros', label: 'Libros Fiscales', icon: null },
  ];

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={8} cols={6} kpi={0} /> : <p style={{ padding: 40, color: 'var(--text-muted)' }}>Cargando...</p>;

  return (
    <div className={styles.container}>
      <h2 style={{ marginBottom: 20 }}>Fiscal Venezuela</h2>
      <TabNav tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {tab === 'retenciones' && (
        <div>
          <div style={{ display: 'flex', gap: 16, margin: '20px 0', alignItems: 'center' }}>
            <h3 style={{ margin: 0 }}>Retenciones Registradas</h3>
          </div>
          <div className="lista-container">
            <table className="lista-table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Proveedor</th>
                  <th>Base</th>
                  <th>Tasa</th>
                  <th>Monto</th>
                  <th>Factura</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {withholdings.map((w: any) => (
                  <tr key={w.id}>
                    <td><span className={styles.badge} style={{ backgroundColor: w.type === 'iva' ? '#dbeafe' : '#fef9c3', color: w.type === 'iva' ? '#2563eb' : '#ca8a04' }}>{w.type === 'iva' ? 'IVA' : 'ISLR'}</span></td>
                    <td>{w.supplier?.name || 'N/A'}</td>
                    <td style={{ textAlign: 'right' }}>${Number(w.baseAmount).toFixed(2)}</td>
                    <td style={{ textAlign: 'center' }}>{Number(w.rate).toFixed(1)}%</td>
                    <td style={{ textAlign: 'right', fontWeight: 600 }}>${Number(w.amount).toFixed(2)}</td>
                    <td>{w.invoiceNumber || '-'}</td>
                    <td>{w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '-'}</td>
                    <td><span className={styles.badge} style={{ backgroundColor: '#dcfce7', color: '#16a34a' }}>{w.status}</span></td>
                  </tr>
                ))}
                {withholdings.length === 0 && (
                  <tr><td colSpan={8} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay retenciones registradas</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'libros' && (
        <div>
          <div style={{ display: 'flex', gap: 16, margin: '20px 0', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13 }}>Tipo:</label>
              <select value={bookType} onChange={e => setBookType(e.target.value as any)} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }}>
                <option value="ventas">Libro de Ventas</option>
                <option value="compras">Libro de Compras</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <label style={{ fontSize: 13 }}>Desde:</label>
              <input type="date" value={dateRange.start} onChange={e => setDateRange(p => ({ ...p, start: e.target.value }))} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }} />
              <label style={{ fontSize: 13 }}>Hasta:</label>
              <input type="date" value={dateRange.end} onChange={e => setDateRange(p => ({ ...p, end: e.target.value }))} style={{ padding: '6px 12px', borderRadius: 6, border: '1px solid var(--border)' }} />
            </div>
            <button className={styles.addBtn} onClick={loadData}>Consultar</button>
          </div>
          <div className="lista-container">
            <table className="lista-table">
              <thead>
                <tr>
                  {bookType === 'ventas' ? (
                    <>
                      <th>Factura</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>RIF/CI</th>
                      <th style={{ textAlign: 'right' }}>Subtotal</th>
                      <th style={{ textAlign: 'right' }}>IVA</th>
                      <th style={{ textAlign: 'right' }}>Dto.</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                    </>
                  ) : (
                    <>
                      <th>Compra</th>
                      <th>Fecha</th>
                      <th>Proveedor</th>
                      <th>RIF</th>
                      <th style={{ textAlign: 'right' }}>Total</th>
                      <th style={{ textAlign: 'right' }}>Ret. IVA</th>
                      <th style={{ textAlign: 'right' }}>Ret. ISLR</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr><td colSpan={bookType === 'ventas' ? 8 : 7} style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay datos en el período seleccionado</td></tr>
                ) : (
                  books.map((r: any, idx: number) => (
                    <tr key={idx}>
                      {bookType === 'ventas' ? (
                        <>
                          <td style={{ fontFamily: 'monospace' }}>{r.invoiceNumber}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.customerName}</td>
                          <td>{r.customerTaxId}</td>
                          <td style={{ textAlign: 'right' }}>${r.subtotal.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>${r.tax.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>${r.discount.toFixed(2)}</td>
                          <td style={{ textAlign: 'right', fontWeight: 600 }}>${r.total.toFixed(2)}</td>
                        </>
                      ) : (
                        <>
                          <td style={{ fontFamily: 'monospace' }}>{r.invoiceNumber}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.supplierName}</td>
                          <td>{r.supplierTaxId}</td>
                          <td style={{ textAlign: 'right' }}>${r.total.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>${r.ivaWithholding.toFixed(2)}</td>
                          <td style={{ textAlign: 'right' }}>${r.islrWithholding.toFixed(2)}</td>
                        </>
                      )}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
