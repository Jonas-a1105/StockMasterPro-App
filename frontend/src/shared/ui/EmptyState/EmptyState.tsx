import { ReactNode } from 'react';
import { X, AlertCircle, Search, Package, Users, Truck, ShoppingCart } from 'lucide-react';
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

const DEFAULT_ICONS: Record<string, ReactNode> = {
  search: <Search size={48} />,
  warning: <AlertCircle size={48} />,
  product: <Package size={48} />,
  customer: <Users size={48} />,
  supplier: <Truck size={160} />,
  sale: <ShoppingCart size={48} />,
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
  const icons: Record<string, ReactNode> = {
    search: <Search size={48} />,
    warning: <AlertCircle size={48} />,
    product: <Package size={48} />,
    customer: <Users size={48} />,
    supplier: <Truck size={48} />,
    sale: <ShoppingCart size={48} />,
    empty: <Package size={48} />,
  };

  const iconMap: Record<string, ReactNode> = {
    default: <Package size={48} />,
    search: <Search size={48} />,
    warning: <AlertCircle size={48} />,
    product: <Package size={48} />,
    customer: <Users size={48} />,
    supplier: <Truck size={48} />,
    sale: <ShoppingCart size={48} />,
    empty: <Package size={48} />,
  };

  const iconNode = icon || iconMap[variant] || iconMap.default;

  return (
    <div className={`${styles.emptyState} ${className}`}>
      <div className={styles.iconWrapper}>
        {iconNode}
      </div>
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