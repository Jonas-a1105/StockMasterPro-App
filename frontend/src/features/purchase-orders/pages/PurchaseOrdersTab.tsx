import { useState, useEffect } from 'react';
import { Plus, Package, AlertTriangle, DollarSign, ShoppingCart } from 'lucide-react';
import { useToast } from '@contexts/ToastContext';
import { useAuth } from '@contexts/AuthContext';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import {
  getPurchaseOrders,
  createPurchaseOrder,
  approvePurchaseOrder,
  rejectPurchaseOrder,
  cancelPurchaseOrder,
  receivePurchaseOrder,
} from '../api/purchaseOrders.api';
import { PurchaseOrderForm } from '../components/PurchaseOrderForm';
import { PurchaseOrdersList } from '../components/PurchaseOrdersList';
import { ReceiveModal } from '../components/ReceiveModal';
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
  const [receiveTarget, setReceiveTarget] = useState<PurchaseOrder | null>(null);
  const [receiving, setReceiving] = useState(false);

  useEffect(() => {
    loadOrders();
    getSuppliers()
      .then(setSuppliers)
      .catch(() => {});
  }, []);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      setOrders(await getPurchaseOrders());
    } catch {
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleSubmit = async (payload: any) => {
    setLoading(true);
    try {
      await createPurchaseOrder(payload);
      setShowForm(false);
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: string) => {
    try {
      await approvePurchaseOrder(id);
      showToast('Orden aprobada', 'success');
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReject = async (id: string) => {
    const reason = window.prompt('Motivo del rechazo (opcional):');
    try {
      await rejectPurchaseOrder(id, reason || undefined);
      showToast('Orden rechazada', 'success');
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleCancel = async (id: string) => {
    const reason = window.prompt('Motivo de la cancelación (opcional):');
    if (!window.confirm('¿Cancelar esta orden de compra?')) return;
    try {
      await cancelPurchaseOrder(id, reason || undefined);
      showToast('Orden cancelada', 'success');
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleReceive = async (id: string, items: { productId: string; quantity: number }[]) => {
    setReceiving(true);
    try {
      await receivePurchaseOrder(id, items);
      showToast('Productos recibidos exitosamente', 'success');
      setReceiveTarget(null);
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setReceiving(false);
    }
  };

  const completedOrders = orders.filter(
    (o) => o.status === 'completed' || o.status === 'received'
  ).length;
  const pendingOrders = orders.filter(
    (o) => o.status === 'pending' || o.status === 'approved' || o.status === 'partially_received'
  ).length;
  const totalOrders = orders.length;
  const totalInvestmentUsd = orders
    .filter((o) => o.status !== 'cancelled' && o.status !== 'rejected')
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <ShoppingCart size={18} />
          </div>
          <div className={styles.kpiContent}>
            {' '}
            <span className={styles.kpiValue}>{totalOrders}</span>
            <span className={styles.kpiLabel}>Total Órdenes</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconGreen}`}>
            <Package size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={`${styles.kpiValue} ${styles.kpiValueGreen}`}>{completedOrders}</span>
            <span className={styles.kpiLabel}>Completadas</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={`${styles.kpiIconWrapper} ${styles.kpiIconYellow}`}>
            <AlertTriangle size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={`${styles.kpiValue} ${styles.kpiValueYellow}`}>{pendingOrders}</span>
            <span className={styles.kpiLabel}>Pendientes</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <DollarSign size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{formatPrice(totalInvestmentUsd)}</span>
            <span className={styles.kpiLabel}>Total Inversion</span>
          </div>
        </div>
      </div>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Ordenes de Compra</h3>
        {user?.role !== 'cajero' && (
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>
            <Plus size={18} /> Nueva Orden de Compra
          </button>
        )}
      </div>
      <PurchaseOrdersList
        orders={orders}
        suppliers={suppliers}
        loading={loadingOrders}
        skeletonEnabled={config.skeletonEnabled}
        onApprove={handleApprove}
        onReject={handleReject}
        onCancel={handleCancel}
        onReceiveClick={setReceiveTarget}
        userRole={user?.role}
      />
      <PurchaseOrderForm
        open={showForm}
        onClose={() => setShowForm(false)}
        onSubmit={handleSubmit}
        loading={loading}
      />
      <ReceiveModal
        open={!!receiveTarget}
        order={receiveTarget}
        onClose={() => setReceiveTarget(null)}
        onSubmit={handleReceive}
        loading={receiving}
      />
    </>
  );
}
