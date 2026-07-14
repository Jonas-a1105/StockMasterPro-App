// src/features/admin/pages/SuperAdminDashboard/SuperAdminDashboard.tsx
import { useState, useEffect, useCallback } from 'react';
import {
  AlertTriangle,
  RotateCcw,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Users,
  BarChart2,
  Activity,
} from 'lucide-react';
import { api } from '@shared/lib/http/client';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import {
  Stack,
  Grid,
  Card,
  Text,
  Button,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableHeaderCell,
  TableCell
} from '@shared/ui';
import { Skeleton } from '@shared/ui/Skeleton';
import styles from './SuperAdminDashboard.module.css';

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

  useEffect(() => {
    fetchMetrics();
  }, [fetchMetrics]);

  if (loading) {
    return <SkeletonDashboard />;
  }

  if (error) {
    return (
      <Stack className="itemsCenter justifyCenter p10 gap2 textDanger">
        <AlertTriangle size={24} />
        <Text variant="h3">{error}</Text>
      </Stack>
    );
  }

  const planColors = { free: '#6b7280', pro: '#3b82f6', enterprise: '#8b5cf6' };
  const plans = ['free', 'pro', 'enterprise'] as const;
  const planLabels = { free: 'Free', pro: 'Pro', enterprise: 'Enterprise' };

  return (
    <Stack className={styles.container} gap="4">
      <Stack direction="row" className="justifyBetween itemsCenter flexWrap gap3">
        <Stack direction="row" className="itemsCenter gap2">
          <BarChart2 size={24} className="textPrimary" />
          <Text variant="h1" className="fontWeightBold">Super-Admin SaaS Metrics</Text>
        </Stack>
        <Button variant="secondary" onClick={fetchMetrics} disabled={loading} className="flex itemsCenter gap1">
          <RotateCcw size={16} className={loading ? "animateSpin" : ""} />
          <Text>Actualizar</Text>
        </Button>
      </Stack>

      <Grid className={styles.kpiGrid}>
        <KPICard
          icon={<DollarSign size={24} />}
          label="MRR"
          value={formatPrice(mrr?.mrr || 0)}
          borderClass={styles.borderLeftInfo}
          valueClass="textInfo"
          trend={mrr?.growth?.growthRate}
        />
        <KPICard
          icon={<Activity size={24} />}
          label="ARR"
          value={formatPrice(mrr?.arr || 0)}
          borderClass={styles.borderLeftPrimary}
          valueClass="textPrimary"
        />
        <KPICard
          icon={<Users size={24} />}
          label="Suscripciones"
          value={mrr?.activeSubscriptions || 0}
          borderClass={styles.borderLeftSuccess}
          valueClass="textSuccess"
        />
        <KPICard
          icon={<RotateCcw size={24} />}
          label="Churn"
          value={`${(churn?.churnRate || 0).toFixed(2)}%`}
          borderClass={styles.borderLeftDanger}
          valueClass="textDanger"
          trend={-churn?.churnRate}
        />
        <KPICard
          icon={<TrendingUp size={24} />}
          label="LTV"
          value={formatPrice(ltv?.ltv || 0)}
          borderClass={styles.borderLeftWarning}
          valueClass="textWarning"
        />
        <KPICard
          icon={<BarChart2 size={24} />}
          label="ARPU"
          value={formatPrice(ltv?.averageRevenuePerUser || 0)}
          borderClass={styles.borderLeftInfo}
          valueClass="textInfo"
        />
      </Grid>

      <Grid className={styles.chartsGrid}>
        <Card>
          <Stack className="p4 borderBottom" direction="row" className="itemsCenter gap2">
            <BarChart2 size={18} className="textMuted" />
            <Text variant="h3" className="fontWeightSemiBold">MRR por Plan</Text>
          </Stack>
          <Stack className="p5 gap3">
            {plans.map((plan) => (
              <PlanBarRow
                key={plan}
                label={planLabels[plan]}
                value={mrr?.byPlan?.[plan]?.mrr || 0}
                max={mrr?.mrr || 1}
                color={planColors[plan]}
              />
            ))}
          </Stack>
        </Card>

        <Card>
          <Stack className="p4 borderBottom" direction="row" className="itemsCenter gap2">
            <TrendingDown size={18} className="textMuted" />
            <Text variant="h3" className="fontWeightSemiBold">Churn por Plan</Text>
          </Stack>
          <Stack className="p5 gap3">
            {plans.map((plan) => (
              <PlanBarRow
                key={plan}
                label={planLabels[plan]}
                value={churn?.byPlan?.[plan]?.rate || 0}
                max={Math.max(...Object.values(churn?.byPlan || {}).map((p: any) => p.rate), 10)}
                color={planColors[plan]}
                suffix="%"
              />
            ))}
          </Stack>
        </Card>

        <Card>
          <Stack className="p4 borderBottom" direction="row" className="itemsCenter gap2">
            <Activity size={18} className="textMuted" />
            <Text variant="h3" className="fontWeightSemiBold">LTV por Plan</Text>
          </Stack>
          <Stack className="p5 gap3">
            {plans.map((plan) => (
              <PlanBarRow
                key={plan}
                label={planLabels[plan]}
                value={ltv?.byPlan?.[plan]?.ltv || 0}
                max={Math.max(...Object.values(ltv?.byPlan || {}).map((p: any) => p.ltv), 1)}
                color={planColors[plan]}
              />
            ))}
          </Stack>
        </Card>

        <Card className={styles.fullWidth}>
          <Stack className="p4 borderBottom" direction="row" className="itemsCenter gap2">
            <BarChart2 size={18} className="textMuted" />
            <Text variant="h3" className="fontWeightSemiBold">Cohortes de Retención</Text>
          </Stack>
          <Stack className="p5">
            <Stack className={styles.tableResponsive}>
              <CohortTable cohorts={cohorts} />
            </Stack>
          </Stack>
        </Card>
      </Grid>
    </Stack>
  );
}

function KPICard({ icon, label, value, borderClass, valueClass, trend }: any) {
  return (
    <Card className={`p5 flex flexCol gap2 ${borderClass}`}>
      <Stack direction="row" className="justifyBetween itemsCenter">
        <Text className="textMuted fontSizeSm fontWeightMedium uppercase trackingWider">{label}</Text>
        <Stack className="textMuted">{icon}</Stack>
      </Stack>
      <Text variant="h1" className={`fontWeightBold ${valueClass}`}>{value}</Text>
      {trend !== undefined && (
        <Stack direction="row" className="itemsCenter gap1 fontSizeCaption fontWeightMedium">
          {trend >= 0 ? (
            <Stack direction="row" className="itemsCenter gap1 textSuccess">
              <TrendingUp size={12} />
              <Text>+{trend.toFixed(1)}%</Text>
            </Stack>
          ) : (
            <Stack direction="row" className="itemsCenter gap1 textDanger">
              <TrendingDown size={12} />
              <Text>{trend.toFixed(1)}%</Text>
            </Stack>
          )}
        </Stack>
      )}
    </Card>
  );
}

function PlanBarRow({ label, value, max, color, suffix = '' }: any) {
  const percentage = max > 0 ? Math.min((value / max) * 100, 100) : 0;
  return (
    <Stack direction="row" className="itemsCenter gap3">
      <Text className="fontWeightSemiBold fontSizeSm uppercase trackingWider w100">▸ {label}</Text>
      <Stack className={styles.barContainer}>
        <Stack
          className={styles.barFill}
          style={{ '--bar-width': `${percentage}%`, '--bar-bg': color } as React.CSSProperties}
        />
      </Stack>
      <Text className="fontWeightSemiBold fontSizeSm fontMonospace textRight w100">
        {value.toLocaleString()}
        {suffix}
      </Text>
    </Stack>
  );
}

function CohortTable({ cohorts }: any) {
  if (!cohorts?.length) {
    return <Text className="textMuted p5 textCenter styleItalic">No hay datos de cohortes disponibles</Text>;
  }
  const maxMonths = Math.max(
    ...cohorts.map((c: any) => Math.max(...Object.keys(c.retention).map(Number)))
  );
  return (
    <Table>
      <TableHead>
        <TableRow>
          <TableHeaderCell className="textLeft">Cohorte</TableHeaderCell>
          <TableHeaderCell>Iniciales</TableHeaderCell>
          {Array.from({ length: maxMonths + 1 }, (_, i) => (
            <TableHeaderCell key={i}>{i === 0 ? 'M0' : `M${i}`}</TableHeaderCell>
          ))}
        </TableRow>
      </TableHead>
      <TableBody>
        {cohorts.map((cohort: any) => (
          <TableRow key={cohort.month}>
            <TableCell className="fontWeightSemiBold textLeft">{cohort.month}</TableCell>
            <TableCell className="fontWeightSemiBold textPrimary textCenter">{cohort.initialSubscribers}</TableCell>
            {Array.from({ length: maxMonths + 1 }, (_, i) => (
              <TableCell
                key={i}
                className={`textCenter ${cohort.retention[i] !== undefined ? "fontWeightMedium" : "textMuted"}`}
              >
                {cohort.retention[i] !== undefined ? `${cohort.retention[i]}%` : '—'}
              </TableCell>
            ))}
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function SkeletonDashboard() {
  return (
    <Stack className={styles.container} gap="4">
      <Stack direction="row" className="justifyBetween itemsCenter p2">
        <Skeleton height={28} width={300} />
        <Skeleton height={36} width={120} />
      </Stack>
      <Grid className={styles.kpiGrid}>
        {[...Array(6)].map((_, i) => (
          <Skeleton key={i} height={100} width="100%" />
        ))}
      </Grid>
      <Grid className={styles.chartsGrid}>
        {[...Array(3)].map((_, i) => (
          <Card key={i}>
            <Skeleton height={48} width={100} />
            <Skeleton height={200} width="100%" />
          </Card>
        ))}
        <Card className={styles.fullWidth}>
          <Skeleton height={48} width={100} />
          <Skeleton height={400} width="100%" />
        </Card>
      </Grid>
    </Stack>
  );
}