import { Badge } from '@shared/ui/Badge';

interface StatusBadgeProps {
  status: 'success' | 'danger' | 'warning' | 'info' | 'default' | 'primary';
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const STATUS_MAP: Record<string, { variant: 'success' | 'danger' | 'warning' | 'info' | 'default'; label: string }> = {
  success: { variant: 'success', label: 'Éxito' },
  danger: { variant: 'danger', label: 'Error' },
  warning: { variant: 'warning', label: 'Advertencia' },
  info: { variant: 'info', label: 'Info' },
  default: { variant: 'default', label: 'Por defecto' },
  primary: { variant: 'default', label: 'Primario' },
};

export function StatusBadge({ 
  status, 
  label, 
  size = 'sm',
  showDot = false 
}: StatusBadgeProps) {
  const mapped = STATUS_MAP[status] || { variant: 'default', label: status };
  const displayLabel = label || mapped.label;
  const variant = mapped.variant;
  
  return (
    <Badge variant={variant} size={size as any}>
      {showDot && <span className="status-dot" />}
      {displayLabel}
    </Badge>
  );
}