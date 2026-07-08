import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, ComposedChart,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from 'recharts';
import { TrendingUp, DollarSign, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { CHART_PROPS, COLORS, renderTooltip, formatUSD, demoBubble, demoGantt, demoLeadTime, demoPosHourly, demoRadar, demoFunnel, demoPareto, demoCashRunway, demoHeatmap, demoTaxLiability } from './pages/ReportsPage';
import styles from '../ReportsPage.module.css';

interface Props {
  sales: any[];
  products: any[];
}

export function ReportsLogistica({ sales, products }: Props) {
  return (
    <div className={styles.grid2}>
      <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
        <div className={styles.cardTitle}>Matriz ABC de rotación y densidad patrimonial inmovilizada</div>
        <ResponsiveContainer width="100%" height={300} key="matriz-abc">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis dataKey="x" name="Unidades Físicas" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis dataKey="y" name="Días de Inmovilización" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
            <Scatter name="Clase A" data={demoBubble.filter(d => d.group === 'Clase A')} fill="var(--color-success, #16a34a)" />
            <Scatter name="Clase B" data={demoBubble.filter(d => d.group === 'Clase B')} fill="var(--color-blue, #3b82f6)" />
            <Scatter name="Clase C" data={demoBubble.filter(d => d.group === 'Clase C')} fill="var(--color-red, #dc2626)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Gantt de transferencias inter-sucursales</div>
        <ResponsiveContainer width="100%" height={280} key="gantt-transferencias">
          <BarChart data={demoGantt} layout="vertical" barSize={22}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis type="number" name="Semanas" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis dataKey="name" type="category" width={130} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} />
            <Bar dataKey="start" fill="transparent" stackId="gantt" />
            <Bar dataKey="end" fill="var(--brand-orange, #ea580c)" stackId="gantt" name="En tránsito" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Lead-time proveedores vs costo de oportunidad</div>
        <ResponsiveContainer width="100%" height={280} key="lead-time">
          <BarChart data={demoLeadTime} layout="vertical" barSize={16}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis type="number" name="Días" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis dataKey="lot" type="category" width={80} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
            <Bar dataKey="proveedor1" fill="var(--color-blue, #3b82f6)" name="Proveedor 1" />
            <Bar dataKey="proveedor2" fill="var(--color-orange, #eb8c00)" name="Proveedor 2" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Ventas por hora en POS (últimos 7 días)</div>
        <ResponsiveContainer width="100%" height={260} key="pos-horario">
          <BarChart data={demoPosHourly} barSize={20}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis dataKey="hour" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} />
            <Bar dataKey="sales" fill="var(--brand-orange, #ea580c)" name="Ventas ($)" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}