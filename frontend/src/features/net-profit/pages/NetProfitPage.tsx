import { useState, useEffect, useMemo } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { TabNav } from '@shared/ui/TabNav';
import { SkeletonReports } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { formatUsd } from '@shared/lib/format/currency';
import { Filter, TrendingUp, TrendingDown, PiggyBank, Percent, Download } from 'lucide-react';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { exportToExcel } from '@shared/lib/excelHelper';
import styles from './NetProfitPage.module.css';

const MONTH_LABELS = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

function fillAllMonths(data: any[]) {
  const map: Record<string, any> = {};
  data.forEach(m => { map[m.label] = m; });
  return MONTH_LABELS.map(label => map[label] || { label, revenue: 0, cogs: 0, expenses: 0, profit: 0 });
}

export function NetProfitPage() {
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState('net-profit');
  const { config } = useTheme();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<any>(null);
  const [monthly, setMonthly] = useState<any[]>([]);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hideInactive, setHideInactive] = useState(false);

  useEffect(() => { loadData(); }, []);

  async function loadData(s?: string, e?: string) {
    setLoading(true);
    try {
      const params: any = {};
      if (s) params.startDate = s;
      if (e) params.endDate = e;
      const [profitData, monthlyData] = await Promise.all([
        api.getNetProfit(Object.keys(params).length ? params : undefined),
        api.getMonthlyProfit(),
      ]);
      setData(profitData);
      setMonthly(monthlyData);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar reporte', 'error');
    } finally {
      setLoading(false);
    }
  }

  function handleFilter() {
    loadData(startDate || undefined, endDate || undefined);
  }

  const filledMonthly = useMemo(() => fillAllMonths(monthly), [monthly]);

  const chartData = filledMonthly.map(m => ({
    label: m.label,
    Ingresos: m.revenue,
    'Egresos Totales': m.cogs + m.expenses,
    'Utilidad Neta': m.profit,
  }));

  const totals = useMemo(() => ({
    revenue: filledMonthly.reduce((s, m) => s + m.revenue, 0),
    cogs: filledMonthly.reduce((s, m) => s + m.cogs, 0),
    expenses: filledMonthly.reduce((s, m) => s + m.expenses, 0),
    profit: filledMonthly.reduce((s, m) => s + m.profit, 0),
  }), [filledMonthly]);

  const marginNet = totals.revenue > 0 ? (totals.profit / totals.revenue) * 100 : 0;

  const handleExport = () => {
    const columns = [
      { header: 'Mes', key: 'Mes' },
      { header: 'Ingresos', key: 'Ingresos' },
      { header: 'COGS', key: 'COGS' },
      { header: 'Gastos Operativos', key: 'Gastos' },
      { header: 'Utilidad Neta', key: 'Utilidad' },
      { header: 'Margen %', key: 'Margen' },
    ];
    const data = filledMonthly.map(m => ({
      Mes: m.label,
      Ingresos: m.revenue,
      COGS: m.cogs,
      Gastos: m.expenses,
      Utilidad: m.profit,
      Margen: m.revenue > 0 ? Math.round((m.profit / m.revenue) * 10000) / 100 : 0,
    }));
    data.push({
      Mes: 'Total Anual',
      Ingresos: totals.revenue,
      COGS: totals.cogs,
      Gastos: totals.expenses,
      Utilidad: totals.profit,
      Margen: marginNet.toFixed(1),
    });
    exportToExcel(data, columns, 'reporte_utilidad_neta_mensual', 'xlsx');
  };

  if (loading) return config.skeletonEnabled ? <SkeletonReports chartCount={2} /> : <LoadingDots text="Calculando utilidad..." />;

  if (!data) return null;

  return (
    <div className={styles.container}>
      <TabNav
        tabs={[
          { key: 'net-profit', label: 'Utilidad Neta', icon: <PiggyBank size={16} /> },
        ]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <KpiGrid
        items={[
          { icon: <TrendingUp size={18} />, value: usdFormatter(totals.revenue), label: 'Ingresos Totales', color: '#3b82f6' },
          { icon: <TrendingDown size={18} />, value: usdFormatter(totals.cogs + totals.expenses), label: 'Egresos Totales (COGS+Gastos)', color: '#6b7280' },
          { icon: <PiggyBank size={18} />, value: usdFormatter(totals.profit), label: 'Utilidad Neta Anual', color: totals.profit >= 0 ? '#10b981' : '#dc2626' },
          { icon: <Percent size={18} />, value: marginNet.toFixed(1) + '%', label: 'Margen Neto Promedio', color: '#f05a28' },
        ]}
      />

      <Toolbar>
        <div className={styles.toolbarInner}>
          <div className={styles.filterGroup}>
            <span className={styles.filterLabel}>Año:</span>
            <select className={styles.yearSelect} value={new Date().getFullYear()} onChange={() => {}}>
              <option value={2026}>2026</option>
              <option value={2025}>2025</option>
            </select>
          </div>
          <span className={styles.filterLabel}>Desde:</span>
          <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={styles.dateInput} />
          <span className={styles.filterLabel}>Hasta:</span>
          <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={styles.dateInput} />
          <button onClick={handleFilter} className={styles.filterBtn}>
            <Filter size={14} /> Filtrar
          </button>
          <button onClick={() => setHideInactive(v => !v)} className={hideInactive ? styles.toggleBtnActive : styles.toggleBtn}>
            {hideInactive ? 'Mostrar Todos' : 'Filtrar Activos'}
          </button>
        </div>
      </Toolbar>

      <div className={styles.chartCard}>
        <div className={styles.chartHeader}>
          <span className={styles.chartTitle}>Curva Analítica de Márgenes Operativos</span>
          <p className={styles.chartSub}>Comparativa de flujos de caja y rentabilidad real por mes.</p>
        </div>
        <div className={styles.chartBox}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <CartesianGrid stroke="var(--border-color, #2d2d2d)" strokeDasharray="3 3" />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-muted, #888)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-muted, #888)', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v: number) => formatUsd(v)} />
              <Tooltip
                contentStyle={{ backgroundColor: 'var(--bg-card, #1e1e1e)', border: '1px solid var(--border-color, #2d2d2d)', borderRadius: 0, fontSize: 12 }}
                labelStyle={{ color: 'var(--text-dark, #f5f5f5)' }}
                formatter={(val: any) => [formatUsd(Number(val))]}
              />
              <Legend wrapperStyle={{ fontSize: 11, color: 'var(--text-muted, #888)' }} />
              <Line type="monotone" dataKey="Ingresos" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3, fill: '#3b82f6' }} />
              <Line type="monotone" dataKey="Egresos Totales" stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 4" dot={{ r: 2, fill: '#6b7280' }} />
              <Line type="monotone" dataKey="Utilidad Neta" stroke="#10b981" strokeWidth={2.5} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className={styles.chartCard}>
        <div className={styles.tableWrapper}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontWeight: 600, fontSize: 14 }}>Detalle Mensual</span>
            <button className={styles.exportBtn} onClick={handleExport} title="Exportar a Excel"><Download size={14} /></button>
          </div>
          <table className={styles.table}>
            <thead>
              <tr>
                <th className={styles.thLeft}>Mes</th>
                <th className={styles.thRight}>Ingresos</th>
                <th className={styles.thRight}>COGS (Costo Venta)</th>
                <th className={styles.thRight}>Gastos Operativos</th>
                <th className={styles.thRight}>Utilidad Neta</th>
                <th className={styles.thRight}>Margen Neto</th>
              </tr>
            </thead>
            <tbody>
              {filledMonthly.map(m => {
                const hasData = m.revenue > 0 || m.cogs > 0 || m.expenses > 0 || m.profit !== 0;
                if (hideInactive && !hasData) return null;
                const marginPct = m.revenue > 0 ? (m.profit / m.revenue) * 100 : 0;
                const isActive = hasData;
                return (
                  <tr key={m.label} className={isActive ? styles.rowActive : styles.rowInactive}>
                    <td className={styles.cellMonth}>{m.label}</td>
                    <td className={styles.cellNumber}>{usdFormatter(m.revenue)}</td>
                    <td className={styles.cellNumberMuted}>{usdFormatter(m.cogs)}</td>
                    <td className={styles.cellNumberMuted}>{usdFormatter(m.expenses)}</td>
                    <td className={styles.cellNumber}>
                      <span style={{ color: m.profit >= 0 ? 'var(--color-success, #10b981)' : 'var(--color-danger, #dc2626)', fontWeight: 700 }}>
                        {usdFormatter(m.profit)}
                      </span>
                    </td>
                    <td className={styles.cellNumber}>
                      <span style={{ color: marginPct >= 0 ? '#34d399' : '#f87171', fontWeight: 600 }}>
                        {marginPct.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className={styles.tableFoot}>
              <tr>
                <td className={styles.footLabel}>Total Anual</td>
                <td className={styles.footNumber}>{usdFormatter(totals.revenue)}</td>
                <td className={styles.footNumberMuted}>{usdFormatter(totals.cogs)}</td>
                <td className={styles.footNumberMuted}>{usdFormatter(totals.expenses)}</td>
                <td className={styles.footNumber}>
                  <span style={{ color: totals.profit >= 0 ? 'var(--color-success, #10b981)' : 'var(--color-danger, #dc2626)', fontWeight: 800 }}>
                    {usdFormatter(totals.profit)}
                  </span>
                </td>
                <td className={styles.footNumber} style={{ color: '#f05a28' }}>{marginNet.toFixed(1)}%</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>
    </div>
  );
}
