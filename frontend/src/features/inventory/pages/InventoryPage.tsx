// src/features/inventory/pages/InventoryPage.tsx
import { useState, lazy, Suspense } from 'react';
import { Package, Truck, ShoppingCart, AlertTriangle, FileText, ClipboardList } from 'lucide-react';
import { TabNav, Stack, Card, CardBody, Skeleton } from '@shared/ui'; // <-- Unificado en barrel
import { ProductsTab, KardexTab, AdjustmentsTab, ConteoFisicoTab } from '../components'; // <-- Puntos locales

const SuppliersTab = lazy(() => import('@features/suppliers').then(m => ({ default: m.SuppliersTab })));
const PurchaseOrdersTab = lazy(() => import('@features/purchase-orders').then(m => ({ default: m.PurchaseOrdersTab })));

type Tab = 'products' | 'suppliers' | 'purchase-orders' | 'adjustments' | 'kardex' | 'conteo-fisico';

const TABS = [
  { key: 'products' as const, label: 'Productos', icon: <Package size={16} /> },
  { key: 'suppliers' as const, label: 'Proveedores', icon: <Truck size={16} /> },
  { key: 'purchase-orders' as const, label: 'Órdenes de Compra', icon: <ShoppingCart size={16} /> },
  { key: 'adjustments' as const, label: 'Ajustes de Inventario', icon: <AlertTriangle size={16} /> },
  { key: 'kardex' as const, label: 'Kardex', icon: <FileText size={16} /> },
  { key: 'conteo-fisico' as const, label: 'Conteo Físico', icon: <ClipboardList size={16} /> },
];

const TAB_COMPONENTS: Record<Tab, React.ComponentType> = {
  products: ProductsTab,
  suppliers: SuppliersTab,
  'purchase-orders': PurchaseOrdersTab,
  adjustments: AdjustmentsTab,
  kardex: KardexTab,
  'conteo-fisico': ConteoFisicoTab,
};

function TabFallback() {
  return (
    <Card>
      <CardBody>
        <Skeleton height={200} />
      </CardBody>
    </Card>
  );
}

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');
  const Component = TAB_COMPONENTS[activeTab];

  return (
    <Stack gap="xl">
      <TabNav tabs={TABS} activeTab={activeTab} onTabChange={(key) => setActiveTab(key as Tab)} />
      <Suspense fallback={<TabFallback />}>
        <Component />
      </Suspense>
    </Stack>
  );
}