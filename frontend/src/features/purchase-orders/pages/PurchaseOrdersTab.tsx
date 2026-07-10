import { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { getPurchaseOrders, createPurchaseOrder, receivePurchaseOrder } from '../api/purchaseOrders.api';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { PurchaseOrdersList } from '../components/PurchaseOrdersList';
import { getSuppliers } from '@features/suppliers';
import type { PurchaseOrder, Supplier } from '@types';
import styles from '@features/inventory/pages/InventoryPage.module.css';

export function PurchaseOrdersTab() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);

  useEffect(() => { loadOrders(); getSuppliers().then(setSuppliers).catch(() => {}); }, []);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try { setOrders(await getPurchaseOrders()); } catch {} finally { setLoadingOrders(false); }
  };

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try { await createPurchaseOrder(payload); setShowForm(false); await loadOrders(); } catch (err: any) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const handleReceive = async (id: string) => {
    if (!window.confirm('¿Recibir esta orden de compra? Se actualizará el inventario.')) return;
    try { await receivePurchaseOrder(id); showToast('Orden recibida exitosamente', 'success'); await loadOrders(); } catch (err: any) { showToast(err.message, 'error'); }
  };

  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalInvestmentUsd = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><ShoppingCart size={18} /></div>
          <div className={styles.kpiContent}><span className={styles.kpiValue}>{totalOrders}</span><span className={styles.kpiLabel}>Total Órdenes</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}><Package size={18} /></div>
          <div className={styles.kpiContent}><span className={styles.kpiValue} style={{ color: '#16a34a' }}>{completedOrders}</span><span className={styles.kpiLabel}>Completadas</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(202, 138, 4, 0.1)', color: '#ca8a04' }}><AlertTriangle size={18} /></div>
          <div className={styles.kpiContent}><span className={styles.kpiValue} style={{ color: '#ca8a04' }}>{pendingOrders}</span><span className={styles.kpiLabel}>Pendientes</span></div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}><DollarSign size={18} /></div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{formatPrice(totalInvestmentUsd)}</span>
            <span className={styles.kpiLabel}>Total Inversión</span>
          </div>
        </div>
      </div>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Órdenes de Compra</h3>
        {user?.role !== 'cajero' && (
          <button className={styles.addBtn} onClick={() => setShowForm(true)}><Plus size={18} /> Nueva Orden de Compra</button>
        )}
      </div>
      <PurchaseOrdersList orders={orders} suppliers={suppliers} loading={loadingOrders} skeletonEnabled={config.skeletonEnabled} onReceive={handleReceive} userRole={user?.role} />
      <PurchaseOrderForm open={showForm} onClose={() => setShowForm(false)} onSubmit={handleSubmit} loading={loading} />
    </>
  );
}
