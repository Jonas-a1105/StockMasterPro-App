import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  FunnelChart, Funnel, Tooltip, ResponsiveContainer, Legend, ComposedChart, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { CHART_PROPS, COLORS, renderTooltip, formatUSD, demoRadar, demoFunnel, demoPareto, demoCashRunway, demoHeatmap, demoTaxLiability } from './pages/ReportsPage';
import styles from '../ReportsPage.module.css';

interface Props {
  sales: any[];
  products: any[];
}

export function ReportsOperaciones({ sales, products }: Props) {
  return (
    <div className={styles.grid2}>
      <div className={styles.card}>
        <div className={styles.cardTitle}>Radar de desempeño vendedores</div>
        <ResponsiveContainer width="100%" height={280} key="radar-vendedores">
          <RadarChart data={demoRadar} cx="50%" cy="55%" outerRadius={80}>
            <PolarGrid stroke="var(--border-color, #2d2d2d)" />
            <PolarAngleAxis dataKey="metric" tick={{ fontSize: 10 }} stroke="var(--text-muted, #888)" />
            <PolarRadiusAxis tick={{ fontSize: 10 }} stroke="var(--text-muted, #888)" domain={[0, 100]} />
            <Tooltip content={renderTooltip} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
            <Radar name="Carlos" dataKey="Carlos" stroke="var(--brand-orange, #ea580c)" fill="var(--brand-orange, #ea580c)" fillOpacity={0.15} />
            <Radar name="Marta" dataKey="Marta" stroke="var(--color-blue, #3b82f6)" fill="var(--color-blue, #3b82f6)" fillOpacity={0.15} />
          </RadarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Embudo de conversión presupuestos → cobranza</div>
        <ResponsiveContainer width="100%" height={280} key="embudo-conversion">
          <FunnelChart>
            <Tooltip content={renderTooltip} />
            <Funnel dataKey="value" nameKey="name" data={demoFunnel} stroke="var(--border-color, #2d2d2d)" strokeWidth={1} isAnimationActive={true} />
          </FunnelChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Análisis Pareto (80/20) top productos</div>
        <ResponsiveContainer width="100%" height={280} key="pareto">
          <ComposedChart data={demoPareto}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis dataKey="name" tick={{ fontSize: 11, lineHeight: 1.3 }} stroke="var(--text-muted, #888)" interval={0} />
            <YAxis yAxisId="left" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" domain={[0, 100]} />
            <Tooltip content={renderTooltip} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
            <Bar dataKey="volume" fill="var(--brand-orange, #ea580c)" yAxisId="left" name="Volumen" />
            <Line type="monotone" dataKey="pct" stroke="var(--color-red, #dc2626)" strokeWidth={2.5} yAxisId="right" name="% Acumulado" dot={{ r: 3 }} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Cash runway semanal (cobros vs pagos)</div>
        <ResponsiveContainer width="100%" height={280} key="cash-runway">
          <ComposedChart data={demoCashRunway}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis dataKey="week" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
            <Bar dataKey="cobros" fill="var(--color-success, #16a34a)" name="Cobros" />
            <Bar dataKey="pagos" fill="var(--color-red, #dc2626)" name="Pagos" />
            <Line type="monotone" dataKey="cobros" stroke="var(--color-success, #16a34a)" strokeWidth={2} name="Saldo Neto" dot={false} />
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}