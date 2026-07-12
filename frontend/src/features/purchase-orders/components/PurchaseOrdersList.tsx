import { Skeleton } from '@shared/ui/Skeleton';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Package, Check, X, Ban } from 'lucide-react';
import type { PurchaseOrder } from '@types';
import styles from '@features/inventory/pages/InventoryPage.module.css';
import tableStyles from '@shared/ui/TableList.module.css';

export function PurchaseOrdersList({
  orders,
  suppliers,
  loading,
  skeletonEnabled,
  onApprove,
  onReject,
  onCancel,
  onReceiveClick,
  userRole,
}: {
  orders: PurchaseOrder[];
  suppliers: any[];
  loading: boolean;
  skeletonEnabled: boolean;
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
    const map: Record<string, { className: string; label: string }> = {
      completed: { className: styles.badgeCompleted, label: 'Completada' },
      received: { className: styles.badgeCompleted, label: 'Recibida' },
      pending: { className: styles.badgePending, label: 'Pendiente' },
      approved: { className: styles.badgeApproved, label: 'Aprobada' },
      partially_received: { className: styles.badgePartiallyReceived, label: 'Parcial' },
      rejected: { className: styles.badgeRejected, label: 'Rechazada' },
      cancelled: { className: styles.badgeCancelled, label: 'Cancelada' },
    };
    const entry = map[status] ?? { className: styles.badgeRejected, label: status };
    return <span className={`${styles.badge} ${entry.className}`}>{entry.label}</span>;
  };

  return (
    <div className="tableStyles.container">
      <table className="tableStyles.table">
        <thead>
          <tr>
            <th>#</th>
            <th>Proveedor</th>
            <th className={styles.textCenter}>Estado</th>
            <th className={styles.textRight}>Total</th>
            <th>Fecha</th>
            <th className={styles.textCenter}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            skeletonEnabled ? (
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
                  <td className={styles.flexCenter}>
                    <Skeleton height={14} width="60px" />
                  </td>
                  <td>
                    <Skeleton height={14} width="100px" />
                  </td>
                  <td></td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className={`${styles.emptyRow} ${styles.p16}`}>
                  <LoadingDots text="Cargando órdenes..." />
                </td>
              </tr>
            )
          ) : (
            orders.map((order) => (
              <tr key={order.id}>
                <td className={`${styles.mono} ${styles.bold} ${styles.textMuted}`}>
                  {order.id.slice(0, 8)}
                </td>
                <td>
                  <span className="tableStyles.nameText">{getSupplierName(order.supplierId)}</span>
                </td>
                <td className={styles.textCenter}>{statusBadge(order.status)}</td>
                <td className={styles.textRight}>
                  <span className="tableStyles.numberValue">{formatPrice(order.total)}</span>
                </td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td className={styles.textCenter}>
                  {userRole !== 'cajero' && (
                    <>
                      {order.status === 'pending' && onApprove && (
                        <button
                          onClick={() => onApprove(order.id)}
                          title="Aprobar orden"
                          className={`${styles.actionBtn} ${styles.approveBtn}`}
                        >
                          <Check size={14} /> Aprobar
                        </button>
                      )}
                      {order.status === 'pending' && onReject && (
                        <button
                          onClick={() => onReject(order.id)}
                          title="Rechazar orden"
                          className={`${styles.actionBtn} ${styles.rejectBtn}`}
                        >
                          <X size={14} /> Rechazar
                        </button>
                      )}
                      {['approved', 'partially_received'].includes(order.status) &&
                        onReceiveClick && (
                          <button
                            onClick={() => onReceiveClick(order)}
                            title="Recibir productos"
                            className={`${styles.actionBtn} ${styles.receiveBtn}`}
                          >
                            <Package size={14} /> Recibir
                          </button>
                        )}
                      {['pending', 'approved', 'partially_received'].includes(order.status) &&
                        onCancel && (
                          <button
                            onClick={() => onCancel(order.id)}
                            title="Cancelar orden"
                            className={`${styles.actionBtn} ${styles.cancelBtn}`}
                          >
                            <Ban size={14} /> Cancelar
                          </button>
                        )}
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {!loading && orders.length === 0 && (
        <p className={`${styles.emptyRow} ${styles.p16}`}>No hay órdenes de compra</p>
      )}
    </div>
  );
}
