import { LottieIcon } from '@shared/ui/LottieIcon';
import { useState } from 'react';
import styles from '../pages/DashboardPage.module.css';

export function KpiRow({
  kpis,
}: {
  kpis: { key: string; cls: string; icon: any; title: string; value: any }[];
}) {
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);

  return (
    <div className={styles.kpiContainer} onMouseLeave={() => setHoveredKpi(null)}>
      {kpis.map((k) => (
        <div
          key={k.key}
          className={`${styles.kpiCard} ${k.cls}`}
          onMouseEnter={() => setHoveredKpi(k.key)}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <div className={styles.kpiIconBox}>
            <LottieIcon data={k.icon} size={22} play={hoveredKpi === k.key} />
          </div>
          <div className={styles.kpiInfo}>
            <div className={styles.kpiTitle}>{k.title}</div>
            <div className={styles.kpiValue}>
              {typeof k.value === 'string' && k.value.includes(' · ') ? (
                <>
                  <span>{k.value.split(' · ')[0]}</span>
                  <span className={styles.kpiSubValue}>{k.value.split(' · ')[1]}</span>
                </>
              ) : (
                k.value
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
