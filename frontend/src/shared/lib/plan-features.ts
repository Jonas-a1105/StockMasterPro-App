export type PlanTier = 'free' | 'pro' | 'enterprise';

export interface PlanFeature {
  id: string;
  label: string;
  free: boolean;
  pro: boolean;
  enterprise: boolean;
}

export const PLANS: Record<
  PlanTier,
  { name: string; price: number; description: string; badge?: string }
> = {
  free: {
    name: 'Free',
    price: 0,
    description: 'Gestión básica para un punto de venta o almacén pequeño.',
  },
  pro: {
    name: 'PRO',
    price: 39,
    description:
      'Ideal para negocios con personal a cargo, cuentas corrientes de clientes y control de inventario.',
    badge: 'MÁS ELEGIDO',
  },
  enterprise: {
    name: 'Enterprise',
    price: 79,
    description:
      'Auditoría avanzada para operaciones de alta facturación que requieren cuidar su margen de ganancia.',
  },
};

export const PLAN_FEATURES: PlanFeature[] = [
  { id: 'pos', label: 'Punto de Venta (POS)', free: true, pro: true, enterprise: true },
  { id: 'inventory', label: 'Catálogo de productos', free: true, pro: true, enterprise: true },
  { id: 'dashboard', label: 'Dashboard con KPIs', free: true, pro: true, enterprise: true },
  { id: 'reports', label: 'Reportes básicos', free: true, pro: true, enterprise: true },
  { id: 'products_50', label: 'Hasta 50 productos', free: true, pro: false, enterprise: false },
  { id: 'users_1', label: '1 usuario', free: true, pro: false, enterprise: false },
  { id: 'warehouse_1', label: '1 almacén', free: true, pro: false, enterprise: false },
  {
    id: 'products_unlimited',
    label: 'Productos ilimitados',
    free: false,
    pro: true,
    enterprise: true,
  },
  { id: 'users_5', label: 'Hasta 5 usuarios', free: false, pro: true, enterprise: false },
  { id: 'warehouses_2', label: 'Hasta 2 almacenes', free: false, pro: true, enterprise: false },
  {
    id: 'inventory_adj',
    label: 'Ajustes de inventario (mermas)',
    free: false,
    pro: true,
    enterprise: true,
  },
  { id: 'purchase_orders', label: 'Órdenes de compra', free: false, pro: true, enterprise: true },
  { id: 'kardex', label: 'Movimientos Kardex', free: false, pro: true, enterprise: true },
  {
    id: 'customers_credit',
    label: 'Clientes con crédito',
    free: false,
    pro: true,
    enterprise: true,
  },
  { id: 'accounts_payable', label: 'Cuentas por pagar', free: false, pro: true, enterprise: true },
  { id: 'expenses', label: 'Gastos fijos', free: false, pro: true, enterprise: true },
  { id: 'best_sellers', label: 'Reporte Best-Sellers', free: false, pro: true, enterprise: true },
  { id: 'net_profit', label: 'Utilidad neta', free: false, pro: true, enterprise: true },
  { id: 'low_stock', label: 'Alertas de stock bajo', free: false, pro: true, enterprise: true },
  { id: 'data_export', label: 'Exportación de datos', free: false, pro: true, enterprise: true },
  { id: 'calendar', label: 'Agenda digital', free: false, pro: true, enterprise: true },
  {
    id: 'multiple_carts',
    label: 'Múltiples carritos en espera',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    id: 'payment_methods',
    label: 'Pago con tarjeta y transferencia',
    free: false,
    pro: true,
    enterprise: true,
  },
  {
    id: 'users_unlimited',
    label: 'Usuarios ilimitados',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'warehouses_unlimited',
    label: 'Almacenes ilimitados',
    free: false,
    pro: false,
    enterprise: true,
  },
  { id: 'credit_notes', label: 'Notas de crédito', free: false, pro: false, enterprise: true },
  { id: 'suppliers', label: 'Gestión de proveedores', free: false, pro: false, enterprise: true },
  {
    id: 'multiple_warehouses',
    label: 'Multi-sucursal / almacén',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'pwa_offline',
    label: 'PWA offline (POS sin internet)',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'ui_customization',
    label: 'Personalización completa de UI',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'exchange_rate',
    label: 'API tasa de cambio automática',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'admin_panel',
    label: 'Panel de administración',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'desktop_app',
    label: 'App de escritorio (Tauri)',
    free: false,
    pro: false,
    enterprise: true,
  },
  {
    id: 'priority_support',
    label: 'Soporte prioritario',
    free: false,
    pro: false,
    enterprise: true,
  },
];

export function getFeaturesForPlan(tier: PlanTier): PlanFeature[] {
  return PLAN_FEATURES.filter((f) => f[tier]);
}

export function isFeatureAllowed(featureId: string, tier: PlanTier): boolean {
  const feature = PLAN_FEATURES.find((f) => f.id === featureId);
  return feature ? feature[tier] : false;
}

export function getPlanLimits(tier: PlanTier) {
  const limits: Record<
    PlanTier,
    { maxProducts: number | null; maxUsers: number | null; maxWarehouses: number | null }
  > = {
    free: { maxProducts: 50, maxUsers: 1, maxWarehouses: 1 },
    pro: { maxProducts: null, maxUsers: 5, maxWarehouses: 2 },
    enterprise: { maxProducts: null, maxUsers: null, maxWarehouses: null },
  };
  return limits[tier];
}
