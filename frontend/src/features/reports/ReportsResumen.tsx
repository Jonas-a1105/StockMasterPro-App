import { useMemo } from 'react';
import { Activity, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  Line, PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer, ComposedChart, Legend,
  AreaChart, Area
} from 'recharts';
import { CHART_PROPS, COLORS, renderTooltip, formatUSD, demoFinancialCore } from './pages/ReportsPage';
import styles from '../ReportsPage.module.css';

interface Props {
  sales: any[];
  products: any[];
}

export function ReportsResumen({ sales, products }: Props) {
  const dailySalesData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      const date = s.createdAt?.split('T')[0];
      if (date) map[date] = (map[date] || 0) + s.total;
    });
    return Object.entries(map)
      .sort(([a], [b]) => a.localeCompare(b))
      .slice(-30)
      .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total * 100) / 100 }));
  }, [sales]);

  const paymentData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach(s => {
      const method = s.paymentMethod || 'unknown';
      map[method] = (map[method] || 0) + s.total;
    });
    return Object.entries(map)
      .map(([name, value]) => ({ name: name.charAt(0).toUpperCase() + name.slice(1), value: Math.round(value * 100) / 100 }))
      .filter(d => d.value > 0);
  }, [sales]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {};
    sales.forEach(s => {
      (s.items || []).forEach((item: any) => {
        const key = item.productId;
        const prod = products.find(p => p.id === key);
        const label = prod?.name || item.productName || 'Producto Eliminado';
        if (!map[key]) map[key] = { name: label, qty: 0, total: 0 };
        map[key].qty += item.quantity;
        map[key].total += item.subtotal;
      });
    });
    return Object.values(map).sort((a, b) => b.qty - a.qty).slice(0, 10);
  }, [sales, products]);

  const monthlyProfit = useMemo(() => {
    const map: Record<string, { revenue: number; cost: number }> = {};
    sales.forEach(s => {
      const date = s.createdAt?.split('T')[0];
      if (!date) return;
      const month = date.slice(0, 7);
      if (!map[month]) map[month] = { revenue: 0, cost: 0 };
      map[month].revenue += s.total;
      (s.items || []).forEach((i: any) => {
        map[month].cost += (i.cost || 0) * i.quantity;
      });
    });
    const monthKeys = ['01','02','03','04','05','06','07','08','09','10','11','12'];
    const monthNames: Record<string, string> = { '01': 'Ene','02': 'Feb','03': 'Mar','04': 'Abr','05': 'May','06': 'Jun','07': 'Jul','08': 'Ago','09': 'Sep','10': 'Oct','11': 'Nov','12': 'Dic' };
    return monthKeys.map(key => {
      const d = map[`2024-${key}`] || map[`2025-${key}`] || map[`2026-${key}`] || { revenue: 0, cost: 0 };
      const profit = Math.round((d.revenue - d.cost) * 100) / 100;
      return { month: monthNames[key], revenue: Math.round(d.revenue * 100) / 100, cost: Math.round(d.cost * 100) / 100, profit };
    });
  }, [sales]);

  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= p.minStock), [products]);
  const profitData = monthlyProfit.length >= 3 ? monthlyProfit : demoFinancialCore;

  const profitDataWithTotal = useMemo(() => {
    const totalRevenue = profitData.reduce((s: number, m: any) => s + m.revenue, 0);
    const totalCost = profitData.reduce((s: number, m: any) => s + m.cost, 0);
    const totalProfit = profitData.reduce((s: number, m: any) => s + m.profit, 0);
    return [...profitData, { month: 'TOTAL', revenue: totalRevenue, cost: totalCost, profit: totalProfit }];
  }, [profitData]);

  const profitTotals = useMemo(() => ({
    revenue: profitData.reduce((s: number, m: any) => s + m.revenue, 0),
    cost: profitData.reduce((s: number, m: any) => s + m.cost, 0),
    profit: profitData.reduce((s: number, m: any) => s + m.profit, 0),
  }), [profitData]);

  return (
    <>
      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardTitle}><Activity size={14} /> Ventas diarias (últimos 30 días)</div>
          <div className={styles.cardBody}>
            {dailySalesData.length === 0 ? (
              <p className={styles.muted}>No hay datos de ventas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={280} key="daily-sales">
                <AreaChart data={dailySalesData}>
                  <defs>
                    <linearGradient id="salesGradResumen" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.25}/>
                      <stop offset="95%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                  <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                  <Tooltip {...CHART_PROPS} />
                  <Area type="monotone" dataKey="total" stroke="var(--color-orange-red, #f05a28)" strokeWidth={2} fillOpacity={1} fill="url(#salesGradResumen)" dot={false} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}><DollarSign size={14} /> Distribución por método de pago</div>
          <div className={styles.cardBody}>
            {paymentData.length === 0 ? (
              <p className={styles.muted}>No hay datos de ventas.</p>
            ) : (
              <div className={styles.pieWrapper}>
                <ResponsiveContainer width="100%" height={280} key="payment-method">
                  <PieChart>
                    <Pie data={paymentData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={4} cornerRadius={6} label={({ name, percent }) => (percent ?? 0) > 0.01 ? `${name} ${((percent ?? 0) * 100).toFixed(0)}%` : ''}>
                      {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip {...CHART_PROPS} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className={styles.grid2}>
        <div className={styles.card}>
          <div className={styles.cardTitle}><TrendingUp size={14} /> Top 10 productos más vendidos</div>
          <div className={styles.cardBody}>
            {topProducts.length === 0 ? (
              <p className={styles.muted}>No hay datos de ventas.</p>
            ) : (
              <ResponsiveContainer width="100%" height={300} key="top-products">
                <BarChart data={topProducts} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                  <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                  <YAxis dataKey="name" type="category" width={120} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" tickFormatter={v => v.length > 16 ? v.slice(0, 14) + '...' : v} />
                  <Tooltip {...CHART_PROPS} />
                  <Bar dataKey="qty" fill="var(--color-orange, #eb8c00)" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
        <div className={styles.card}>
          <div className={styles.cardTitle}><TrendingUp size={14} /> Utilidad neta - detalle mensual de rendimiento</div>
          <div className={styles.cardSub}>Métrica corporativa del rendimiento financiero. Ingresos Brutos vs Costos de Venta vs Utilidad Neta.</div>
          <div className={styles.cardBody}>
            <ResponsiveContainer width="100%" height={300} key="profit-detail">
              <ComposedChart data={profitDataWithTotal}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip {...CHART_PROPS} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Bar dataKey="revenue" fill="var(--color-blue, #3b82f6)" barSize={18} name="Ingresos Brutos" />
                <Bar dataKey="cost" fill="var(--list-accent-color, #f97316)" barSize={18} name="Costos de Venta" />
                <Line type="monotone" dataKey="profit" stroke="var(--color-success, #16a34a)" strokeWidth={2.5} name="Utilidad Neta" dot={{ r: 3, fill: 'var(--color-success, #16a34a)' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}><TrendingUp size={14} /> Detalle de utilidad neta mensual</div>
        <div className={styles.cardSub}>Métrica detallada del rendimiento financiero consolidado por mes.</div>
        <div className="lista-container" style={{ marginTop: 16 }}>
          <table className="lista-table">
            <thead>
              <tr>
                <th>Mes</th>
                <th style={{textAlign:'right'}}>Ingresos Brutos</th>
                <th style={{textAlign:'right'}}>Costos de Venta</th>
                <th style={{textAlign:'right'}}>Utilidad Neta</th>
              </tr>
            </thead>
            <tbody>
              {profitData.map(m => (
                <tr key={m.month}>
                  <td><span className="lista-name-text">{m.month}</span></td>
                  <td style={{textAlign:'right'}}><span className="lista-number-value">{formatUSD(m.revenue)}</span></td>
                  <td style={{textAlign:'right'}}><span className="lista-number-value">{formatUSD(m.cost)}</span></td>
                  <td style={{textAlign:'right'}}>
                    <span className="lista-number-value" style={{color: m.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}}>
                      {formatUSD(m.profit)}
                    </span>
                  </td>
                </tr>
              ))}
              <tr style={{borderTop: '2px solid var(--list-accent-color, #f97316)', backgroundColor: 'var(--list-header-bg, #141414)'}}>
                <td style={{fontWeight: 800, color: 'var(--list-accent-color, #f97316)', fontSize: 'calc(var(--list-body-font-size, 12px) + 1px)', textTransform: "none", letterSpacing: '0.5px', padding: 'var(--list-cell-padding, 12px)'}}>
                  Total Anual
                </td>
                <td style={{textAlign:'right', fontWeight: 700, padding: 'var(--list-cell-padding, 12px)'}}>
                  {formatUSD(profitTotals.revenue)}
                </td>
                <td style={{textAlign:'right', fontWeight: 700, padding: 'var(--list-cell-padding, 12px)'}}>
                  {formatUSD(profitTotals.cost)}
                </td>
                <td style={{textAlign:'right', padding: 'var(--list-cell-padding, 12px)'}}>
                  <span style={{fontWeight: 800, fontSize: 'calc(var(--list-body-font-size, 12px) + 2px)', color: profitTotals.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}}>
                    {formatUSD(profitTotals.profit)}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <AlertTriangle size={14} />
          Productos con stock bajo
        </div>
        <div className={styles.cardBody}>
          {lowStockProducts.length === 0 ? (
            <p className={styles.muted}>No hay productos con stock bajo.</p>
          ) : (
            <div className="lista-container">
              <table className="lista-table">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th style={{ textAlign: 'right' }}>Stock Actual</th>
                    <th style={{ textAlign: 'right' }}>Stock Mínimo</th>
                    <th style={{ textAlign: 'center' }}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map(p => (
                    <tr key={p.id}>
                      <td><span className="lista-name-text">{p.name}</span></td>
                      <td style={{ textAlign: 'right' }}><span className="lista-number-value">{p.stock}</span></td>
                      <td style={{ textAlign: 'right' }}>{p.minStock}</td>
                      <td style={{ textAlign: 'center' }}><span className="lista-badge saturated">Crítico</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </>
  );
}