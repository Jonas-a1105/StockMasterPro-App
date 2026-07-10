import { Skeleton } from '@shared/ui/Skeleton';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Package, Check, X, Ban } from 'lucide-react';
import type { PurchaseOrder } from '@types';
import styles from '@features/inventory/pages/InventoryPage.module.css';

export function PurchaseOrdersList({
  orders, suppliers, loading, skeletonEnabled,
  onApprove, onReject, onCancel, onReceiveClick, userRole,
}: {
  orders: PurchaseOrder[]; suppliers: any[]; loading: boolean; skeletonEnabled: boolean;
  onApprove?: (id: string) => void; onReject?: (id: string) => void;
  onCancel?: (id: string) => void; onReceiveClick?: (order: PurchaseOrder) => void;
  userRole?: string;
}) {
  const { formatPrice } = useExchangeRate();

  const getSupplierName = (id: string | null) => {
    if (!id) return '-';
    const s = suppliers.find(s => s.id === id);
    return s ? s.name : id.slice(0, 8);
  };

  const statusBadge = (status: string) => {
    const map: Record<string, { style: React.CSSProperties; label: string }> = {
      completed: { style: { backgroundColor: '#dcfce7', color: '#16a34a' }, label: 'Completada' },
      received: { style: { backgroundColor: '#dcfce7', color: '#16a34a' }, label: 'Recibida' },
      pending: { style: { backgroundColor: '#fef9c3', color: '#ca8a04' }, label: 'Pendiente' },
      approved: { style: { backgroundColor: '#dbeafe', color: '#2563eb' }, label: 'Aprobada' },
      partially_received: { style: { backgroundColor: '#dbeafe', color: '#2563eb' }, label: 'Parcial' },
      rejected: { style: { backgroundColor: '#fef2f2', color: '#dc2626' }, label: 'Rechazada' },
      cancelled: { style: { backgroundColor: '#fef2f2', color: '#dc2626' }, label: 'Cancelada' },
    };
    const entry = map[status] ?? { style: { backgroundColor: '#fef2f2', color: '#dc2626' }, label: status };
    return <span className={styles.badge} style={entry.style}>{entry.label}</span>;
  };

  return (
    <div className="lista-container">
      <table className="lista-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Proveedor</th>
            <th style={{ textAlign: 'center' }}>Estado</th>
            <th style={{ textAlign: 'right' }}>Total</th>
            <th>Fecha</th>
            <th style={{ textAlign: 'center' }}>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {loading ? (
            skeletonEnabled ? (
              Array.from({ length: 5 }).map((_, idx) => (
                <tr key={`loader-${idx}`}>
                  <td><Skeleton height={14} width="60px" /></td>
                  <td><Skeleton height={14} width="120px" /></td>
                  <td><Skeleton height={14} width="80px" /></td>
                  <td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Skeleton height={14} width="60px" /></div></td>
                  <td><Skeleton height={14} width="100px" /></td>
                  <td></td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={6} style={{ textAlign: 'center', padding: 40 }}><LoadingDots text="Cargando órdenes..." /></td></tr>
            )
          ) : (
            orders.map(order => (
              <tr key={order.id}>
                <td style={{ fontFamily: 'monospace', fontWeight: 700, color: 'var(--text-muted)' }}>{order.id.slice(0, 8)}</td>
                <td><span className="lista-name-text">{getSupplierName(order.supplierId)}</span></td>
                <td style={{ textAlign: 'center' }}>{statusBadge(order.status)}</td>
                <td style={{ textAlign: 'right' }}><span className="lista-number-value">{formatPrice(order.total)}</span></td>
                <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                <td style={{ textAlign: 'center', whiteSpace: 'nowrap' }}>
                  {userRole !== 'cajero' && (
                    <>
                      {order.status === 'pending' && onApprove && (
                        <button onClick={() => onApprove(order.id)} title="Aprobar orden" style={{
                          padding: '4px 10px', border: 'none', borderRadius: 6,
                          background: '#2563eb', color: 'white', cursor: 'pointer', fontSize: 12,
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4,
                        }}><Check size={14} /> Aprobar</button>
                      )}
                      {order.status === 'pending' && onReject && (
                        <button onClick={() => onReject(order.id)} title="Rechazar orden" style={{
                          padding: '4px 10px', border: 'none', borderRadius: 6,
                          background: '#dc2626', color: 'white', cursor: 'pointer', fontSize: 12,
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4,
                        }}><X size={14} /> Rechazar</button>
                      )}
                      {['approved', 'partially_received'].includes(order.status) && onReceiveClick && (
                        <button onClick={() => onReceiveClick(order)} title="Recibir productos" style={{
                          padding: '4px 10px', border: 'none', borderRadius: 6,
                          background: '#16a34a', color: 'white', cursor: 'pointer', fontSize: 12,
                          display: 'inline-flex', alignItems: 'center', gap: 4, marginRight: 4,
                        }}><Package size={14} /> Recibir</button>
                      )}
                      {['pending', 'approved', 'partially_received'].includes(order.status) && onCancel && (
                        <button onClick={() => onCancel(order.id)} title="Cancelar orden" style={{
                          padding: '4px 10px', border: 'none', borderRadius: 6,
                          background: '#6b7280', color: 'white', cursor: 'pointer', fontSize: 12,
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                        }}><Ban size={14} /> Cancelar</button>
                      )}
                    </>
                  )}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
      {!loading && orders.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay órdenes de compra</p>}
    </div>
  );
}
