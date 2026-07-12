import { type ElementType, type ReactNode } from 'react';
import styles from './Text.module.css';

type TextVariant = keyof typeof styles;

const VARIANT_MAP: Record<string, TextVariant | null> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'body',
  'body-sm': 'bodySm',
  description: 'description',
  caption: 'caption',
  label: 'label',
  badge: 'badge',
};

const VARIANTS_AS: Record<string, ElementType> = {
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
  body: 'p',
  'body-sm': 'p',
  description: 'p',
  caption: 'span',
  label: 'label',
  badge: 'span',
};

interface TextProps {
  variant?: keyof typeof VARIANT_MAP;
  color?: 'main' | 'muted' | 'light' | 'primary' | 'danger' | 'success';
  weight?: 'normal' | 'medium' | 'semibold' | 'bold';
  as?: ElementType;
  children: ReactNode;
  className?: string;
}

export function Text({
  variant = 'body',
  color,
  weight,
  as,
  children,
  className = '',
}: TextProps) {
  const Tag = as || VARIANTS_AS[variant] || 'span';
  const variantClass = VARIANT_MAP[variant];
  const classes = [
    variantClass ? styles[variantClass] : '',
    color && color !== 'main' ? styles[`color${color.charAt(0).toUpperCase() + color.slice(1)}` as keyof typeof styles] : '',
    weight ? styles[`weight${weight.charAt(0).toUpperCase() + weight.slice(1)}` as keyof typeof styles] : '',
    className,
  ].filter(Boolean).join(' ');

  return <Tag className={classes}>{children}</Tag>;
}
