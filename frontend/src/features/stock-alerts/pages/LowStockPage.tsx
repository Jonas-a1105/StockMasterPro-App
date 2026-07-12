import { useState, useEffect } from 'react';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';

import { TabNav } from '@shared/ui/TabNav';
import { KpiGrid } from '@shared/ui/KpiGrid';
import { Toolbar } from '@shared/ui/Toolbar';
import { SkeletonTablePage } from '@shared/ui/Skeleton';
import { useTheme } from '@contexts/ThemeContext';
import { Search, AlertTriangle, Package, PackageX, Eye } from 'lucide-react';
import styles from './LowStockPage.module.css';
import tableStyles from '@shared/ui/TableList.module.css';

function statusInfo(stock: number, minStock: number) {
  if (stock === 0) return { label: 'Crítico', className: 'critical' };
  if (stock <= minStock / 2) return { label: 'Bajo', className: 'low' };
  return { label: 'Alerta', className: 'warning' };
}

export function LowStockPage() {
  const [activeTab, setActiveTab] = useState('low-stock');
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();
  const { config } = useTheme();

  useEffect(() => {
    loadLowStock();
  }, []);

  async function loadLowStock() {
    setLoading(true);
    try {
      const data = await api.get('/inventory/low-stock');
      setProducts(data);
    } catch (err: any) {
      showToast(err.message || 'Error al cargar', 'error');
    } finally {
      setLoading(false);
    }
  }

  if (loading)
    return <SkeletonTablePage rows={8} cols={6} kpi={3} />;

  const criticalCount = products.filter((p: any) => p.stock === 0).length;
  const lowCount = products.filter((p: any) => p.stock > 0 && p.stock <= p.minStock / 2).length;
  const totalAlerts = products.length;

  const filteredProducts = products.filter(
    (p) =>
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.barcode || '').toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className={styles.container}>
      <TabNav
        tabs={[{ key: 'low-stock', label: 'Alertas de Stock', icon: <AlertTriangle size={16} /> }]}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />
      <KpiGrid
        items={[
          {
            icon: <AlertTriangle size={18} />,
            value: totalAlerts,
            label: 'Productos con Alerta',
            color: 'var(--color-warning)',
          },
          {
            icon: <PackageX size={18} />,
            value: criticalCount,
            label: 'Stock Cero',
            color: 'var(--color-danger)',
          },
          {
            icon: <Package size={18} />,
            value: lowCount,
            label: 'Stock Bajo',
            color: 'var(--color-primary)',
          },
        ]}
      />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar productos...' }}
        addBtn={{ label: 'Actualizar', onClick: loadLowStock, icon: <Search size={18} /> }}
      />

      {filteredProducts.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.emptyIcon}>✅</div>
          <p>Todos los productos tienen stock suficiente</p>
        </div>
      ) : (
        <div className={tableStyles.container}>
          <table className={tableStyles.table}>
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th className={styles.textRight}>Stock Actual</th>
                <th className={styles.textRight}>Stock Mínimo</th>
                <th className={styles.textCenter}>Estado</th>
                <th className={styles.textCenter}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((p: any) => {
                const status = statusInfo(p.stock, p.minStock);
                return (
                  <tr key={p.id}>
                    <td>
                      <span className={tableStyles.nameText}>{p.name}</span>
                    </td>
                    <td>
                      <span className={tableStyles.code}>{p.barcode || '—'}</span>
                    </td>
                    <td className={styles.textRight}>
                      <span className={tableStyles.numberValue}>{p.stock}</span>
                    </td>
                    <td className={styles.textRight}>{p.minStock}</td>
                    <td className={styles.textCenter}>
                      <span
                        className={`${tableStyles.badge} ${status.className === 'critical' ? tableStyles.badgeSaturated : status.className === 'low' ? tableStyles.badgeWarning : tableStyles.badgeActive}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    <td className={styles.textCenter}>
                      <div className={`${tableStyles.actions} ${styles.justifyCenter}`}>
                        <button
                          className={tableStyles.actionBtn}
                          onClick={() => (window.location.href = `/inventory?edit=${p.id}`)}
                          title="Ir al producto"
                        >
                          <Eye size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
