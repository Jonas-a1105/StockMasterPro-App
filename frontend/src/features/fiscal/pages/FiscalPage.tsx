import { useState, useEffect, useCallback } from 'react';
import { TabNav } from '@shared/ui/TabNav';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { getWithholdings, getFiscalBooks } from '../api/fiscal.api';
import styles from '@features/inventory/pages/InventoryPage.module.css';
import tableStyles from '@shared/ui/TableList.module.css';

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
        setBooks(
          await getFiscalBooks(bookType, dateRange.start || undefined, dateRange.end || undefined)
        );
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [tab, bookType, dateRange]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const tabs = [
    { key: 'retenciones', label: 'Retenciones', icon: null },
    { key: 'libros', label: 'Libros Fiscales', icon: null },
  ];

  if (loading)
    return <SkeletonTablePage rows={8} cols={6} kpi={0} />;

  return (
    <div className={styles.container}>
      <h2 className={`${styles.sectionTitle} ${styles.mb20}`}>Fiscal Venezuela</h2>
      <TabNav tabs={tabs} activeTab={tab} onTabChange={setTab} />

      {tab === 'retenciones' && (
        <div>
          <div
            className={`${styles.headerFlex} ${styles.flexCenter} ${styles.gap16} ${styles.mb20}`}
          >
            <h3 className={styles.sectionTitle}>Retenciones Registradas</h3>
          </div>
          <div className={tableStyles.container}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Proveedor</th>
                  <th className={styles.textRight}>Base</th>
                  <th className={styles.textCenter}>Tasa</th>
                  <th className={styles.textRight}>Monto</th>
                  <th>Factura</th>
                  <th>Fecha</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {withholdings.map((w: any) => (
                  <tr key={w.id}>
                    <td>
                      <span
                        className={`${styles.badge} ${w.type === 'iva' ? styles.bgBlueLight : styles.bgYellowLight} ${w.type === 'iva' ? styles.colorBlue : styles.colorYellow}`}
                      >
                        {w.type === 'iva' ? 'IVA' : 'ISLR'}
                      </span>
                    </td>
                    <td>{w.supplier?.name || 'N/A'}</td>
                    <td className={styles.textRight}>${Number(w.baseAmount).toFixed(2)}</td>
                    <td className={styles.textCenter}>{Number(w.rate).toFixed(1)}%</td>
                    <td className={`${styles.textRight} ${styles.fontWeight600}`}>
                      ${Number(w.amount).toFixed(2)}
                    </td>
                    <td>{w.invoiceNumber || '-'}</td>
                    <td>{w.createdAt ? new Date(w.createdAt).toLocaleDateString() : '-'}</td>
                    <td>
                      <span
                        className={`${styles.badge} ${styles.bgGreenLight} ${styles.colorGreen}`}
                      >
                        {w.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {withholdings.length === 0 && (
                  <tr>
                    <td colSpan={8} className={styles.emptyRow}>
                      No hay retenciones registradas
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {tab === 'libros' && (
        <div>
          <div
            className={`${styles.headerFlex} ${styles.flexCenter} ${styles.gap16} ${styles.mb20} ${styles.flexWrap}`}
          >
            <div className={`${styles.flexCenter} ${styles.gap8} ${styles.flexWrap}`}>
              <label className={styles.formLabel}>Tipo:</label>
              <select
                value={bookType}
                onChange={(e) => setBookType(e.target.value as any)}
                className={styles.formSelect}
              >
                <option value="ventas">Libro de Ventas</option>
                <option value="compras">Libro de Compras</option>
              </select>
            </div>
            <div className={`${styles.flexCenter} ${styles.gap8} ${styles.flexWrap}`}>
              <label className={styles.formLabel}>Desde:</label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange((p) => ({ ...p, start: e.target.value }))}
                className={styles.formInput}
              />
              <label className={styles.formLabel}>Hasta:</label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange((p) => ({ ...p, end: e.target.value }))}
                className={styles.formInput}
              />
            </div>
            <button className={styles.addBtn} onClick={loadData}>
              Consultar
            </button>
          </div>
          <div className={tableStyles.container}>
            <table className={tableStyles.table}>
              <thead>
                <tr>
                  {bookType === 'ventas' ? (
                    <>
                      <th>Factura</th>
                      <th>Fecha</th>
                      <th>Cliente</th>
                      <th>RIF/CI</th>
                      <th className={styles.textRight}>Subtotal</th>
                      <th className={styles.textRight}>IVA</th>
                      <th className={styles.textRight}>Dto.</th>
                      <th className={styles.textRight}>Total</th>
                    </>
                  ) : (
                    <>
                      <th>Compra</th>
                      <th>Fecha</th>
                      <th>Proveedor</th>
                      <th>RIF</th>
                      <th className={styles.textRight}>Total</th>
                      <th className={styles.textRight}>Ret. IVA</th>
                      <th className={styles.textRight}>Ret. ISLR</th>
                    </>
                  )}
                </tr>
              </thead>
              <tbody>
                {books.length === 0 ? (
                  <tr>
                    <td colSpan={bookType === 'ventas' ? 8 : 7} className={styles.emptyRow}>
                      No hay datos en el período seleccionado
                    </td>
                  </tr>
                ) : (
                  books.map((r: any, idx: number) => (
                    <tr key={idx}>
                      {bookType === 'ventas' ? (
                        <>
                          <td className={styles.mono}>{r.invoiceNumber}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.customerName}</td>
                          <td>{r.customerTaxId}</td>
                          <td className={styles.textRight}>${r.subtotal.toFixed(2)}</td>
                          <td className={styles.textRight}>${r.tax.toFixed(2)}</td>
                          <td className={styles.textRight}>${r.discount.toFixed(2)}</td>
                          <td className={`${styles.textRight} ${styles.bold}`}>
                            ${r.total.toFixed(2)}
                          </td>
                        </>
                      ) : (
                        <>
                          <td className={styles.mono}>{r.invoiceNumber}</td>
                          <td>{new Date(r.date).toLocaleDateString()}</td>
                          <td>{r.supplierName}</td>
                          <td>{r.supplierTaxId}</td>
                          <td className={styles.textRight}>${r.total.toFixed(2)}</td>
                          <td className={styles.textRight}>${r.ivaWithholding.toFixed(2)}</td>
                          <td className={styles.textRight}>${r.islrWithholding.toFixed(2)}</td>
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
