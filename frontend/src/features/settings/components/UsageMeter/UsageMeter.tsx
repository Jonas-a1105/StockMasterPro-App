import { useEffect, useState } from 'react';
import { api } from '@shared/lib/http/client';
import { getPlanLimits, type PlanTier } from '@shared/lib/plan-features';
import { Skeleton } from '@shared/ui/Skeleton';
import { useAuth } from '@contexts/AuthContext';
import styles from './UsageMeter.module.css';

interface UsageData {
  planType: string;
  products: { current: number; limit: number | null };
  users: { current: number; limit: number | null };
  warehouses: { current: number; limit: number | null };
  salesThisMonth: number;
  customers: number | { current: number; limit: number | null };
  storageUsage: { estimateMB: number };
}

function UsageBar({
  label,
  current,
  limit,
  unit,
}: {
  label: string;
  current: number;
  limit: number | null;
  unit?: string;
}) {
  const pct = limit ? Math.min((current / limit) * 100, 100) : Math.min(current * 2, 95);
  const isNearLimit = limit && current >= limit * 0.8;
  const isAtLimit = limit && current >= limit;
  return (
    <div className={styles.barRow}>
      <div className={styles.barLabel}>
        <span>{label}</span>
        <span className={styles.barCount}>
          {current}
          {limit ? ` / ${limit}` : ''} {unit || ''}
        </span>
      </div>
      <div className={styles.barTrack}>
        <div
          className={`${styles.barFill} ${isAtLimit ? styles.danger : isNearLimit ? styles.warning : ''}`}
          style={{ '--bar-fill-pct': `${pct}%` } as React.CSSProperties}
        />
      </div>
    </div>
  );
}

export function UsageMeter() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [data, setData] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isAuthenticated || authLoading) return;
    api
      .getLicenseUsage()
      .then(setData)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [isAuthenticated, authLoading]);

  if (loading) {
    return (
      <div className={styles.card}>
        <div className={styles.header}>
          <Skeleton height={14} width="40%" />
          <Skeleton height={14} width="20%" />
        </div>
        <div className={`${styles.bars} ${styles.barsLoading}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`${styles.barRow} ${styles.barRowLoading}`}>
              <div className={styles.barRowLoadingHeader}>
                <Skeleton height={10} width="35%" />
                <Skeleton height={10} width="15%" />
              </div>
              <Skeleton height={6} width="100%" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  const limits = getPlanLimits(data.planType as PlanTier);

  return (
    <div className={styles.card}>
      <div className={styles.header}>
        <span className={styles.title}>Medidor de uso</span>
        <span className={styles.badge}>
          {data.planType.charAt(0).toUpperCase() + data.planType.slice(1).toLowerCase()}
        </span>
      </div>
      <div className={styles.bars}>
        <UsageBar
          label="Productos"
          current={data.products.current}
          limit={limits.maxProducts ?? data.products.limit ?? (undefined as any)}
        />
        <UsageBar
          label="Usuarios"
          current={data.users.current}
          limit={limits.maxUsers ?? data.users.limit ?? (undefined as any)}
        />
        <UsageBar
          label="Almacenes"
          current={data.warehouses.current}
          limit={limits.maxWarehouses ?? data.warehouses.limit ?? (undefined as any)}
        />
        <UsageBar
          label="Ventas este mes"
          current={data.salesThisMonth}
          limit={null}
          unit="ventas"
        />
        <UsageBar
          label="Clientes registrados"
          current={typeof data.customers === 'object' ? data.customers.current : data.customers}
          limit={typeof data.customers === 'object' ? data.customers.limit : null}
        />
        <UsageBar
          label="Almacenamiento"
          current={data.storageUsage.estimateMB}
          limit={data.planType === 'free' ? 10 : data.planType === 'pro' ? 50 : 200}
          unit="MB"
        />
      </div>
    </div>
  );
}