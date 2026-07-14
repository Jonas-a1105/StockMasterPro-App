import { type ReactNode, useState } from 'react';
import { LottieIcon } from '@shared/ui/LottieIcon';
import styles from './KpiGrid.module.css';

export interface KpiItem {
  icon?: ReactNode;
  value: string | number;
  label: string;
  color?: string;
  lottie?: Record<string, unknown>;
}

interface KpiGridProps {
  items: KpiItem[];
}

export function KpiGrid({ items }: KpiGridProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  if (!items || items.length === 0) return null;

  return (
    <div className={styles.wrapper}>
      <div className={styles.container}>
        {items.map((item, i) => {
          const isHovered = hoveredIdx === i;
          return (
            <div
              key={i}
              className={`${styles.card} kpi-card`}
              style={
                item.color ? ({ '--kpi-color': item.color } as React.CSSProperties) : undefined
              }
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              <div className={styles.iconWrapper}>
                {item.lottie ? (
                  <LottieIcon data={item.lottie} size={22} play={isHovered} />
                ) : item.icon ? (
                  item.icon
                ) : null}
              </div>
              <div className={styles.content}>
                {typeof item.value === 'string' && item.value.includes(' · ') ? (
                  <>
                    <span className={styles.kpiValue}>{item.value.split(' · ')[0]}</span>
                    <span className={styles.kpiSubValue}>{item.value.split(' · ')[1]}</span>
                  </>
                ) : (
                  <span className={styles.kpiValue}>{item.value}</span>
                )}
                <span className={styles.kpiLabel}>{item.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
