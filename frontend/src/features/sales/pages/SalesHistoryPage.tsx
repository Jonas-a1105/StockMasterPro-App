import { useState, useEffect, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { Modal } from '@shared/ui/Modal';

import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { DataTable } from '@shared/ui/DataTable';
import { Table } from '@shared/ui/Table';
import { Badge } from '@shared/ui/Badge';
import { Button } from '@shared/ui/Button';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { DollarSign, ShoppingCart, Eye, Printer, RotateCcw, XCircle, FileText } from 'lucide-react';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { printTicket } from '@shared/lib/print/ticket';
import { generateFiscalInvoicePdf } from '@shared/lib/print/invoicePdf';

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
        api.getSales({
          search: search || undefined,
          startDate: startDate || undefined,
          endDate: endDate || undefined,
        }),
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

  useEffect(() => {
    loadSales();
  }, []);

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
          invoiceNumber:
            detail.invoiceNumber || sale.invoiceNumber || `${detail.id?.slice(0, 8) || ''}`,
          documentType: detail.documentType || 'factura',
          createdAt: detail.createdAt || sale.createdAt,
          customerName: detail.customer?.name || sale.customer?.name || '',
          customerTaxId: detail.customer?.taxId || sale.customer?.taxId || '',
          customerFiscalAddress:
            detail.customer?.fiscalAddress || sale.customer?.fiscalAddress || '',
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
        companyInfo
      );
    } catch (err: any) {
      showToast('Error al generar factura PDF', 'error');
    }
  };

  const handleVoid = async (sale: any) => {
    if (
      !window.confirm(
        `¿Anular venta #${String(sale.folio || sale.id).slice(0, 8)} por $${Number(sale.total).toFixed(2)}?`
      )
    )
      return;
    try {
      await api.voidSale(sale.id);
      showToast('Venta anulada correctamente', 'success');
      setShowDetail(false);
      loadSales();
    } catch (err: any) {
      showToast(err.message || 'Error al anular venta', 'error');
    }
  };



  const paymentBadgeVariant = (method: string) => {
    const m = method?.toLowerCase();
    if (m === 'efectivo' || m === 'cash') return 'success';
    if (m === 'tarjeta' || m === 'card') return 'info';
    if (m === 'transferencia' || m === 'transfer') return 'warning';
    return 'default';
  };

  const saleColumns = useMemo(
    () => [
      {
        key: 'folio',
        header: '#',
        align: 'left' as const,
        render: (sale: any) => <span className="font-mono text-text-muted">#{String(sale.folio || sale.id).slice(0, 8)}</span>,
      },
      {
        key: 'createdAt',
        header: 'Fecha',
        render: (sale: any) => new Date(sale.createdAt).toLocaleString(),
      },
      {
        key: 'customer',
        header: 'Cliente',
        render: (sale: any) => sale.customer?.name || '—',
      },
      {
        key: 'items',
        header: 'Productos',
        align: 'center' as const,
        render: (sale: any) => sale.items?.length || 0,
      },
      {
        key: 'paymentMethod',
        header: 'Método',
        render: (sale: any) => (
          <Badge variant={paymentBadgeVariant(sale.paymentMethod)}>
            {sale.paymentMethod}
          </Badge>
        ),
      },
      {
        key: 'total',
        header: 'Total',
        align: 'right' as const,
        render: (sale: any) => <span className="font-semibold">{formatPrice(Number(sale.total))}</span>,
      },
      {
        key: 'actions',
        header: '',
        align: 'center' as const,
        render: (sale: any) => (
          <div className="flex items-center justify-center gap-1.5">
            <button onClick={() => openDetail(sale)} title="Ver detalle" className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
              <Eye size={15} />
            </button>
            <button onClick={() => printSaleTicket(sale)} title="Reimprimir" className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
              <Printer size={15} />
            </button>
            <button onClick={() => handleInvoicePdf(sale)} title="Factura PDF" className="p-1.5 rounded-lg hover:bg-bg-hover transition-colors">
              <FileText size={15} />
            </button>
          </div>
        ),
      },
    ],
    []
  );

  const filteredSales = useMemo(
    () => sales.filter((s) => {
      if (search) {
        const term = search.toLowerCase();
        return (
          s.folio?.toLowerCase().includes(term) ||
          s.customer?.name?.toLowerCase().includes(term) ||
          s.items?.some((i: any) => i.product?.name?.toLowerCase().includes(term))
        );
      }
      if (startDate && new Date(s.createdAt) < new Date(startDate)) return false;
      if (endDate && new Date(s.createdAt) > new Date(endDate)) return false;
      return true;
    }),
    [sales, search, startDate, endDate]
  );

  const totalRevenue = filteredSales.reduce((s: number, sale: any) => s + Number(sale.total), 0);

  if (loading && sales.length === 0)
    return <SkeletonTablePage />;

  return (
    <>
      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar por folio, cliente, producto...' }}
      >
        <div className="flex flex-wrap gap-2">
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:border-primary"
          />
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm focus:outline-none focus:border-primary"
          />
          <Button variant="secondary" onClick={loadSales}>Filtrar</Button>
          {(startDate || endDate || search) && (
            <Button variant="secondary" onClick={() => { setSearch(''); setStartDate(''); setEndDate(''); setTimeout(loadSales, 0); }}>
              Limpiar
            </Button>
          )}
        </div>
      </Toolbar>

      <KpiGrid
        kpis={[
          {
            label: 'Ventas del día',
            value: dailySummary?.count ?? '—',
            icon: ShoppingCart,
            color: 'var(--color-primary)',
          },
          {
            label: 'Total del día',
            value: formatPrice(dailySummary?.total ?? 0),
            icon: DollarSign,
            color: 'var(--color-success)',
          },
          {
            label: 'Total listado',
            value: formatPrice(totalRevenue),
            icon: DollarSign,
            color: 'var(--color-warning)',
          },
        ]}
      />

      <DataTable
        data={filteredSales}
        columns={saleColumns}
        keyExtractor={(s) => s.id}
        searchable
        searchPlaceholder="Buscar por folio, cliente, producto..."
        searchKeys={['folio', 'customer?.name']}
        sortable
        emptyMessage="No hay ventas registradas"
        loading={loading}
      />

      <Modal
        open={showDetail}
        onClose={() => {
          setShowDetail(false);
          setSelectedSale(null);
        }}
        title="Detalle de Venta"
        wide
      >
        {selectedSale && (
          <div className="space-y-4">
            <div className="flex justify-between items-start text-md leading-relaxed">
              <div>
                <strong>Fecha:</strong> {new Date(selectedSale.createdAt).toLocaleString()}
                <br />
                <strong>Cliente:</strong> {selectedSale.customer?.name || '—'}
                <br />
                <strong>Método de pago:</strong> {selectedSale.paymentMethod}
              </div>
              <div className="text-right">
                <span className="block text-caption text-text-muted">Total</span>
                <strong className="text-3xl">{formatPrice(Number(selectedSale.total))}</strong>
              </div>
            </div>

            {selectedSale.discount ? (
              <p><strong>Descuento:</strong> {formatPrice(Number(selectedSale.discount))}</p>
            ) : null}
            {selectedSale.taxRate ? (
              <p><strong>IVA:</strong> {Number(selectedSale.taxRate) * 100}%</p>
            ) : null}

            <Table
              data={selectedSale.items || []}
              columns={[
                { key: 'product', header: 'Producto', render: (i: any) => i.product?.name || i.name || 'Producto' },
                { key: 'quantity', header: 'Cant', align: 'center' as const },
                { key: 'price', header: 'Precio', align: 'right' as const, render: (i: any) => formatPrice(Number(i.price)) },
                { key: 'subtotal', header: 'Subtotal', align: 'right' as const, render: (i: any) => formatPrice(Number(i.subtotal || i.total || i.price * i.quantity)) },
              ]}
              keyExtractor={(_, idx) => String(idx)}
              emptyMessage="Sin items"
            />

            <div className="flex gap-3 justify-end pt-4 border-t border-border">
              <Button variant="secondary" onClick={() => printSaleTicket(selectedSale)}>
                <Printer size={15} /> Reimprimir Ticket
              </Button>
              <Button variant="secondary" onClick={() => handleInvoicePdf(selectedSale)}>
                <FileText size={15} /> Factura PDF
              </Button>
              {selectedSale.status !== 'cancelled' && (
                <Button variant="danger" onClick={() => handleVoid(selectedSale)}>
                  <XCircle size={15} /> Anular Venta
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}