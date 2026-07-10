import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Modal } from '@shared/ui/Modal';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { DollarSign, ShoppingCart, Eye, Printer, RotateCcw, XCircle, FileText } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { printTicket } from '@shared/lib/print/ticket';
import { generateFiscalInvoicePdf } from '@shared/lib/print/invoicePdf';
import { api } from '@shared/lib/http/client';
import styles from './SalesHistoryPage.module.css';

export function SalesHistoryPage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [sales, setSales] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [selectedSale, setSelectedSale] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [dailySummary, setDailySummary] = useState<any>(null);

  const loadSales = async () => {
    setLoading(true);
    try {
      const [s, d] = await Promise.all([
        api.getSales({ search: search || undefined, startDate: startDate || undefined, endDate: endDate || undefined }),
        api.getDailySummary(),
      ]);
      setSales(s || []);
      setDailySummary(d);
    } catch {
      // Silent
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadSales(); }, []);

  const openDetail = async (sale: any) => {
    try {
      const detail = await api.getSale(sale.id);
      setSelectedSale(detail);
    } catch {
      setSelectedSale(sale);
    }
    setShowDetail(true);
  };

  const printSaleTicket = (sale: any) => printTicket(sale);

  const handleInvoicePdf = async (sale: any) => {
    try {
      const [companyInfo, detail, settings] = await Promise.all([
        api.getCompanyInfo(),
        api.getSale(sale.id),
        api.getTenantSettings(),
      ]);

      if (!companyInfo) return;

      const taxRate = settings?.taxRate ?? 16;

      generateFiscalInvoicePdf(
        {
          invoiceNumber: detail.invoiceNumber || sale.invoiceNumber || `${detail.id?.slice(0, 8) || ''}`,
          documentType: detail.documentType || 'factura',
          createdAt: detail.createdAt || sale.createdAt,
          customerName: detail.customer?.name || sale.customer?.name || '',
          customerTaxId: detail.customer?.taxId || sale.customer?.taxId || '',
          customerFiscalAddress: detail.customer?.fiscalAddress || sale.customer?.fiscalAddress || '',
          subtotal: Number(detail.subtotal ?? sale.subtotal ?? 0),
          tax: Number(detail.tax ?? sale.tax ?? 0),
          discount: Number(detail.discount ?? sale.discount ?? 0),
          total: Number(detail.total ?? sale.total ?? 0),
          items: (detail.items || sale.items || []).map((item: any) => ({
            description: item.product?.name || item.name || 'Producto',
            quantity: item.quantity,
            price: Number(item.price),
            total: Number(item.subtotal || item.total || item.price * item.quantity),
          })),
        },
        companyInfo,
      );
    } catch (err: any) {
      showToast('Error al generar factura PDF', 'error');
    }
  };

  const handleVoid = async (sale: any) => {
    if (!window.confirm(`¿Anular venta #${String(sale.folio || sale.id).slice(0, 8)} por $${Number(sale.total).toFixed(2)}?`)) return;
    try {
      await api.voidSale(sale.id);
      showToast('Venta anulada correctamente', 'success');
      setShowDetail(false);
      loadSales();
    } catch (err: any) {
      showToast(err.message || 'Error al anular venta', 'error');
    }
  };

  const totalRevenue = sales.reduce((s: number, sale: any) => s + Number(sale.total), 0);

  if (loading && sales.length === 0) return config.skeletonEnabled ? <SkeletonTablePage /> : <LoadingDots text="Cargando historial de ventas..." />;

  return (
    <>
      <Toolbar search={{ value: search, onChange: setSearch, placeholder: 'Buscar por producto o cliente...' }} />

      <div className={styles.filterBar}>
        <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.dateInput} />
        <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={styles.dateInput} />
        <button className={styles.filterBtn} onClick={loadSales}>Filtrar</button>
        {(startDate || endDate || search) && (
          <button className={styles.clearBtn} onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setTimeout(loadSales, 0); }}>Limpiar</button>
        )}
      </div>

      <KpiGrid
        kpis={[
          { label: 'Ventas del día', value: dailySummary?.count ?? '—', icon: ShoppingCart, color: '#3b82f6' },
          { label: 'Total del día', value: formatPrice(dailySummary?.total ?? 0), icon: DollarSign, color: '#22c55e' },
          { label: 'Total listado', value: formatPrice(totalRevenue), icon: DollarSign, color: '#f59e0b' },
        ]}
      />

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Cliente</th>
              <th>Productos</th>
              <th>Método</th>
              <th>Total</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {sales.length === 0 ? (
              <tr><td colSpan={7} className={styles.emptyRow}>No hay ventas registradas</td></tr>
            ) : sales.map((sale, idx) => (
              <tr key={sale.id}>
                <td className={styles.cellMuted}>#{String(sale.folio || sale.id).slice(0, 8)}</td>
                <td>{new Date(sale.createdAt).toLocaleString()}</td>
                <td>{sale.customer?.name || '—'}</td>
                <td>{sale.items?.length || 0}</td>
                <td><span className={styles.paymentBadge}>{sale.paymentMethod}</span></td>
                <td className={styles.cellTotal}>{formatPrice(Number(sale.total))}</td>
                <td>
                  <div className={styles.rowActions}>
                    <button className={styles.iconBtn} onClick={() => openDetail(sale)} title="Ver detalle"><Eye size={15} /></button>
                    <button className={styles.iconBtn} onClick={() => printSaleTicket(sale)} title="Reimprimir"><Printer size={15} /></button>
                    <button className={styles.iconBtn} onClick={() => handleInvoicePdf(sale)} title="Factura PDF"><FileText size={15} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal open={showDetail} onClose={() => { setShowDetail(false); setSelectedSale(null); }} title="Detalle de Venta" wide>
        {selectedSale && (
          <div className={styles.detail}>
            <div className={styles.detailHeader}>
              <div>
                <strong>Fecha:</strong> {new Date(selectedSale.createdAt).toLocaleString()}<br />
                <strong>Cliente:</strong> {selectedSale.customer?.name || '—'}<br />
                <strong>Método de pago:</strong> {selectedSale.paymentMethod}
              </div>
              <div className={styles.detailTotal}>
                <span>Total</span>
                <strong>{formatPrice(Number(selectedSale.total))}</strong>
              </div>
            </div>

            {selectedSale.discount ? <p><strong>Descuento:</strong> {formatPrice(Number(selectedSale.discount))}</p> : null}
            {selectedSale.taxRate ? <p><strong>IVA:</strong> {Number(selectedSale.taxRate) * 100}%</p> : null}

            <table className={styles.detailTable}>
              <thead>
                <tr><th>Producto</th><th>Cant</th><th>Precio</th><th>Subtotal</th></tr>
              </thead>
              <tbody>
                {(selectedSale.items || []).map((item: any, i: number) => (
                  <tr key={item.id || i}>
                    <td>{item.product?.name || item.name || 'Producto'}</td>
                    <td>{item.quantity}</td>
                    <td>{formatPrice(Number(item.price))}</td>
                    <td>{formatPrice(Number(item.subtotal || item.total || item.price * item.quantity))}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className={styles.detailActions}>
              <button className={styles.printBtn} onClick={() => printSaleTicket(selectedSale)}><Printer size={15} /> Reimprimir Ticket</button>
              <button className={styles.printBtn} onClick={() => handleInvoicePdf(selectedSale)}><FileText size={15} /> Factura PDF</button>
              {selectedSale.status !== 'cancelled' && (
                <button className={styles.voidBtn} onClick={() => handleVoid(selectedSale)}><XCircle size={15} /> Anular Venta</button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
