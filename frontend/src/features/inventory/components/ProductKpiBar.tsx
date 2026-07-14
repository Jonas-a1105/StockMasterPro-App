// src/features/inventory/components/ProductKpiBar.tsx
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { KpiGrid } from '@shared/ui'; // <-- ¡Mudado al sistema de diseño compartido!
import shoppingBagData from '@assets/lottie/shopping-bag.json';
import analyticsData from '@assets/lottie/analytics.json';
import walletData from '@assets/lottie/wallet.json';
import creditCardData from '@assets/lottie/credit-card.json';
import warningData from '@assets/lottie/warning.json';

export function ProductKpiBar({ products }: { products: any[] }) {
  const { formatUsd, formatBs } = useExchangeRate();

  const totalProducts = products.length;
  const totalStock = products.reduce((sum: number, p: any) => sum + p.stock, 0);
  const totalValuationUsd = products.reduce((sum: number, p: any) => sum + p.cost * p.stock, 0);
  const lowStockCount = products.filter((p: any) => p.stock <= p.minStock && p.minStock > 0).length;

  const kpiItems = [
    {
      value: totalProducts,
      label: 'Productos',
      lottie: shoppingBagData,
      color: 'var(--color-primary)',
    },
    {
      value: totalStock,
      label: 'Stock Total',
      lottie: analyticsData,
      color: 'var(--color-teal)',
    },
    {
      value: formatUsd(totalValuationUsd),
      label: 'Valoración ($)',
      lottie: walletData,
      color: 'var(--color-success)',
    },
    {
      value: formatBs(totalValuationUsd),
      label: 'Valoración (Bs)',
      lottie: creditCardData,
      color: 'var(--color-purple)',
    },
    {
      value: lowStockCount,
      label: 'Stock Bajo',
      lottie: warningData,
      color: 'var(--color-danger)',
    },
  ];

  return <KpiGrid items={kpiItems} />;
}