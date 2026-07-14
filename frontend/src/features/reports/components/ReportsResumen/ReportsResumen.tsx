import { useMemo } from 'react';
import { Activity, DollarSign, TrendingUp, AlertTriangle } from 'lucide-react';
import {
  Line,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ComposedChart,
  Legend,
  AreaChart,
  Area,
} from 'recharts';
import {
  CHART_PROPS,
  COLORS,
  renderTooltip,
  formatUsd as formatUSD,
  demoFinancialCore,
} from '../../pages/ReportsPage';
import styles from '../../pages/ReportsPage.module.css';
import tableStyles from '@shared/ui/TableList/TableList.module.css';

interface Props {
  sales: any[];
  products: any[];
}

export function ReportsResumen({ sales, products }: Props) {
  const dailySalesData = useMemo(() => {
    const map: Record<string, number> = {};
    sales.forEach((s) => {
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
    sales.forEach((s) => {
      const method = s.paymentMethod || 'unknown';
      map[method] = (map[method] || 0) + s.total;
    });
    return Object.entries(map)
      .map(([name, value]) => ({
        name: name.charAt(0).toUpperCase() + name.slice(1),
        value: Math.round(value * 100) / 100,
      }))
      .filter((d) => d.value > 0);
  }, [sales]);

  const topProducts = useMemo(() => {
    const map: Record<string, { name: string; qty: number; total: number }> = {};
    sales.forEach((s) => {
      (s.items || []).forEach((item: any) => {
        const key = item.productId;
        const prod = products.find((p) => p.id === key);
        const label = prod?.name || item.productName || 'Producto Eliminado';
        if (!map[key]) map[key] = { name: label, qty: 0, total: 0 };
        map[key].qty += item.quantity;
        map[key].total += item.subtotal;
      });
    });
    return Object.values(map)
      .sort((a, b) => b.total - a.total)
      .slice(0, 5)
      .map((p, i) => ({ ...p, color: COLORS[i % COLORS.length] }));
  }, [sales, products]);

  const { profitData, profitTotals } = useMemo(() => {
    const data: Record<string, { revenue: number; cost: number; profit: number }> = {};
    sales.forEach((s) => {
      const date = s.createdAt?.split('T')[0]?.slice(0, 7);
      if (!date) return;
      const revenue = s.total || 0;
      const cost = (s.items || []).reduce(
        (sum: number, i: any) => sum + (i.cost || 0) * i.quantity,
        0
      );
      const profit = revenue - cost;
      if (!data[date]) data[date] = { revenue: 0, cost: 0, profit: 0 };
      data[date].revenue += revenue;
      data[date].cost += cost;
      data[date].profit += profit;
    });
    const arr = Object.entries(data)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, vals]) => ({ month, ...vals }));
    const totals = arr.reduce(
      (acc, m) => {
        acc.revenue += m.revenue;
        acc.cost += m.cost;
        acc.profit += m.profit;
        return acc;
      },
      { revenue: 0, cost: 0, profit: 0 }
    );
    return { profitData: arr, profitTotals: totals };
  }, [sales]);

  const lowStockProducts = useMemo(
    () =>
      products
        .filter((p) => p.stock <= (p.minStock || 5) && p.stock > 0)
        .sort((a, b) => a.stock - b.stock)
        .slice(0, 10),
    [products]
  );

  return (
    <>
      <div className={`${styles.grid2} ${styles.gap20}`}>
        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <Activity size={14} /> Ventas diarias (últimos 30 días)
          </div>
          <div className={styles.cardSub}>Evolución de las ventas en el último mes.</div>
          <div className={styles.cardBody}>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={dailySalesData} {...CHART_PROPS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                <XAxis dataKey="date" stroke="var(--text-muted, #888)" fontSize={11} />
                <YAxis
                  stroke="var(--text-muted, #888)"
                  fontSize={11}
                  tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)}
                />
                <Tooltip {...renderTooltip} />
                <Line
                  type="monotone"
                  dataKey="total"
                  stroke="var(--color-primary, #f05a28)"
                  strokeWidth={2.5}
                  dot={{ r: 3, fill: 'var(--color-primary, #f05a28)' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <DollarSign size={14} /> Distribución por método de pago
          </div>
          <div className={styles.cardSub}>Participación de cada método de pago en el total.</div>
          <div className={styles.cardBody}>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={paymentData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                  nameKey="name"
                >
                  {paymentData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip {...renderTooltip} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <TrendingUp size={14} /> Top 5 productos por ingreso
          </div>
          <div className={styles.cardSub}>Productos que más facturan en el periodo.</div>
          <div className={styles.cardBody}>
            <div className={styles.pieWrapper}>
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie
                    data={topProducts}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="total"
                    nameKey="name"
                  >
                    {topProducts.map((_, i) => (
                      <Cell key={i} fill={COLORS[i % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip {...renderTooltip} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        <div className={styles.card}>
          <div className={styles.cardTitle}>
            <TrendingUp size={14} /> Ingresos vs Costos vs Utilidad (mes a mes)
          </div>
          <div className={styles.cardSub}>Desglose mensual del rendimiento financiero.</div>
          <div className={styles.cardBody}>
            <ResponsiveContainer width="100%" height={280}>
              <ComposedChart data={demoFinancialCore} {...CHART_PROPS}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #eee)" />
                <XAxis dataKey="name" stroke="var(--text-muted, #888)" fontSize={11} />
                <YAxis
                  stroke="var(--text-muted, #888)"
                  fontSize={11}
                  tickFormatter={(v) => (v >= 1000 ? (v / 1000).toFixed(1) + 'k' : v)}
                />
                <Tooltip {...renderTooltip} />
                <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
                <Bar
                  dataKey="revenue"
                  fill="var(--color-blue, #3b82f6)"
                  barSize={18}
                  name="Ingresos Brutos"
                />
                <Bar
                  dataKey="cost"
                  fill="var(--list-accent-color, #f97316)"
                  barSize={18}
                  name="Costos de Venta"
                />
                <Line
                  type="monotone"
                  dataKey="profit"
                  stroke="var(--color-success, #16a34a)"
                  strokeWidth={2.5}
                  name="Utilidad Neta"
                  dot={{ r: 3, fill: 'var(--color-success, #16a34a)' }}
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>
          <TrendingUp size={14} /> Detalle de utilidad neta mensual
        </div>
        <div className={styles.cardSub}>
          Métrica detallada del rendimiento financiero consolidado por mes.
        </div>
        <div className={styles.reportTableWrap}>
          <table className={styles.reportTable}>
            <thead>
              <tr>
                <th>Mes</th>
                <th className={styles.textRight}>Ingresos Brutos</th>
                <th className={styles.textRight}>Costos de Venta</th>
                <th className={styles.textRight}>Utilidad Neta</th>
              </tr>
            </thead>
            <tbody>
              {profitData.map((m) => (
                <tr key={m.month}>
                  <td>
                    <span className={tableStyles.nameText}>{m.month}</span>
                  </td>
                  <td className={styles.textRight}>
                    <span className={tableStyles.numberValue}>{formatUSD(m.revenue)}</span>
                  </td>
                  <td className={styles.textRight}>
                    <span className={tableStyles.numberValue}>{formatUSD(m.cost)}</span>
                  </td>
                  <td className={styles.textRight}>
                    <span
                      className={`${tableStyles.numberValue} ${m.profit >= 0 ? styles.textSuccess : styles.textDanger}`}
                    >
                      {formatUSD(m.profit)}
                    </span>
                  </td>
                </tr>
              ))}
              <tr className={styles.totalRow}>
                <td className={styles.totalCell}>Total Anual</td>
                <td className={styles.totalCellRight}>{formatUSD(profitTotals.revenue)}</td>
                <td className={styles.totalCellRight}>{formatUSD(profitTotals.cost)}</td>
                <td className={styles.totalProfit}>
                  <span
                    className={styles.totalProfitValue}
                    style={
                      {
                        '--profit-color':
                          profitTotals.profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)',
                      } as React.CSSProperties
                    }
                  >
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
            <div className={styles.reportTableWrap}>
              <table className={styles.reportTable}>
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th className={styles.textRight}>Stock Actual</th>
                    <th className={styles.textRight}>Stock Mínimo</th>
                    <th className={styles.textCenter}>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockProducts.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <span className={tableStyles.nameText}>{p.name}</span>
                      </td>
                      <td className={styles.textRight}>
                        <span className={tableStyles.numberValue}>{p.stock}</span>
                      </td>
                      <td className={styles.textRight}>{p.minStock}</td>
                      <td className={styles.textCenter}>
                        <span className={`${tableStyles.badge} ${tableStyles.badgeSaturated}`}>
                          Crítico
                        </span>
                      </td>
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
