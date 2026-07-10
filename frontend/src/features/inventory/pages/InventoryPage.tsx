import { useState } from 'react';
import { Package, Truck, ShoppingCart, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { ProductsTab } from '../components/ProductsTab';
import { KardexTab } from '../components/KardexTab';
import { AdjustmentsTab } from '../components/AdjustmentsTab';
import { ConteoFisicoTab } from '../components/ConteoFisicoTab';
import { SuppliersTab } from '@features/suppliers';
import { PurchaseOrdersTab } from '@features/purchase-orders';
import styles from './InventoryPage.module.css';

type Tab = 'products' | 'suppliers' | 'purchase-orders' | 'adjustments' | 'kardex' | 'conteo-fisico';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'products', label: 'Productos', icon: Package },
  { key: 'suppliers', label: 'Proveedores', icon: Truck },
  { key: 'purchase-orders', label: 'Órdenes de Compra', icon: ShoppingCart },
  { key: 'adjustments', label: 'Ajustes de Inventario', icon: AlertTriangle },
  { key: 'kardex', label: 'Kardex', icon: FileText },
  { key: 'conteo-fisico', label: 'Conteo Físico', icon: ClipboardList },
];

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button key={tab.key} className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`} onClick={() => setActiveTab(tab.key)}>
              <Icon size={16} /><span>{tab.label}</span>
            </button>
          );
        })}
        </div>
      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'suppliers' && <SuppliersTab />}
      {activeTab === 'purchase-orders' && <PurchaseOrdersTab />}
      {activeTab === 'adjustments' && <AdjustmentsTab />}
      {activeTab === 'kardex' && <KardexTab />}
      {activeTab === 'conteo-fisico' && <ConteoFisicoTab />}
    </div>
  );
}
