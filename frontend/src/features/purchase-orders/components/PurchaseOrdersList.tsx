import { Skeleton } from '@shared/ui/Skeleton';
import { LoadingDots } from '@shared/ui/LoadingDots';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Package } from 'lucide-react';
import type { PurchaseOrder } from '@types';
import styles from '@features/inventory/pages/InventoryPage.module.css';

export function PurchaseOrdersList({
  orders, suppliers, loading, skeletonEnabled, onReceive, userRole,
}: {
  orders: PurchaseOrder[]; suppliers: any[]; loading: boolean; skeletonEnabled: boolean;
  onReceive?: (id: string) => void; userRole?: string;
}) {
  const { formatPrice } = useExchangeRate();

  const getSupplierName = (id: string | null) => {
    if (!id) return '—';
    const s = suppliers.find(s => s.id === id);
    return s ? s.name : id;
  };

  const statusBadge = (status: string) => {
    const cls = status === 'completed' ? styles.badgeOk : status === 'pending' ? styles.badgeWarning : styles.badgeDanger;
    const label = status === 'completed' ? 'Completada' : status === 'pending' ? 'Pendiente' : 'Cancelada';
    return <span className={`${styles.badge} ${cls}`}>{label}</span>;
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
                <td style={{ textAlign: 'center' }}>
                  {order.status === 'pending' && userRole !== 'cajero' && onReceive && (
                    <button onClick={() => onReceive(order.id)} title="Recibir orden" style={{
                      padding: '4px 10px', border: 'none', borderRadius: 6,
                      background: '#16a34a', color: 'white', cursor: 'pointer', fontSize: 12,
                      display: 'inline-flex', alignItems: 'center', gap: 4,
                    }}><Package size={14} /> Recibir</button>
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
