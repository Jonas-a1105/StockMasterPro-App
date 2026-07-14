import type { ButtonHTMLAttributes, ReactNode } from 'react';
import styles from './Button.module.css';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  width?: 'full' | string;
}

const VARIANT_VARS: Record<Required<ButtonProps>['variant'], React.CSSProperties> = {
  primary: {
    '--btn-bg': 'var(--color-primary)',
    '--btn-color': 'var(--color-on-primary)',
    '--btn-border': 'var(--color-primary)',
    '--btn-hover-bg': 'var(--color-primary-hover)',
  },
  secondary: {
    '--btn-bg': 'var(--color-surface)',
    '--btn-color': 'var(--color-text)',
    '--btn-border': 'var(--color-border-input)',
    '--btn-hover-bg': 'var(--color-bg-hover)',
  },
  danger: {
    '--btn-bg': 'var(--color-danger)',
    '--btn-color': 'var(--color-on-primary)',
    '--btn-border': 'var(--color-danger)',
    '--btn-hover-bg': 'var(--red-600)',
  },
  ghost: {
    '--btn-bg': 'transparent',
    '--btn-color': 'var(--color-text)',
    '--btn-border': 'transparent',
    '--btn-hover-bg': 'var(--color-bg-hover)',
  },
};

const SIZE_VARS: Record<Required<ButtonProps>['size'], React.CSSProperties> = {
  sm: {
    '--btn-height': 'calc(var(--input-height) * 0.8)',
    '--btn-padding': '0 var(--space-3)',
    '--btn-font-size': 'var(--font-size-sm)',
    '--btn-radius': 'calc(var(--radius-md) * 0.8)',
  },
  md: {
    '--btn-height': 'var(--input-height)',
    '--btn-padding': '0 var(--space-4)',
    '--btn-font-size': 'var(--font-size-sm)',
    '--btn-radius': 'var(--radius-md)',
  },
  lg: {
    '--btn-height': 'calc(var(--input-height) * 1.2)',
    '--btn-padding': '0 var(--space-6)',
    '--btn-font-size': 'var(--font-size-md)',
    '--btn-radius': 'calc(var(--radius-md) * 1.2)',
  },
};

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  leftIcon,
  rightIcon,
  width,
  children,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const style = {
    ...VARIANT_VARS[variant],
    ...SIZE_VARS[size],
    ...(width === 'full' ? { width: '100%' } : width ? { width } : {}),
  };
  const classes = [styles.btn, loading ? styles.loading : '', className].filter(Boolean).join(' ');

  const activeLeftIcon = leftIcon || icon;

  return (
    <button className={classes} style={style} disabled={disabled || loading} {...props}>
      {loading ? (
        <span className={styles.spinner} aria-hidden="true" />
      ) : activeLeftIcon ? (
        <span className={styles.iconWrap}>{activeLeftIcon}</span>
      ) : null}
      {children}
      {rightIcon && <span className={styles.iconWrap} style={{ marginLeft: 'var(--space-2)' }}>{rightIcon}</span>}
    </button>
  );
}