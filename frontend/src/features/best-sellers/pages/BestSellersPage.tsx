import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { TabNav } from '@shared/ui/TabNav';
import { TrendingUp, PackageX, DollarSign, ShoppingCart, TrendingDown, Filter, Eye, Download } from 'lucide-react';
import { useTheme } from '@contexts/ThemeContext';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { exportToExcel } from '@shared/lib/excelHelper';
import styles from './BestSellersPage.module.css';
function formatDate(d: string | null) {
  if (!d) return '\u2014';
  return new Date(d).toLocaleDateString('es-MX', { year: 'numeric', month: 'short', day: 'numeric' });
}

export function BestSellersPage() {
  const { showToast } = useToast();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [tab, setTab] = useState<'best' | 'dead'>('best');
  const [loading, setLoading] = useState(true);
  const [bestSellers, setBestSellers] = useState<any[]>([]);
  const [deadProducts, setDeadProducts] = useState<any[]>([]);
  const [bestLimit, setBestLimit] = useState(10);
  const [deadDays, setDeadDays] = useState(90);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (tab === 'best') loadBestSellers();
    else loadDeadProducts();
  }, [tab, bestLimit, deadDays]);

  async function loadBestSellers() {
    setLoading(true);
    try {
      const data = await api.getBestSellers({ limit: bestLimit, startDate: startDate || undefined, endDate: endDate || undefined });
      setBestSellers(data);
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  async function loadDeadProducts() {
    setLoading(true);
    try {
      const data = await api.getDeadProducts({ days: deadDays });
      setDeadProducts(data);
    } catch (err: any) { showToast(err.message, 'error'); }
    finally { setLoading(false); }
  }

  function applyFilters() {
    if (tab === 'best') loadBestSellers();
    else loadDeadProducts();
  }

  const filteredBest = bestSellers.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredDead = deadProducts.filter(p =>
    !search ||
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    (p.barcode || '').toLowerCase().includes(search.toLowerCase())
  );

  const bestTotalRevenue = bestSellers.reduce((sum, p) => sum + (p.totalRevenue || 0), 0);
  const bestTotalSold = bestSellers.reduce((sum, p) => sum + (p.totalSold || 0), 0);
  const deadCount = deadProducts.length;

  const handleExportBest = () => {
    const columns = [
      { header: '#', key: 'pos' },
      { header: 'Producto', key: 'name' },
      { header: 'Código', key: 'barcode' },
      { header: 'Cant. Vendida', key: 'totalQty' },
      { header: 'Ingreso Total', key: 'totalRevenue' },
      { header: '% del Total', key: 'percentage' },
    ];
    const data = filteredBest.map((p, i) => ({
      pos: i + 1,
      name: p.name,
      barcode: p.barcode || '—',
      totalQty: p.totalQty,
      totalRevenue: p.totalRevenue,
      percentage: p.percentage.toFixed(1),
    }));
    exportToExcel(data, columns, 'reporte_mas_vendidos', 'xlsx');
  };

  const handleExportDead = () => {
    const columns = [
      { header: 'Producto', key: 'name' },
      { header: 'Código', key: 'barcode' },
      { header: 'Stock Actual', key: 'stock' },
      { header: 'Última Venta', key: 'lastSale' },
      { header: 'Días Sin Vender', key: 'daysWithoutSale' },
    ];
    const data = filteredDead.map(p => ({
      name: p.name,
      barcode: p.barcode || '—',
      stock: p.stock,
      lastSale: formatDate(p.lastSale),
      daysWithoutSale: p.daysWithoutSale !== null ? `${p.daysWithoutSale} días` : 'Nunca vendido',
    }));
    exportToExcel(data, columns, 'reporte_productos_muertos', 'xlsx');
  };

  return (
    <div className={styles.container}>
      <TabNav
        tabs={[
          { key: 'best', label: 'Más Vendidos', icon: <TrendingUp size={16} /> },
          { key: 'dead', label: 'Productos Muertos', icon: <PackageX size={16} /> },
        ]}
        activeTab={tab}
        onTabChange={k => setTab(k as 'best' | 'dead')}
      />

      <KpiGrid
        items={[
          { icon: <ShoppingCart size={18} />, value: bestTotalSold, label: 'Total Vendido' },
          { icon: <DollarSign size={18} />, value: formatPrice(bestTotalRevenue), label: 'Ingreso Total' },
          { icon: <TrendingDown size={18} />, value: deadCount, label: 'Productos Muertos', color: deadCount > 0 ? '#dc2626' : '#16a34a' },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: tab === 'best' ? 'Buscar más vendidos...' : 'Buscar productos muertos...' }}
      >
        {tab === 'best' ? (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <span style={{ fontSize: 12, color: 'var(--text-muted, #888)', fontWeight: 600 }}>Desde:</span>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} style={{ padding: '7px 12px', fontSize: 12, border: '1px solid var(--border-color, #eee)', borderRadius: 'var(--card-radius, 6px)', background: 'var(--bg-main, #f5f5f5)', color: 'var(--text-dark, #555)' }} />
            <span style={{ fontSize: 12, color: 'var(--text-muted, #888)', fontWeight: 600 }}>Hasta:</span>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} style={{ padding: '7px 12px', fontSize: 12, border: '1px solid var(--border-color, #eee)', borderRadius: 'var(--card-radius, 6px)', background: 'var(--bg-main, #f5f5f5)', color: 'var(--text-dark, #555)' }} />
            <select value={bestLimit} onChange={e => setBestLimit(Number(e.target.value))} style={{ padding: '7px 12px', fontSize: 12, border: '1px solid var(--border-color, #eee)', borderRadius: 'var(--card-radius, 6px)', background: 'var(--bg-main, #f5f5f5)', color: 'var(--text-dark, #555)', fontWeight: 600, cursor: 'pointer' }}>
              <option value={5}>Top 5</option>
              <option value={10}>Top 10</option>
              <option value={20}>Top 20</option>
              <option value={50}>Top 50</option>
            </select>
            <button onClick={applyFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, border: '1px solid var(--color-orange-red, #f05a28)', borderRadius: 'var(--card-radius, 6px)', background: 'var(--color-orange-red, #f05a28)', color: 'white', cursor: 'pointer' }}>
              <Filter size={14} /> Filtrar
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <select value={deadDays} onChange={e => setDeadDays(Number(e.target.value))} style={{ padding: '7px 12px', fontSize: 12, border: '1px solid var(--border-color, #eee)', borderRadius: 'var(--card-radius, 6px)', background: 'var(--bg-main, #f5f5f5)', color: 'var(--text-dark, #555)', fontWeight: 600, cursor: 'pointer' }}>
              <option value={30}>30 días</option>
              <option value={60}>60 días</option>
              <option value={90}>90 días</option>
              <option value={180}>180 días</option>
              <option value={365}>365 días</option>
            </select>
            <button onClick={applyFilters} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', fontSize: 12, fontWeight: 600, border: '1px solid var(--color-orange-red, #f05a28)', borderRadius: 'var(--card-radius, 6px)', background: 'var(--color-orange-red, #f05a28)', color: 'white', cursor: 'pointer' }}>
              <Filter size={14} /> Filtrar
            </button>
          </div>
        )}
      </Toolbar>

      {loading && config.skeletonEnabled ? <SkeletonTablePage rows={bestLimit} cols={6} tabs={2} kpi={3} /> : loading ? <LoadingDots text="Cargando..." /> : (
        <>
          {tab === 'best' && (
            <div className="lista-container">
              <table className="lista-table">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Producto</th>
                    <th>Código</th>
                    <th style={{textAlign:'right'}}>Cant. Vendida</th>
                    <th style={{textAlign:'right'}}>Ingreso Total</th>
                    <th>% del Total <button className={styles.exportBtn} onClick={handleExportBest} title="Exportar a Excel"><Download size={14} /></button></th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBest.map((p, i) => (
                    <tr key={p.id}>
                      <td style={{fontWeight:700,color:'var(--text-muted)'}}>{i + 1}</td>
                      <td><span className="lista-name-text">{p.name}</span></td>
                      <td><span className="lista-code">{p.barcode || '\u2014'}</span></td>
                      <td style={{textAlign:'right'}}><span className="lista-number-value">{p.totalQty}</span></td>
                      <td style={{textAlign:'right'}}><span className="lista-number-value">{formatPrice(p.totalRevenue)}</span></td>
                      <td>
                        <div className="lista-progress-bar">
                          <div className="lista-progress-track">
                            <div className="lista-progress-fill orange" style={{ width: p.percentage + '%' }} />
                          </div>
                          <span className="lista-progress-value white">{p.percentage.toFixed(1)}%</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {tab === 'dead' && (
            <>
              {deadProducts.length === 0 ? (
                <div className={styles.emptyState}>
                  <div className={styles.emptyIcon}>{'\u2705'}</div>
                  <p>No hay productos muertos en este per&iacute;odo</p>
                </div>
              ) : (
                <div className="lista-container">
                  <table className="lista-table">
                    <thead>
                      <tr>
                        <th>Producto <button className={styles.exportBtn} onClick={handleExportDead} title="Exportar a Excel"><Download size={14} /></button></th>
                        <th>Código</th>
                        <th style={{textAlign:'right'}}>Stock Actual</th>
                        <th>Última Venta</th>
                        <th style={{textAlign:'right'}}>Días Sin Vender</th>
                        <th style={{textAlign:'center'}}>Acción</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredDead.map(p => (
                        <tr key={p.id}>
                          <td><span className="lista-name-text">{p.name}</span></td>
                          <td><span className="lista-code">{p.barcode || '\u2014'}</span></td>
                          <td style={{textAlign:'right'}}><span className="lista-number-value">{p.stock}</span></td>
                          <td>{formatDate(p.lastSale)}</td>
                          <td style={{textAlign:'right'}}>{p.daysWithoutSale !== null ? `${p.daysWithoutSale} días` : 'Nunca vendido'}</td>
                          <td style={{textAlign:'center'}}>
                            <div className="lista-actions" style={{justifyContent:'center'}}>
                              <button className="lista-action-btn" onClick={() => window.location.href = `/inventory?edit=${p.id}`} title="Ver producto">
                                <Eye size={14} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
