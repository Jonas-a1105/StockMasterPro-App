import type { ReactNode } from 'react';

type GridGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

const GAP_MAP: Record<GridGap, string> = {
  xs: 'var(--space-1)',
  sm: 'var(--space-2)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
  xl: 'var(--space-8)',
};

interface GridProps {
  children: ReactNode;
  columns?: number;
  gap?: GridGap;
  className?: string;
  style?: React.CSSProperties;
}

export function Grid({
  children,
  columns = 1,
  gap = 'md',
  className = '',
  style,
}: GridProps) {
  return (
    <div
      className={className}
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, 1fr)`,
        gap: GAP_MAP[gap],
        ...style,
      }}
    >
      {children}
    </div>
  );
}
