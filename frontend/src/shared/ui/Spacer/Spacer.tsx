type SpacerSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';
type SpacerVariant = 'space' | 'line';

const SIZE_MAP: Record<SpacerSize, string> = {
  xs: 'var(--space-2)',
  sm: 'var(--space-4)',
  md: 'var(--space-6)',
  lg: 'var(--space-8)',
  xl: 'var(--space-12)',
};

interface SpacerProps {
  size?: SpacerSize;
  variant?: SpacerVariant;
  className?: string;
}

export function Spacer({ size = 'md', variant = 'space', className = '' }: SpacerProps) {
  if (variant === 'line') {
    return (
      <hr
        className={className}
        style={{
          border: 'none',
          borderTop: '1px solid var(--border-main)',
          margin: `${SIZE_MAP[size]} 0`,
          width: '100%',
        }}
      />
    );
  }

  return (
    <div
      className={className}
      style={{
        height: SIZE_MAP[size],
        minHeight: SIZE_MAP[size],
        width: '100%',
      }}
      aria-hidden="true"
    />
  );
}
