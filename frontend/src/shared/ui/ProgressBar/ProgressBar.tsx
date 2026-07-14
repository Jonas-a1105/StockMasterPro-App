import { forwardRef, type HTMLAttributes } from 'react';
import styles from './ProgressBar.module.css';

export interface ProgressBarProps extends HTMLAttributes<HTMLDivElement> {
  value: number;
  max?: number;
  color?: 'success' | 'warning' | 'danger' | 'primary' | 'info';
  height?: number;
  showLabel?: boolean;
  label?: React.ReactNode;
  striped?: boolean;
  animated?: boolean;
}

export const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ value, max = 100, color = 'primary', height = 6, showLabel = false, label, striped = false, animated = false, className = '', style, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    const colorVar = `--progress-${color}`;

    const classes = [
      styles.wrapper,
      striped && styles.striped,
      animated && styles.animated,
      className,
    ].filter(Boolean).join(' ');

    return (
      <div ref={ref} className={classes} style={{ ...style, [colorVar]: `var(--color-${color})`, '--progress-height': `${height}px` }} {...props}>
        <div className={styles.track} role="progressbar" aria-valuenow={value} aria-valuemin={0} aria-valuemax={max}>
          <div className={styles.fill} style={{ width: `${percentage}%` }} />
        </div>
        {showLabel && (
          <div className={styles.label}>{label ?? `${Math.round(percentage)}%`}</div>
        )}
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';