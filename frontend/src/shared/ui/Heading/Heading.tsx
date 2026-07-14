import { type ElementType, type ReactNode } from 'react';
import styles from './Heading.module.css';

type HeadingVariant = 'h1' | 'h2' | 'h3' | 'h4';

interface HeadingProps {
  variant?: HeadingVariant;
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export function Heading({ variant = 'h2', as, children, className = '' }: HeadingProps) {
  const Tag = as || variant;
  const classes = [styles[variant], className].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
