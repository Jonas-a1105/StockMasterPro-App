import type { ReactNode } from 'react';

type StackDirection = 'row' | 'column';
type StackGap = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type StackAlign = 'start' | 'center' | 'end' | 'stretch';
type StackJustify = 'start' | 'center' | 'end' | 'between' | 'around' | 'evenly';

const GAP_MAP: Record<StackGap, string> = {
  xs: 'var(--space-1)',
  sm: 'var(--space-2)',
  md: 'var(--space-4)',
  lg: 'var(--space-6)',
  xl: 'var(--space-8)',
};

interface StackProps {
  children: ReactNode;
  direction?: StackDirection;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  wrap?: boolean;
  className?: string;
  as?: 'div' | 'section' | 'nav' | 'header' | 'footer' | 'main' | 'aside' | 'form' | 'fieldset';
  style?: React.CSSProperties;
}

export function Stack({
  children,
  direction = 'column',
  gap = 'md',
  align = 'stretch',
  justify = 'start',
  wrap = false,
  className = '',
  as: Tag = 'div',
  style,
}: StackProps) {
  const alignMap: Record<StackAlign, string> = {
    start: direction === 'row' ? 'flex-start' : 'flex-start',
    center: 'center',
    end: direction === 'row' ? 'flex-end' : 'flex-end',
    stretch: 'stretch',
  };

  const justifyMap: Record<StackJustify, string> = {
    start: 'flex-start',
    center: 'center',
    end: 'flex-end',
    between: 'space-between',
    around: 'space-around',
    evenly: 'space-evenly',
  };

  return (
    <Tag
      className={className}
      style={{
        display: 'flex',
        flexDirection: direction,
        gap: GAP_MAP[gap],
        alignItems: alignMap[align],
        justifyContent: justifyMap[justify],
        flexWrap: wrap ? 'wrap' : 'nowrap',
        ...style,
      }}
    >
      {children}
    </Tag>
  );
}
