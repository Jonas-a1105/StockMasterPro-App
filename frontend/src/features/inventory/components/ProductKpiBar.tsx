import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { KpiGrid } from '@shared/ui/KpiGrid';

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
      lottie: 'bag' as const,
      color: 'var(--color-primary)',
    },
    {
      value: totalStock,
      label: 'Stock Total',
      lottie: 'analytics' as const,
      color: 'var(--color-teal)',
    },
    {
      value: formatUsd(totalValuationUsd),
      label: 'Valoración ($)',
      lottie: 'wallet' as const,
      color: 'var(--color-success)',
    },
    {
      value: formatBs(totalValuationUsd),
      label: 'Valoración (Bs)',
      lottie: 'card' as const,
      color: 'var(--color-purple)',
    },
    {
      value: lowStockCount,
      label: 'Stock Bajo',
      lottie: 'warning' as const,
      color: 'var(--color-danger)',
    },
  ];

  return <KpiGrid items={kpiItems} />;
}