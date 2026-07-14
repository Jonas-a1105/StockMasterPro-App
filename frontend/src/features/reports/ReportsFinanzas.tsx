import { useMemo } from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  ScatterChart,
  Scatter,
  ComposedChart,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { TrendingUp, DollarSign, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import {
  CHART_PROPS,
  COLORS,
  renderTooltip,
  formatUSD,
  demoFinancialCore,
  demoAging,
  demoExpenses,
  demoDeviationOptimal,
  demoDeviationLoss,
  demoBubble,
  demoGantt,
  demoLeadTime,
  demoPosHourly,
  demoRadar,
  demoFunnel,
  demoPareto,
  demoCashRunway,
  demoHeatmap,
  demoTaxLiability,
} from './pages/ReportsPage';
import styles from './pages/ReportsPage.module.css';

interface Props {
  sales: any[];
  products: any[];
}

export function ReportsFinanzas({ sales, products }: Props) {
  return (
    <div className={styles.grid2}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>Curva analítica de márgenes operativos</div>
        <ResponsiveContainer width="100%" height={280} key="margenes-operativos">
          <ComposedChart data={demoFinancialCore}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} />
            <Legend
              iconType="rect"
              wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }}
            />
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
              dot={{ r: 3 }}
            />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Envejecimiento de créditos (CxC)</div>
        <ResponsiveContainer width="100%" height={280} key="envejecimiento-cxc">
          <BarChart data={demoAging} layout="vertical" barSize={14}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis
              dataKey="name"
              type="category"
              width={110}
              tick={{ fontSize: 11 }}
              stroke="var(--text-muted, #888)"
            />
            <Tooltip content={renderTooltip} />
            <Legend
              iconType="rect"
              wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }}
            />
            <Bar dataKey="current" stackId="a" fill="var(--color-success, #16a34a)" name="Al Día" />
            <Bar dataKey="days30" stackId="a" fill="var(--color-blue, #3b82f6)" name="0-30 Días" />
            <Bar dataKey="days60" stackId="a" fill="var(--color-red, #dc2626)" name="+60 Días" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Desglose de gastos por categoría operativa</div>
        <ResponsiveContainer width="100%" height={260} key="gastos-categoria">
          <BarChart data={demoExpenses} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis dataKey="month" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} />
            <Legend
              iconType="rect"
              wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }}
            />
            <Bar dataKey="payroll" stackId="a" fill="#6366f1" name="Nómina" />
            <Bar dataKey="logistics" stackId="a" fill="#ec4899" name="Logística" />
            <Bar dataKey="shrinkage" stackId="a" fill="#f43f5e" name="Mermas/Ajustes" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>
          Dispersión de volatilidad cambiaria vs spread de protección
        </div>
        <ResponsiveContainer width="100%" height={260} key="dispersión-cambiaría">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis
              dataKey="volume"
              name="Volumen Ope ($)"
              tick={{ fontSize: 11 }}
              stroke="var(--text-muted, #888)"
            />
            <YAxis
              dataKey="rate"
              name="Tasa Registrada (VES)"
              tick={{ fontSize: 11 }}
              stroke="var(--text-muted, #888)"
              domain={[650, 670]}
            />
            <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
            <Legend
              iconType="circle"
              wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }}
            />
            <Scatter
              name="Cobertura Óptima"
              data={demoDeviationOptimal}
              fill="var(--color-success, #16a34a)"
            />
            <Scatter
              name="Pérdida por Spread"
              data={demoDeviationLoss}
              fill="var(--color-red, #dc2626)"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
