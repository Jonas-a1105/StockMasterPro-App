import { type ReactNode, type HTMLAttributes, forwardRef } from 'react';
import styles from './Flex.module.css';

interface FlexProps extends HTMLAttributes<HTMLDivElement> {
  direction?: 'row' | 'column' | 'row-reverse' | 'column-reverse';
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly';
  align?: 'flex-start' | 'flex-end' | 'center' | 'stretch' | 'baseline';
  gap?: 'none' | 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  wrap?: boolean;
  children: ReactNode;
}

const GAP_MAP = {
  none: '0',
  xs: 'var(--space-1)',
  sm: 'var(--space-2)',
  md: 'var(--space-3)',
  lg: 'var(--space-4)',
  xl: 'var(--space-5)',
};

export const Flex = forwardRef<HTMLDivElement, FlexProps>(
  ({ direction = 'row', justify = 'flex-start', align = 'stretch', gap = 'none', wrap = false, children, className = '', style, ...props }, ref) => {
    const gapValue = GAP_MAP[gap];
    const classes = [styles.flex, className].filter(Boolean).join(' ');

    return (
      <div
        ref={ref}
        className={classes}
        style={{
          ...style,
          flexDirection: direction,
          justifyContent: justify,
          alignItems: align,
          gap: gapValue,
          flexWrap: wrap ? 'wrap' : 'nowrap',
        }}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Flex.displayName = 'Flex';