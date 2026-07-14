import { ReactNode } from 'react';
import { AlertCircle, Search, Package } from 'lucide-react';
import styles from './EmptyState.module.css';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: {
    label: string;
    onClick: () => void;
  };
  variant?: 'default' | 'search' | 'warning' | 'empty';
  className?: string;
}

const ICON_MAP: Record<string, ReactNode> = {
  default: <Package size={48} />,
  search: <Search size={48} />,
  warning: <AlertCircle size={48} />,
  empty: <Package size={48} />,
};

export function EmptyState({
  title,
  description,
  icon,
  action,
  variant = 'default',
  className = '',
}: EmptyStateProps) {
  const iconNode = icon || ICON_MAP[variant] || ICON_MAP.default;

  return (
    <div className={`${styles.emptyState} ${className}`}>
      <div className={styles.iconWrapper}>{iconNode}</div>
      <h3 className={styles.title}>{title}</h3>
      {description && <p className={styles.description}>{description}</p>}
      {action && (
        <button className={`${styles.action} ${styles[variant]}`} onClick={action.onClick}>
          {action.label}
        </button>
      )}
    </div>
  );
}
