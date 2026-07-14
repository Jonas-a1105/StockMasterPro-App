import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Package, Check, X, Ban } from 'lucide-react';
import type { PurchaseOrder } from '@types';
import { Button, Badge, Skeleton, Text } from '@shared/ui';
import tableStyles from '@shared/ui/TableList/TableList.module.css';

export function PurchaseOrdersList({
  orders,
  suppliers,
  loading,
  onApprove,
  onReject,
  onCancel,
  onReceiveClick,
  userRole,
}: {
  orders: PurchaseOrder[];
  suppliers: any[];
  loading: boolean;
  onApprove?: (id: string) => void;
  onReject?: (id: string) => void;
  onCancel?: (id: string) => void;
  onReceiveClick?: (order: PurchaseOrder) => void;
  userRole?: string;
}) {
  const { formatPrice } = useExchangeRate();

  const getSupplierName = (id: string | null) => {
    if (!id) return '-';
    const s = suppliers.find((s) => s.id === id);
    return s ? s.name : id.slice(0, 8);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { variant: 'success' | 'warning' | 'danger' | 'info' | 'default'; label: string }> = {
      completed: { variant: 'success', label: 'Completada' },
      received: { variant: 'success', label: 'Recibida' },
      pending: { variant: 'warning', label: 'Pendiente' },
      approved: { variant: 'success', label: 'Aprobada' },
      partially_received: { variant: 'warning', label: 'Parcial' },
      rejected: { variant: 'danger', label: 'Rechazada' },
      cancelled: { variant: 'danger', label: 'Cancelada' },
    };
    const entry = map[status] ?? { variant: 'default', label: status };
    return <Badge variant={entry.variant}>{entry.label}</Badge>;
  };

  return (
    <div className={tableStyles.container}>
      <table className={tableStyles.table}>
        <thead>
          <tr>
            <th>#</th>
            <th>Proveedor</th>
            <th className="text-center">Estado</th>
            <th className="text-right">Total</th>
            <th>Fecha</th>
            <th className="text-center">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            Array.from({ length: 5 }).map((_, idx) => (
              <tr key={`loader-${idx}`}>
                <td>
                  <Skeleton height={14} width="60px" />
                </td>
                <td>
                  <Skeleton height={14} width="120px" />
                </td>
                <td>
                  <Skeleton height={14} width="80px" />
                </td>
                <td className="flex justify-center">
                  <Skeleton height={14} width="60px" />
                </td>
                <td>
                  <Skeleton height={14} width="100px" />
                </td>
                <td></td>
              </tr>
            ))
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td className="font-mono font-bold text-text-muted">
                  {order.id.slice(0, 8)}
                </td>
                <td>
                  <span className={tableStyles.nameText}>{getSupplierName(order.supplierId)}</span>
                </td>
                <td className="text-center">{statusBadge(order.status)}</td>
                <td className="text-right">
                  <span className={tableStyles.numberValue}>{formatPrice(order.total)}</span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className="text-center">
                  {userRole !== 'cajero' && (
                    <div className="flex items-center justify-center gap-1.5">
                      {order.status === 'pending' && onApprove && (
                        <Button
                          onClick={() => onApprove(order.id)}
                          title="Aprobar orden"
                          variant="ghost"
                          size="sm"
                          className="text-success"
                        >
                          <Check size={14} /> Aprobar
                        </Button>
                      )}
                      {order.status === 'pending' && onReject && (
                        <Button
                          onClick={() => onReject(order.id)}
                          title="Rechazar orden"
                          variant="ghost"
                          size="sm"
                          className="text-danger"
                        >
                          <X size={14} /> Rechazar
                        </Button>
                      )}
                      {['approved', 'partially_received'].includes(order.status) &&
                        onReceiveClick && (
                          <Button
                            onClick={() => onReceiveClick(order)}
                            title="Recibir productos"
                            variant="ghost"
                            size="sm"
                          >
                            <Package size={14} /> Recibir
                          </Button>
                        )}
                      {['pending', 'approved', 'partially_received'].includes(order.status) &&
                        onCancel && (
                          <Button
                            onClick={() => onCancel(order.id)}
                            title="Cancelar orden"
                            variant="ghost"
                            size="sm"
                            className="text-text-muted"
                          >
                            <Ban size={14} /> Cancelar
                          </Button>
                        )}
                    </div>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {!loading && orders.length === 0 && (
        <Text color="muted" className="p-4 text-center block">No hay órdenes de compra</Text>
      )}
    </div>
  );
}
