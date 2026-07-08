import { useState, useEffect, useMemo } from 'react';
import {
  ResponsiveContainer, BarChart, CartesianGrid, XAxis, YAxis, Tooltip, Bar,
  LineChart, Legend, Line, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Radar, ComposedChart, ScatterChart, Scatter, Cell, PieChart, Pie,
  AreaChart, Area
} from 'recharts';
import { Activity, DollarSign, TrendingUp, AlertTriangle, BarChart3, Package, ShoppingCart } from 'lucide-react';
import { api } from '@shared/lib/http/client';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { SkeletonReports } from '@shared/ui/Skeleton';
import { TabNav } from '@shared/ui/TabNav';
import { useTheme } from '@contexts/ThemeContext';
import styles from './ReportsPage.module.css';

export const COLORS = ['#ea580c', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];

export const CHART_PROPS = {
  contentStyle: { backgroundColor: 'var(--bg-card, #1e1e1e)', borderColor: 'var(--border-color, #2d2d2d)', borderRadius: '6px' },
  itemStyle: { fontSize: '12px', color: 'var(--text-main)' },
  labelStyle: { fontSize: '11px', fontWeight: 'bold', color: 'var(--text-muted)' }
};

export const TAB_ITEMS = [
  { key: 'resumen', label: 'Resumen', icon: <BarChart3 size={16} /> },
  { key: 'finanzas', label: 'Finanzas', icon: <DollarSign size={16} /> },
  { key: 'logistica', label: 'Logística', icon: <Package size={16} /> },
  { key: 'operaciones', label: 'Operaciones', icon: <ShoppingCart size={16} /> },
  { key: 'analitica', label: 'Analítica', icon: <TrendingUp size={16} /> }
];

export const formatUSD = (v: number) => `$${v.toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function groupSalesByDate(sales: any[], days = 30) {
  const map: Record<string, number> = {};
  sales.forEach(s => {
    const date = s.createdAt?.split('T')[0];
    if (date) map[date] = (map[date] || 0) + s.total;
  });
  return Object.entries(map)
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-days)
    .map(([date, total]) => ({ date: date.slice(5), total: Math.round(total * 100) / 100 }));
}

function getPaymentMethodData(sales: any[]) {
  const map: Record<string, number> = {};
  sales.forEach(s => {
    const method = s.paymentMethod || 'unknown';
    map[method] = (map[method] || 0) + s.total;
  });
  return Object.entries(map)
    .map(([name, value]) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: Math.round(value * 100) / 100,
    }))
    .filter(d => d.value > 0);
}

function getTopProducts(sales: any[], products: any[]) {
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
}

function getMonthlyProfit(sales: any[]) {
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
    return {
      month: monthNames[key],
      revenue: Math.round(d.revenue * 100) / 100,
      cost: Math.round(d.cost * 100) / 100,
      profit,
    };
  });
}

export const demoFinancialCore = [
  { month: 'Ene', revenue: 5000, cost: 3800, profit: 1200 },
  { month: 'Feb', revenue: 6200, cost: 3900, profit: 2300 },
  { month: 'Mar', revenue: 5800, cost: 3900, profit: 1900 },
  { month: 'Abr', revenue: 9000, cost: 4900, profit: 4100 },
  { month: 'May', revenue: 8500, cost: 5400, profit: 3100 },
  { month: 'Jun', revenue: 17848, cost: 5656, profit: 12192 },
];

export const demoAging = [
  { name: 'J.A. Vasquez', current: 0, days30: 1250, days60: 0 },
  { name: 'Dist. Mendoza', current: 6550, days30: 0, days60: 0 },
  { name: 'Falcon C.A.', current: 1734, days30: 0, days60: 265 },
];

export const demoExpenses = [
  { month: 'Abr', payroll: 1500, logistics: 800, shrinkage: 200 },
  { month: 'May', payroll: 1500, logistics: 1200, shrinkage: 400 },
  { month: 'Jun', payroll: 1800, logistics: 950, shrinkage: 100 },
];

export const demoDeviation = [
  { volume: 10, rate: 652.97, group: 'Cobertura Óptima' },
  { volume: 25, rate: 653.40, group: 'Cobertura Óptima' },
  { volume: 40, rate: 652.80, group: 'Cobertura Óptima' },
  { volume: 15, rate: 664.20, group: 'Pérdida por Spread' },
  { volume: 50, rate: 668.00, group: 'Pérdida por Spread' },
];

export const demoDeviationOptimal = demoDeviation.filter(d => d.group === 'Cobertura Óptima');
export const demoDeviationLoss = demoDeviation.filter(d => d.group === 'Pérdida por Spread');

export const demoBubble = [
  { x: 15, y: 2, z: 120, name: 'Cebolla', group: 'Clase A' },
  { x: 30, y: 5, z: 150, name: 'Pan1', group: 'Clase A' },
  { x: 121, y: 15, z: 80, name: 'Insumo B', group: 'Clase B' },
  { x: 15, y: 90, z: 220, name: 'Dead Stock', group: 'Clase C' },
];

export const demoGantt = [
  { name: 'TRF-101 (Norte)', start: 1, end: 3 },
  { name: 'TRF-102 (Central)', start: 2, end: 5 },
];

export const demoLeadTime = [
  { lot: 'Lote 1', proveedor1: 2, proveedor2: 5 },
  { lot: 'Lote 2', proveedor1: 4, proveedor2: 8 },
  { lot: 'Lote 3', proveedor1: 3, proveedor2: 4 },
  { lot: 'Lote 4', proveedor1: 2, proveedor2: 7 },
];

export const demoPosHourly = [
  { hour: '08:00', sales: 150 },
  { hour: '11:00', sales: 1450 },
  { hour: '14:00', sales: 300 },
  { hour: '17:00', sales: 2300 },
  { hour: '20:00', sales: 450 },
];

export const demoRadar = [
  { metric: 'Volumen Bruto', Carlos: 95, Marta: 60 },
  { metric: 'Ticket Promedio', Carlos: 90, Marta: 45 },
  { metric: 'Cuotas', Carlos: 98, Marta: 60 },
  { metric: 'Baja Merma', Carlos: 85, Marta: 95 },
  { metric: 'Retención', Carlos: 90, Marta: 65 },
];

export const demoFunnel = [
  { name: 'Presupuestos Emitidos', value: 502 },
  { name: 'Convertidos a Venta', value: 310 },
  { name: 'Cobrados / Liquidación', value: 295 },
];

export const demoPareto = [
  { name: 'Cebolla', volume: 12000, pct: 38.7 },
  { name: 'Pan1', volume: 8000, pct: 64.5 },
  { name: 'Insumo B', volume: 5000, pct: 80.6 },
  { name: 'Proteína', volume: 3000, pct: 90.3 },
  { name: 'Combo 1', volume: 1500, pct: 95.2 },
  { name: 'Salsa', volume: 800, pct: 97.7 },
  { name: 'Kits', volume: 500, pct: 99.4 },
  { name: 'Licencias', volume: 200, pct: 100.0 },
];

export const demoCashRunway = [
  { week: 'Sem 1', cobros: 4500, pagos: 2000 },
  { week: 'Sem 2', cobros: 6000, pagos: 5500 },
  { week: 'Sem 3', cobros: 8500, pagos: 9500 },
  { week: 'Sem 4', cobros: 9000, pagos: 8500 },
  { week: 'Sem 5', cobros: 11000, pagos: 13000 },
  { week: 'Sem 6', cobros: 14000, pagos: 12000 },
  { week: 'Sem 7', cobros: 15500, pagos: 11000 },
  { week: 'Sem 8', cobros: 18000, pagos: 10500 },
];

export const demoHeatmap = [
  { day: 1, hour: 9, severity: 'normal' },
  { day: 1, hour: 12, severity: 'normal' },
  { day: 2, hour: 10, severity: 'normal' },
  { day: 3, hour: 15, severity: 'normal' },
  { day: 4, hour: 11, severity: 'normal' },
  { day: 5, hour: 14, severity: 'normal' },
  { day: 5, hour: 16, severity: 'normal' },
  { day: 6, hour: 10, severity: 'normal' },
  { day: 1, hour: 23, severity: 'anomaly' },
  { day: 3, hour: 22, severity: 'anomaly' },
  { day: 7, hour: 23, severity: 'anomaly' },
  { day: 7, hour: 2, severity: 'anomaly' },
];

export const demoTaxLiability = [
  { name: 'Sucursal Central', debit: 3400, credit: 1900, net: 1500 },
  { name: 'Sede Norte', debit: 1800, credit: 1200, net: 600 },
  { name: 'Depósito Este', debit: 900, credit: 1100, net: -200 },
  { name: 'E-Commerce', debit: 2200, credit: 800, net: 1400 },
];

export const renderTooltip = (props: any) => {
  const { active, payload, label } = props;
  if (!active || !payload?.length) return null;
  return (
    <div style={{ backgroundColor: 'var(--bg-card, #1e1e1e)', border: '1px solid var(--border-color, #2d2d2d)', padding: '8px 12px', fontSize: '12px', color: 'var(--text-dark, #e5e5e5)' }}>
      <div style={{ fontWeight: 700, marginBottom: 4, fontSize: 11, color: 'var(--text-muted, #888)', textTransform: "none", letterSpacing: '0.5px' }}>{label}</div>
      {payload.map((p: any, i: number) => (
        <div key={i} style={{ color: p.color, marginTop: 2 }}>{p.name}: {typeof p.value === 'number' ? `$${p.value.toLocaleString('de-DE', { minimumFractionDigits: 2 })}` : p.value}</div>
      ))}
    </div>
  );
};

export function ReportsPage() {
  const [sales, setSales] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('resumen');
  const { config } = useTheme();

  const dailySalesData = useMemo(() => groupSalesByDate(sales), [sales]);
  const paymentData = useMemo(() => getPaymentMethodData(sales), [sales]);
  const topProducts = useMemo(() => getTopProducts(sales, products), [sales, products]);
  const monthlyProfit = useMemo(() => getMonthlyProfit(sales), [sales]);
  const lowStockProducts = useMemo(() => products.filter(p => p.stock <= p.minStock), [products]);

  const profitData = monthlyProfit.length >= 3 ? monthlyProfit : demoFinancialCore;

  const profitDataWithTotal = useMemo(() => {
    const totalRevenue = profitData.reduce((s, m) => s + m.revenue, 0);
    const totalCost = profitData.reduce((s, m) => s + m.cost, 0);
    const totalProfit = profitData.reduce((s, m) => s + m.profit, 0);
    return [...profitData, { month: 'TOTAL', revenue: totalRevenue, cost: totalCost, profit: totalProfit }];
  }, [profitData]);

  const profitTotals = useMemo(() => ({
    revenue: profitData.reduce((s, m) => s + m.revenue, 0),
    cost: profitData.reduce((s, m) => s + m.cost, 0),
    profit: profitData.reduce((s, m) => s + m.profit, 0),
  }), [profitData]);



  useEffect(() => {
    Promise.all([
      api.getSales(500).then(setSales).catch(() => {}),
      api.getProducts().then(setProducts).catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  if (loading) return config.skeletonEnabled ? <SkeletonReports chartCount={6} /> : <LoadingDots text="Cargando reportes..." />;

  return (
    <div className={styles.container}>
      <TabNav tabs={TAB_ITEMS} activeTab={activeTab} onTabChange={setActiveTab} />

      {activeTab === 'resumen' && (
        <>
          <div className={styles.grid2}>
            <div className={styles.card}>
              <div className={styles.cardTitle}><Activity size={14} /> Ventas diarias (últimos 30 días)</div>
              <div className={styles.cardBody}>
                {dailySalesData.length === 0 ? (
                  <p className={styles.muted}>No hay datos de ventas.</p>
                ) : (
                  <ResponsiveContainer width="100%" height={280}>
                    <AreaChart data={dailySalesData}>
                      <defs>
                        <linearGradient id="salesGradReports" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.25}/>
                          <stop offset="95%" stopColor="var(--color-orange-red, #f05a28)" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                      <XAxis dataKey="date" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                      <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                      <Tooltip {...CHART_PROPS} />
                      <Area type="monotone" dataKey="total" stroke="var(--color-orange-red, #f05a28)" strokeWidth={2} fillOpacity={1} fill="url(#salesGradReports)" dot={false} />
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
                    <ResponsiveContainer width="100%" height={280}>
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
                  <ResponsiveContainer width="100%" height={300}>
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
                <ResponsiveContainer width="100%" height={300}>
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
      )}

      {activeTab === 'finanzas' && (
        <div className={styles.grid2}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Curva analítica de márgenes operativos</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={demoFinancialCore}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Bar dataKey="revenue" fill="var(--color-blue, #3b82f6)" barSize={18} name="Ingresos Brutos" />
                <Bar dataKey="cost" fill="var(--list-accent-color, #f97316)" barSize={18} name="Costos de Venta" />
                <Line type="monotone" dataKey="profit" stroke="var(--color-success, #16a34a)" strokeWidth={2.5} name="Utilidad Neta" dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Envejecimiento de créditos (CxC)</div>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={demoAging} layout="vertical" barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Bar dataKey="current" stackId="a" fill="var(--color-success, #16a34a)" name="Al Día" />
                <Bar dataKey="days30" stackId="a" fill="var(--color-blue, #3b82f6)" name="0-30 Días" />
                <Bar dataKey="days60" stackId="a" fill="var(--color-red, #dc2626)" name="+60 Días" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Desglose de gastos por categoría operativa</div>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={demoExpenses} barSize={20}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Bar dataKey="payroll" stackId="a" fill="#6366f1" name="Nómina" />
                <Bar dataKey="logistics" stackId="a" fill="#ec4899" name="Logística" />
                <Bar dataKey="shrinkage" stackId="a" fill="#f43f5e" name="Mermas/Ajustes" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Dispersión de volatilidad cambiaria vs spread de protección</div>
            <ResponsiveContainer width="100%" height={260}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="volume" name="Volumen Ope ($)" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis dataKey="rate" name="Tasa Registrada (VES)" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" domain={[650, 670]} />
                <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Scatter name="Cobertura Óptima" data={demoDeviationOptimal} fill="var(--color-success, #16a34a)" />
                <Scatter name="Pérdida por Spread" data={demoDeviationLoss} fill="var(--color-red, #dc2626)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'logistica' && (
        <div className={styles.grid2}>
          <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.cardTitle}>Matriz ABC de rotación y densidad patrimonial inmovilizada</div>
            <ResponsiveContainer width="100%" height={300}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="x" name="Unidades Físicas" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis dataKey="y" name="Días de Inmovilización" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Scatter name="Clase A (Alta Rotación)" data={demoBubble.filter(d => d.group === 'Clase A')} fill="var(--color-success, #16a34a)" shape="circle" />
                <Scatter name="Clase B (Media)" data={demoBubble.filter(d => d.group === 'Clase B')} fill="var(--color-blue, #3b82f6)" shape="circle" />
                <Scatter name="Clase C (Productos Muertos)" data={demoBubble.filter(d => d.group === 'Clase C')} fill="var(--color-red, #dc2626)" shape="circle" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Cronograma de guías de transferencia en tránsito</div>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={demoGantt} layout="vertical" barSize={16}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis type="number" domain={[0, 7]} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis dataKey="name" type="category" width={140} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Bar dataKey="start" fill="transparent" stackId="a" />
                <Bar dataKey="end" fill="var(--list-accent-color, #f97316)" stackId="b" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Desviación y tiempos de entrega de proveedores (lead time)</div>
            <ResponsiveContainer width="100%" height={240}>
              <LineChart data={demoLeadTime}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="lot" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" name="Días de Espera" />
                <Tooltip content={renderTooltip} />
                <Legend iconType="line" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Line type="monotone" dataKey="proveedor1" stroke="var(--color-blue, #3b82f6)" strokeWidth={2} name="Proveedor Cebollas S.A" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="proveedor2" stroke="var(--color-red, #dc2626)" strokeWidth={2} name="Fruver Central" dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'operaciones' && (
        <div className={styles.grid2}>
          <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
            <div className={styles.cardTitle}>Análisis cronológico de curva de tráfico y horas pico en POS</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={demoPosHourly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Line type="monotone" dataKey="sales" stroke="var(--list-accent-color, #f97316)" strokeWidth={2.5} name="Facturación ($)" dot={{ r: 4, fill: 'var(--list-accent-color, #f97316)' }} fillOpacity={0.05} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Radar multidimensional de competencias del personal</div>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={demoRadar}>
                <PolarGrid stroke="var(--border-color, #2d2d2d)" />
                <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10, fill: 'var(--text-muted, #888)' }} />
                <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} />
                <Tooltip content={renderTooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Radar name="Carlos Pérez" dataKey="Carlos" stroke="var(--color-blue, #3b82f6)" fill="rgba(59, 130, 246, 0.04)" />
                <Radar name="Marta Gómez" dataKey="Marta" stroke="var(--color-purple, #8b5cf6)" fill="rgba(139, 92, 246, 0.04)" />
              </RadarChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Embudo de conversión comercial</div>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={demoFunnel} layout="vertical" barSize={22}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis dataKey="name" type="category" width={160} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Bar dataKey="value" fill="var(--color-purple, #8b5cf6)" name="Volumen">
                  {demoFunnel.map((_, i) => <Cell key={i} fill={[ '#4f46e5', '#8b5cf6', '#10b981' ][i]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {activeTab === 'analitica' && (
        <div className={styles.grid2}>
          <div className={styles.card}>
            <div className={styles.cardTitle}>Análisis de Pareto 80/20 (best-sellers vs productos muertos)</div>
            <div className={styles.cardSub}>Corte crítico donde el 20% de los SKUs genera el 80% del volumen de facturación.</div>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={demoPareto}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-muted, #888)" />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis yAxisId="right" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Bar yAxisId="left" dataKey="volume" fill="var(--color-blue, #3b82f6)" barSize={16} name="Volumen Facturado ($)" />
                <Line yAxisId="right" type="monotone" dataKey="pct" stroke="var(--color-warning, #f59e0b)" strokeWidth={2} name="Línea de Pareto Acumulada (%)" dot={{ r: 3 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Previsión de flujo de caja (cash runway)</div>
            <div className={styles.cardSub}>Cruces cronológicos a 60 días entre promesas de cobro (CxC) y compromisos de pago (CxP).</div>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={demoCashRunway}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Legend iconType="line" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Line type="monotone" dataKey="cobros" stroke="var(--color-success, #16a34a)" strokeWidth={2} name="Expectativa de Cobros (CxC)" dot={{ r: 3 }} />
                <Line type="monotone" dataKey="pagos" stroke="var(--color-red, #dc2626)" strokeWidth={2} name="Obligaciones por Pagar (CxP)" dot={{ r: 3 }} strokeDasharray="4 4" />
              </LineChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Mapa matricial de frecuencia de anomalías en bitácora</div>
            <div className={styles.cardSub}>Auditoría visual de seguridad de logs críticos fuera de horario.</div>
            <ResponsiveContainer width="100%" height={240}>
              <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="day" domain={[0, 8]} ticks={[1, 2, 3, 4, 5, 6, 7]} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" name="Día de la Semana" />
                <YAxis dataKey="hour" domain={[0, 24]} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" name="Bloque Horario" />
                <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Scatter name="Operaciones Estándar" data={demoHeatmap.filter(d => d.severity === 'normal')} fill="var(--text-muted, #555)" shape="square" />
                <Scatter name="Anomalías / Acciones Críticas" data={demoHeatmap.filter(d => d.severity === 'anomaly')} fill="var(--color-red, #dc2626)" />
              </ScatterChart>
            </ResponsiveContainer>
          </div>

          <div className={styles.card}>
            <div className={styles.cardTitle}>Balance de carga tributaria neta por sucursales</div>
            <div className={styles.cardSub}>Débito Fiscal (Retenciones POS) vs Crédito Fiscal Deducible (Compras).</div>
            <ResponsiveContainer width="100%" height={240}>
              <ComposedChart data={demoTaxLiability}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} stroke="var(--text-muted, #888)" />
                <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
                <Tooltip content={renderTooltip} />
                <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Bar dataKey="debit" fill="#4f46e5" barSize={14} name="Débito Fiscal (Ventas POS)" />
                <Bar dataKey="credit" fill="var(--color-blue, #3b82f6)" barSize={14} name="Crédito Fiscal (Compras)" />
                <Line type="monotone" dataKey="net" stroke="var(--color-purple, #a855f7)" strokeWidth={2} name="Saldo Neto al Fisco" dot={{ r: 4 }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
}
