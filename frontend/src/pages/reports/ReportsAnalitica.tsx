import { useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, ScatterChart, Scatter, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  FunnelChart, Funnel, Tooltip, ResponsiveContainer, Legend, ComposedChart, XAxis, YAxis, CartesianGrid, Bar, Line, Cell
} from 'recharts';
import { TrendingUp, DollarSign, Package, AlertTriangle, BarChart3 } from 'lucide-react';
import { CHART_PROPS, COLORS, renderTooltip, formatUSD, demoHeatmap, demoTaxLiability } from '../ReportsPage';
import styles from '../ReportsPage.module.css';

interface Props {
  sales: any[];
  products: any[];
}

export function ReportsAnalitica({ sales, products }: Props) {
  return (
    <div className={styles.grid2}>
      <div className={styles.card} style={{ gridColumn: '1 / -1' }}>
        <div className={styles.cardTitle}>Heatmap de anomalías operativas (semana × hora)</div>
        <ResponsiveContainer width="100%" height={300} key="heatmap-anomalias">
          <ResponsiveContainer width="100%" height={300}>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
              <div style={{ width: '100%', maxWidth: 600 }}>
                <svg viewBox="0 0 600 300" style={{ width: '100%', height: '100%' }}>
                  {demoHeatmap.map((d, i) => {
                    const x = (d.hour / 24) * 560 + 20;
                    const y = (d.day / 8) * 260 + 20;
                    return (
                      <circle
                        key={i}
                        cx={x}
                        cy={y}
                        r={d.severity === 'anomaly' ? 10 : 6}
                        fill={d.severity === 'anomaly' ? 'var(--color-red, #dc2626)' : 'var(--color-success, #16a34a)'}
                        opacity={0.8}
                      />
                    );
                  })}
                </svg>
              </div>
            </div>
          </ResponsiveContainer>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Pass-through fiscal por sucursal (débito vs crédito)</div>
        <ResponsiveContainer width="100%" height={280} key="pass-through-fiscal">
          <BarChart data={demoTaxLiability} layout="vertical" barSize={18}>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis type="number" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis dataKey="name" type="category" width={110} tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} />
            <Legend iconType="rect" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
            <Bar dataKey="debit" fill="var(--color-blue, #3b82f6)" name="Débito" />
            <Bar dataKey="credit" fill="var(--color-success, #16a34a)" name="Crédito" />
            <Bar dataKey="net" fill="var(--brand-orange, #ea580c)" name="Neto" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className={styles.card}>
        <div className={styles.cardTitle}>Correlación spread cambiario vs merma de inventario</div>
        <ResponsiveContainer width="100%" height={280} key="correlacion-spread-merma">
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="var(--border-color, #2d2d2d)" />
            <XAxis dataKey="volume" name="Spread Promedio" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <YAxis dataKey="rate" name="% Merma" tick={{ fontSize: 11 }} stroke="var(--text-muted, #888)" />
            <Tooltip content={renderTooltip} cursor={{ strokeDasharray: '3 3' }} />
            <Legend iconType="circle" wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
            <Scatter name="Sucursales" data={demoHeatmap.filter(d => d.severity === 'anomaly').map((d, i) => ({ volume: d.hour, rate: d.day * 5 }))} fill="var(--color-red, #dc2626)" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}