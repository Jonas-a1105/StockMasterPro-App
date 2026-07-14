import styles from './Skeleton.module.css';

interface SkeletonProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  variant?: 'text' | 'rect' | 'circle';
  count?: number;
}

export function Skeleton({
  width = '100%',
  height = 16,
  borderRadius,
  className = '',
  variant = 'rect',
  count = 1,
}: SkeletonProps) {
  const resolvedRadius =
    borderRadius ??
    (variant === 'circle' ? '50%' : variant === 'text' ? '4px' : 'var(--card-radius, 4px)');

  const style = {
    '--sk-w': typeof width === 'number' ? `${width}px` : width,
    '--sk-h': typeof height === 'number' ? `${height}px` : height,
    '--sk-rad': typeof resolvedRadius === 'number' ? `${resolvedRadius}px` : resolvedRadius,
  } as React.CSSProperties;

  if (count <= 1) {
    return <div className={`${styles.skeleton} ${className}`} style={style} />;
  }

  return (
    <div className={styles.skeletonGroup}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${styles.skeleton} ${styles.animDelay} ${className}`}
          style={{ ...style, '--sk-delay': `${i * 0.08}s` } as React.CSSProperties}
        />
      ))}
    </div>
  );
}

/* Pre-built skeleton layouts for common patterns */
export function SkeletonTable({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className={styles.skeletonTable}>
      {/* Header */}
      <div className={styles.skeletonTableRow}>
        {Array.from({ length: cols }).map((_, i) => (
          <Skeleton key={`h-${i}`} height={14} width="80%" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, r) => (
        <div
          key={`r-${r}`}
          className={`${styles.skeletonTableRow} ${styles.animDelay}`}
          style={{ '--sk-delay': `${r * 0.06}s` } as React.CSSProperties}
        >
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={`c-${c}`} height={12} width={`${55 + Math.random() * 35}%`} />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonCards({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.skeletonCards}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${styles.skeletonCard} ${styles.animDelay}`}
          style={{ '--sk-delay': `${i * 0.1}s` } as React.CSSProperties}
        >
          <div className={styles.skeletonCardHeader}>
            <div className={styles.skeletonFlex}>
              <Skeleton height={14} width="70%" />
              <Skeleton height={10} width="40%" />
            </div>
            <Skeleton variant="circle" width={40} height={40} />
          </div>
          <div className={styles.skeletonCardBody}>
            <Skeleton height={10} width="30%" />
            <Skeleton height={16} width="50%" />
            <Skeleton height={10} width="30%" />
            <Skeleton height={16} width="50%" />
          </div>
          <div className={styles.skeletonCardFooter}>
            <Skeleton height={18} width="35%" borderRadius={12} />
            <div className={styles.skeletonFlexCenter2}>
              <Skeleton variant="circle" width={28} height={28} />
              <Skeleton variant="circle" width={28} height={28} />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonKPI({ count = 4 }: { count?: number }) {
  return (
    <div className={styles.skeletonKPI}>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`${styles.skeletonKPICard} ${styles.animDelay}`}
          style={{ '--sk-delay': `${i * 0.08}s` } as React.CSSProperties}
        >
          <div className={styles.skeletonFlexCenter}>
            <Skeleton variant="circle" width={36} height={36} />
            <div className={styles.skeletonFlex}>
              <Skeleton height={10} width="50%" />
              <Skeleton height={20} width="70%" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonChart({ height = 250 }: { height?: number }) {
  return (
    <div
      className={`${styles.skeletonChart} ${styles.chartCustom}`}
      style={{ '--sk-chart-h': height } as React.CSSProperties}
    >
      <div className={styles.skeletonChartBars}>
        {Array.from({ length: 7 }).map((_, i) => (
          <div
            key={i}
            className={`${styles.skeletonChartBar} ${styles.barCustom}`}
            style={
              {
                '--sk-bar-h': `${30 + Math.random() * 60}%`,
                '--sk-bar-delay': `${i * 0.1}s`,
              } as React.CSSProperties
            }
          />
        ))}
      </div>
    </div>
  );
}

/* === Page-level skeleton presets === */

export function SkeletonTablePage({
  rows = 5,
  cols = 6,
  tabs = 1,
  kpi = 3,
}: {
  rows?: number;
  cols?: number;
  tabs?: number;
  kpi?: number;
}) {
  return (
    <div className={styles.skeletonPage}>
      {tabs > 0 && (
        <div className={styles.skeletonPageTabs}>
          {Array.from({ length: tabs }).map((_, i) => (
            <div key={`tab-${i}`} className={styles.skeletonPageTab}>
              <Skeleton height={32} width={100} borderRadius={6} />
            </div>
          ))}
        </div>
      )}
      {kpi > 0 && <SkeletonKPI count={kpi} />}
      <div className={styles.skeletonPageToolbar}>
        <Skeleton height={36} width={240} borderRadius={6} />
        <div className={styles.skeletonFlexRow}>
          <Skeleton height={36} width={36} borderRadius={6} variant="circle" />
          <Skeleton height={36} width={120} borderRadius={6} />
        </div>
      </div>
      <SkeletonTable rows={rows} cols={cols} />
    </div>
  );
}

export function SkeletonReports({ chartCount = 2 }: { chartCount?: number }) {
  return (
    <div className={styles.skeletonPage}>
      <div className={styles.skeletonGrid2}>
        {Array.from({ length: chartCount }).map((_, i) => (
          <div key={i} className={styles.skeletonCard}>
            <Skeleton height={16} width="60%" borderRadius={4} />
            <SkeletonChart height={260} />
          </div>
        ))}
      </div>
      <div className={styles.skeletonCard}>
        <Skeleton height={16} width="50%" borderRadius={4} />
        <Skeleton height={14} width="100%" />
        <SkeletonTable rows={4} cols={4} />
      </div>
    </div>
  );
}

export function SkeletonPOSLayout() {
  return (
    <div className={styles.skeletonPOS}>
      <div className={styles.skeletonPOSProducts}>
        <Skeleton height={40} width="100%" borderRadius={6} />
        <div className={styles.skeletonPOSGrid}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className={styles.skeletonPOSCard}>
              <Skeleton height={36} width="80%" />
              <Skeleton height={16} width="50%" />
              <Skeleton height={12} width="30%" />
            </div>
          ))}
        </div>
      </div>
      <div className={styles.skeletonPOSCart}>
        <Skeleton height={40} width="100%" borderRadius={6} />
        <Skeleton height={32} width="100%" borderRadius={6} />
        <div className={styles.skeletonPOSCartItems}>
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className={styles.skeletonPOSCartItem}>
              <Skeleton height={14} width="60%" />
              <Skeleton height={14} width="30%" />
            </div>
          ))}
        </div>
        <Skeleton height={100} width="100%" borderRadius={6} />
        <Skeleton height={44} width="100%" borderRadius={6} />
      </div>
    </div>
  );
}

export function SkeletonForm({ fields = 4 }: { fields?: number }) {
  return (
    <div className={styles.skeletonForm}>
      <Skeleton height={28} width={200} borderRadius={4} />
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className={styles.skeletonFormField}>
          <Skeleton height={12} width={80} borderRadius={4} />
          <Skeleton height={36} width="100%" borderRadius={6} />
        </div>
      ))}
      <div className={styles.skeletonFormActions}>
        <Skeleton height={36} width={100} borderRadius={6} />
        <Skeleton height={36} width={120} borderRadius={6} />
      </div>
    </div>
  );
}
