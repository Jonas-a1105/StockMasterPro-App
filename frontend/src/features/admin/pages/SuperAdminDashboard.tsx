import { useState, useEffect, useCallback } from 'react';
import { AlertTriangle, RotateCcw, DollarSign, TrendingUp, TrendingDown, Users, BarChart2, Activity } from 'lucide-react';
import { api } from '@shared/lib/http/client';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { Skeleton } from '@shared/ui/Skeleton';
import styles from './SuperAdminDashboard.module.css';

interface MRRMetrics {
  mrr: number;
  arr: number;
  activeSubscriptions: number;
  byPlan: Record<string, { count: number; mrr: number }>;
  growth: { currentMonth: number; previousMonth: number; growthRate: number };
}

interface ChurnMetrics {
  churnRate: number;
  revenueChurnRate: number;
  cancelledThisMonth: number;
  cancelledLastMonth: number;
  byPlan: Record<string, { count: number; rate: number }>;
}

interface LTVMetrics {
  ltv: number;
  averageRevenuePerUser: number;
  averageLifespanMonths: number;
  byPlan: Record<string, { ltv: number; avgRevenue: number; lifespanMonths: number }>;
}

interface CohortMetrics {
  month: string;
  initialSubscribers: number;
  retention: Record<number, number>;
  revenue: Record<number, number>;
}

export function SuperAdminDashboard() {
  const { config } = useTheme();
  const { formatPrice } = useExchangeRate();
  const [mrr, setMrr] = useState<any>(null);
  const [churn, setChurn] = useState<any>(null);
  const [ltv, setLtv] = useState<any>(null);
  const [cohorts, setCohorts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchMetrics = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [mrrRes, churnRes, ltvRes, cohortsRes] = await Promise.all([
        api.get('/saas-metrics/mrr'),
        api.get('/saas-metrics/churn'),
        api.get('/saas-metrics/ltv'),
        api.get('/saas-metrics/cohorts?months=12'),
      ]);
      setMrr(mrrRes);
      setChurn(churnRes);
      setLtv(ltvRes);
      setCohorts(cohortsRes);
    } catch (err: any) {
      setError(err.message || 'Error al cargar métricas');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMetrics(); }, [fetchMetrics]);

  if (loading) {
    return config.skeletonEnabled ? <SkeletonDashboard /> : <LoadingDots text="Cargando métricas SaaS..." />;
  }

  if (error) return <div className={styles.error}><AlertTriangle size={24} /> {error}</div>;

  const planColors = { free: '#6b7280', pro: '#3b82f6', enterprise: '#8b5cf6' };
  const plans = ['free', 'pro', 'enterprise'] as const;
  const planLabels = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };

  return (
    <div className={styles.container}>
      <header className={styles.header}>
        <h1><BarChart2 size={24} /> Super-Admin SaaS Metrics</h1>
        <button className={styles.refreshBtn} onClick={fetchMetrics} disabled={loading}>
          <RotateCcw size={16} className={loading ? 'animate-spin' : ''} /> Actualizar
        </button>
      </header>

      <div className={styles.kpiGrid}>
        <KPICard
          icon={<DollarSign size={24} />}
          label="MRR"
          value={formatPrice(mrr?.mrr || 0)}
          color="#3b82f6"
          trend={mrr?.growth?.growthRate}
        />
        <KPICard
          icon={<Activity size={24} />}
          label="ARR"
          value={formatPrice(mrr?.arr || 0)}
          color="#8b5cf6"
        />
        <KPICard
          icon={<Users size={24} />}
          label="Suscripciones"
          value={mrr?.activeSubscriptions || 0}
          color="#10b981"
        />
        <KPICard
          icon={<RotateCcw size={24} />}
          label="Churn"
          value={`${(churn?.churnRate || 0).toFixed(2)}%`}
          color="#ef4444"
          trend={-churn?.churnRate}
        />
        <KPICard
          icon={<TrendingUp size={24} />}
          label="LTV"
          value={formatPrice(ltv?.ltv || 0)}
          color="#f59e0b"
        />
        <KPICard
          icon={<BarChart2 size={24} />}
          label="ARPU"
          value={formatPrice(ltv?.averageRevenuePerUser || 0)}
          color="#06b6d4"
        />
      </div>

      <div className={styles.chartsGrid}>
        <Card title={<><BarChart2 size={18} /> MRR por Plan</>} fullWidth={false}>
          <CardContent>
            <ChartContainer>
              {plans.map(plan => (
                <PlanBarRow
                  key={plan}
                  label={planLabels[plan]}
                  value={mrr?.byPlan?.[plan]?.mrr || 0}
                  max={mrr?.mrr || 1}
                  color={planColors[plan]}
                />
              ))}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card title={<><TrendingDown size={18} /> Churn por Plan</>} fullWidth={false}>
          <CardContent>
            <ChartContainer>
              {plans.map(plan => (
                <PlanBarRow
                  key={plan}
                  label={planLabels[plan]}
                  value={churn?.byPlan?.[plan]?.rate || 0}
                  max={Math.max(...Object.values(churn?.byPlan || {}).map(p => p.rate), 10)}
                  color={planColors[plan]}
                  suffix="%"
                />
              ))}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card title={<><Activity size={18} /> LTV por Plan</>} fullWidth={false}>
          <CardContent>
            <ChartContainer>
              {plans.map(plan => (
                <PlanBarRow
                  key={plan}
                  label={planLabels[plan]}
                  value={ltv?.byPlan?.[plan]?.ltv || 0}
                  max={Math.max(...Object.values(ltv?.byPlan || {}).map(p => p.ltv), 1)}
                  color={planColors[plan]}
                />
              ))}
            </ChartContainer>
          </CardContent>
        </Card>

        <Card title={<><BarChart2 size={18} /> Cohortes de Retención</>} fullWidth>
          <CardContent>
            <TableResponsive>
              <CohortTable cohorts={cohorts} />
            </TableResponsive>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function KPICard({ icon, label, value, color, trend }: any) {
  const trendColor = trend > 0 ? '#16a34a' : trend < 0 ? '#ef4444' : '#6b7280';
  const borderClass = color.includes('16a34a') ? styles.borderLeftSuccess : 
                      color.includes('ef4444') ? styles.borderLeftDanger :
                      color.includes('f59e0b') ? styles.borderLeftWarning :
                      color.includes('3b82f6') ? styles.borderLeftInfo :
                      styles.borderLeftPrimary;
  return (
    <div className={`${styles.kpiCard} ${borderClass}`}>
      <div className={styles.kpiHeader}>
        <span className={styles.kpiLabel}>{label}</span>
      </div>
      <div className={`${styles.kpiValue} ${color.includes('16a34a') ? styles.textSuccess : color.includes('ef4444') ? styles.textDanger : color.includes('f59e0b') ? styles.textWarning : color.includes('3b82f6') ? styles.textInfo : styles.textPrimary}`}>{value}</div>
      {trend !== undefined && (
        <div className={`${styles.kpiTrend} ${trend > 0 ? styles.trendPositive : trend < 0 ? styles.trendNegative : styles.trendNeutral}`}>
          {trend >= 0 ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          <span>{trend >= 0 ? '+' : ''}{trend.toFixed(1)}%</span>
        </div>
      )}
    </div>
  );
}

function Card({ title, children, fullWidth }: any) {
  return (
    <div className={`${styles.card} ${fullWidth ? styles.fullWidth : ''}`}>
      <div className={styles.cardHeader}>{title}</div>
      <div className={styles.cardContent}>{children}</div>
    </div>
  );
}

function CardContent({ children }: any) {
  return <div className={styles.cardContent}>{children}</div>;
}

function ChartContainer({ children }: any) {
  return <div className={styles.chartContainer}>{children}</div>;
}

function PlanBarRow({ label, value, max, color, suffix = '' }: any) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  const colorClass = color.includes('16a34a') ? styles.textSuccess : 
                     color.includes('ef4444') ? styles.textDanger :
                     color.includes('f59e0b') ? styles.textWarning :
                     color.includes('3b82f6') ? styles.textInfo :
                     styles.textPrimary;
  return (
    <div className={styles.planBarRow}>
      <span className={`${styles.planLabel} ${colorClass}`}>▸ {label}</span>
      <div className={styles.barContainer}>
        <div className={styles.barFill} style={{ '--bar-width': `${percentage}%`, '--bar-bg': color } as React.CSSProperties}></div>
      </div>
      <span className={styles.planValue}>{value.toLocaleString()}{suffix}</span>
    </div>
  );
}

function TableResponsive({ children }: any) {
  return <div className={styles.tableResponsive}>{children}</div>;
}

function CohortTable({ cohorts }: any) {
  if (!cohorts?.length) return <EmptyState />;
  const maxMonths = Math.max(...cohorts.map(c => Math.max(...Object.keys(c.retention).map(Number))));
  return (
    <table className={styles.cohortTable}>
      <thead>
        <tr>
          <th className={styles.cohortMonth}>Cohorte</th>
          <th>Iniciales</th>
          {Array.from({ length: maxMonths + 1 }, (_, i) => (
            <th key={i}>{i === 0 ? 'M0' : `M${i}`}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {cohorts.map((cohort: any, idx: number) => (
          <tr key={cohort.month}>
            <td className={styles.cohortMonth}>{cohort.month}</td>
            <td className={styles.cohortInitial}>{cohort.initialSubscribers}</td>
            {Array.from({ length: maxMonths + 1 }, (_, i) => (
              <td key={i} className={cohort.retention[i] !== undefined ? styles.cohortCell : styles.empty}>
                {cohort.retention[i] !== undefined ? `${cohort.retention[i]}%` : <span className={styles.empty}>—</span>}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function EmptyState() {
  return <div className={styles.emptyState}>No hay datos de cohortes disponibles</div>;
}

function SkeletonDashboard() {
  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <Skeleton height={28} width={300} />
        <Skeleton />
      </div>
      <div className={styles.kpiGrid}>
        {[...Array(6)].map((_, i) => <Skeleton key={i} height={100} width="100%" />)}
      </div>
      <div className={styles.chartsGrid}>
        {[...Array(3)].map((_, i) => (
          <div key={i} className={`${styles.card} ${i === 3 ? styles.fullWidth : ''}`}>
            <Skeleton height={48} width={300} />
            <Skeleton height={200} width="100%" />
          </div>
        ))}
        <div className={`${styles.card} ${styles.fullWidth}`}>
          <Skeleton height={48} width={300} />
          <Skeleton height={400} width="100%" />
        </div>
      </div>
    </div>
  );
}

