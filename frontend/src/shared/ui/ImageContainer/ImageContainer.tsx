import type { ReactNode } from 'react';
import { Badge } from '@shared/ui/Badge';
import styles from './ImageContainer.module.css';

export interface ImageBadge {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'default';
}

export interface ImageContainerProps {
  src?: string;
  alt?: string;
  aspectRatio?: string;
  badges?: ImageBadge[];
  onClick?: () => void;
  children?: ReactNode;
  className?: string;
}

export function ImageContainer({
  src,
  alt = '',
  aspectRatio = '1',
  badges = [],
  onClick,
  children,
  className = '',
}: ImageContainerProps) {
  const classes = [styles.container, onClick ? styles.clickable : '', className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      style={{ aspectRatio } as React.CSSProperties}
      onClick={onClick}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
    >
      {src ? (
        <img src={src} alt={alt} className={styles.image} />
      ) : children ? (
        <div className={styles.placeholder}>{children}</div>
      ) : (
        <div className={styles.placeholder} />
      )}
      {badges.map((badge, i) => (
        <Badge key={i} variant={badge.variant} size="sm" className={styles.badge}>
          {badge.label}
        </Badge>
      ))}
    </div>
  );
}