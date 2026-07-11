import { useState, useEffect, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { AlertTriangle, Package, Download, RefreshCw, FileText, X } from 'lucide-react';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import { exportToPdf } from '@shared/lib/print/pdfHelper';
import { useToast } from '@contexts/ToastContext';
import { formatPrice } from '@shared/lib/format/currency';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import styles from './DeadProductsPage.module.css';

export function DeadProductsPage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(90);
  const [search, setSearch] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await api.get<{ productId: string; name: string; barcode: string; stock: number; lastSaleDate: string | null; daysSinceSale: number; category: string }[]>(`/reports/dead-products?days=${days}`);
      setProducts(data || []);
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [days]);

  useEffect(() => { load(); }, [load]);

  const filtered = useMemo(() => products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())), [products, search]);

  const handleExportExcel = () => {
    const columns: ColumnMapping[] = [
      { header: 'Producto', key: 'name', type: 'string' },
      { header: 'Código', key: 'barcode', type: 'string' },
      { header: 'Categoría', key: 'category', type: 'string' },
      { header: 'Stock', key: 'stock', type: 'number' },
      { header: 'Días sin venta', key: 'daysSinceSale', type: 'number' },
      { header: 'Última venta', key: 'lastSaleDate', type: 'date' },
      { header: 'Categoría', key: 'category', type: 'string' },
    ];
    exportToExcel(products, columns, 'productos-muertos', 'xlsx');
    showToast('Exportado a Excel', 'success');
  };

  const handleExportPdf = () => {
    const columns = [
      { header: 'Producto', key: 'name', type: 'string' },
      { header: 'Código', key: 'barcode', type: 'string' },
      { header: 'Días sin venta', key: 'daysSinceSale', type: 'number' },
      { header: 'Stock', key: 'stock', type: 'number' },
    ];
    const rows = products.map(p => ({
      name: p.name,
      barcode: p.barcode || '—',
      daysSinceSale: p.daysSinceSale,
      stock: p.stock,
    }));
    exportToPdf(rows, columns, 'Productos Muertos', 'productos-muertos');
    showToast('Exportado a PDF', 'success');
  };

  if (loading) return config.skeletonEnabled ? <SkeletonTablePage rows={8} cols={6} kpi={0} /> : <div style={{padding:40,textAlign:'center',color:'var(--text-muted)'}}>Cargando...</div>;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h2 className={styles.title}>
          <AlertTriangle size={24} />
          Productos Muertos (Sin movimiento)
        </h2>
        <div className={styles.controls}>
          <div className={styles.filterGroup}>
            <label>Días sin venta:</label>
            <select value={days} onChange={e => setDays(Number(e.target.value))} className={styles.select}>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90} selected>90 días</option>
              <option value={180}>180 días</option>
              <option value={365}>365 días</option>
            </select>
          </div>
          <div className={styles.searchBox}>
            <input
              type="text"
              placeholder="Buscar por nombre, código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <div className={styles.actions}>
            <button className={styles.btnSecondary} onClick={handleExportPdf}><FileText size={16} /> PDF</button>
            <button className={styles.btnPrimary} onClick={handleExportExcel}><Download size={16} /> Excel</button>
            <button className={styles.btnSecondary} onClick={load}><RefreshCw size={16} /> Actualizar</button>
          </div>
        </div>
      </div>

      <div className={styles.stats}>
        <div className={styles.stat}><span className={styles.statValue}>{products.length}</span><span className={styles.statLabel}>Productos muertos</span></div>
        <div className={styles.stat}><span className={styles.statValue}>{products.filter(p => p.stock > 0).length}</span><span className={styles.statLabel}>Con stock > 0</span></div>
        <div className={styles.stat}><span className={styles.statValue} style={{color:'var(--color-red)'}}>{products.filter(p => p.stock <= 0).length}</span><span className={styles.statLabel}>Sin stock</span></div>
      </div>

      <div className={styles.tableContainer}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th>Producto</th>
              <th>Código</th>
              <th style={{textAlign:'center'}}>Días sin venta</th>
              <th style={{textAlign:'right'}}>Stock</th>
              <th>Última venta</th>
              <th>Categoría</th>
            </tr>
          </thead>
          <tbody>
            {products.length === 0 ? (
              <tr><td colSpan={6} className={styles.empty}>No hay productos muertos con los criterios actuales</td></tr>
            ) : (
              products.map(p => (
                <tr key={p.productId}>
                  <td><span className={styles.productName}>{p.name}</span></td>
                  <td><span className={styles.barcode}>{p.barcode || '—'}</span></td>
                  <td style={{textAlign:'center'}}><span className={styles.daysBadge}>{p.daysSinceSale}</span></td>
                  <td style={{textAlign:'right'}}><span className={p.stock <= 0 ? styles.stockZero : styles.stockOk}>{p.stock}</span></td>
                  <td>{p.lastSaleDate ? new Date(p.lastSaleDate).toLocaleDateString() : '—'}</td>
                  <td>{p.category || '—'}</td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}