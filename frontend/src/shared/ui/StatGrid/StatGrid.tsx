import { type ReactNode, type HTMLAttributes } from 'react';
import styles from './StatGrid.module.css';

export interface StatItem {
  label: string;
  value: string | number;
  trend?: { value: string; positive: boolean };
}

interface StatGridProps extends HTMLAttributes<HTMLDivElement> {
  items: StatItem[];
  columns?: 1 | 2 | 3 | 4;
  gap?: 'sm' | 'md' | 'lg';
}

export function StatGrid({ items, columns = 3, gap = 'md', className = '', style, ...props }: StatGridProps) {
  if (!items || items.length === 0) return null;

  return (
    <div
      className={`${styles.grid} ${className}`}
      style={{
        ...style,
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: `var(--space-${gap === 'sm' ? '2' : gap === 'md' ? '4' : '6'})`,
      }}
      {...props}
    >
      {items.map((item, i) => (
        <div key={i} className={styles.item}>
          <div className={styles.label}>{item.label}</div>
          <div className={styles.value}>{item.value}</div>
          {item.trend && (
            <div className={`${styles.trend} ${item.trend.positive ? styles.trendPositive : styles.trendNegative}`}>
              {item.trend.value}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}