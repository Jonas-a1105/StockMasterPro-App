import type { ReactNode } from 'react';
import { ImageContainer } from '@shared/ui/ImageContainer';
import { ActionButton } from '@shared/ui/ActionButton';
import styles from './MediaCard.module.css';

export interface MediaCardAction {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
}

export interface MediaCardBadge {
  label: string;
  variant: 'success' | 'danger' | 'warning' | 'info' | 'default';
}

export interface MediaCardProps {
  image?: string;
  imageAlt?: string;
  title: string;
  subtitle?: string;
  price?: string;
  priceSecondary?: string;
  badges?: MediaCardBadge[];
  stats?: Array<{ label: string; value: string; color?: 'success' | 'danger' | 'warning' | 'info' }>;
  actions?: MediaCardAction[];
  footerActions?: MediaCardAction[];
  onClick?: () => void;
  aspectRatio?: string;
  className?: string;
}

export function MediaCard({
  image,
  imageAlt,
  title,
  subtitle,
  price,
  priceSecondary,
  badges = [],
  stats = [],
  actions = [],
  footerActions = [],
  onClick,
  aspectRatio = '1',
  className = '',
}: MediaCardProps) {
  const classes = [styles.card, onClick ? styles.clickable : '', className].filter(Boolean).join(' ');

  return (
    <div className={classes} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      <ImageContainer
        src={image}
        alt={imageAlt || ''}
        aspectRatio={aspectRatio}
        badges={badges.map(b => ({ label: b.label, variant: b.variant }))}
      />

      <div className={styles.content}>
        <div className={styles.header}>
          <div className={styles.titleBlock}>
            <div className={styles.name}>{title}</div>
            {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
          </div>
          {price && <div className={styles.price}>{price}</div>}
        </div>

        {priceSecondary && <div className={styles.priceSecondary}>{priceSecondary}</div>}

        {stats.length > 0 && (
          <div className={styles.stats}>
            {stats.map((stat, i) => (
              <div key={i} className={styles.stat}>
                <div className={styles.statLabel}>{stat.label}</div>
                <div className={styles.statValue} style={{ color: `var(--color-${stat.color || 'success'})` }}>
                  {stat.value}
                </div>
              </div>
            ))}
          </div>
        )}

        {(actions.length > 0 || footerActions.length > 0) && (
          <div className={styles.actions}>
            {actions.map((action, i) => (
              <ActionButton
                key={i}
                icon={action.icon}
                label={action.label}
                onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                variant={action.variant || 'secondary'}
                size="sm"
                fullWidth
              />
            ))}
            {footerActions.map((action, i) => (
              <ActionButton
                key={`footer-${i}`}
                icon={action.icon}
                label={action.label}
                onClick={(e) => { e.stopPropagation(); action.onClick(); }}
                variant={action.variant || 'secondary'}
                size="sm"
                fullWidth
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}