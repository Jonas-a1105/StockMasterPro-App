import { Badge } from './Badge';

type StatusVariant = 
  | 'success' 
  | 'danger' 
  | 'warning' 
  | 'info' 
  | 'default'
  | 'primary'
  | 'pending'
  | 'completed'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'partially_received'
  | 'paid'
  | 'overdue'
  | 'active'
  | 'inactive'
  | 'critical'
  | 'low'
  | 'saturated';

interface StatusBadgeProps {
  status: StatusVariant;
  label?: string;
  size?: 'sm' | 'md';
  showDot?: boolean;
}

const STATUS_MAP: Record<StatusVariant, { variant: 'success' | 'danger' | 'warning' | 'info' | 'default'; label: string }> = {
  success: { variant: 'success', label: 'Éxito' },
  completed: { variant: 'success', label: 'Completada' },
  received: { variant: 'success', label: 'Recibida' },
  approved: { variant: 'info', label: 'Aprobada' },
  active: { variant: 'success', label: 'Activo' },
  paid: { variant: 'success', label: 'Pagada' },
  
  danger: { variant: 'danger', label: 'Error' },
  rejected: { variant: 'danger', label: 'Rechazada' },
  cancelled: { variant: 'danger', label: 'Cancelada' },
  inactive: { variant: 'danger', label: 'Inactivo' },
  overdue: { variant: 'danger', label: 'Vencida' },
  critical: { variant: 'danger', label: 'Crítico' },
  saturated: { variant: 'danger', label: 'Crítico' },
  
  warning: { variant: 'warning', label: 'Advertencia' },
  pending: { variant: 'warning', label: 'Pendiente' },
  partially_received: { variant: 'warning', label: 'Parcial' },
  low: { variant: 'warning', label: 'Bajo' },
  
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

export function StockStatusBadge({ 
  stock, 
  minStock 
}: { 
  stock: number; 
  minStock: number; 
}) {
  if (stock === 0) return <StatusBadge status="critical" label="Agotado" />;
  if (stock <= minStock) return <StatusBadge status="low" label="Bajo Stock" />;
  return <StatusBadge status="active" label="OK" />;
}

export function OrderStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status as StatusVariant} />;
}

export function PaymentStatusBadge({ status }: { status: string }) {
  return <StatusBadge status={status as StatusVariant} />;
}

export function UserStatusBadge({ isActive, role }: { isActive: boolean; role?: string }) {
  if (!isActive) return <StatusBadge status="inactive" label="Inactivo" />;
  if (role === 'admin') return <StatusBadge status="primary" label="Admin" />;
  return <StatusBadge status="active" label="Activo" />;
}