import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { LottieIcon } from '@shared/ui/LottieIcon';
import { useState } from 'react';
import { Card } from '@shared/ui/Card';
import { Text } from '@shared/ui/Text';
import shoppingBagData from '@assets/lottie/shopping-bag.json';
import analyticsData from '@assets/lottie/analytics.json';
import walletData from '@assets/lottie/wallet.json';
import creditCardData from '@assets/lottie/credit-card.json';
import warningData from '@assets/lottie/warning.json';

export function ProductKpiBar({ products }: { products: any[] }) {
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);
  const { formatUsd, formatBs } = useExchangeRate();

  const totalProducts = products.length;
  const totalStock = products.reduce((sum: number, p: any) => sum + p.stock, 0);
  const totalValuationUsd = products.reduce((sum: number, p: any) => sum + p.cost * p.stock, 0);
  const lowStockCount = products.filter((p: any) => p.stock <= p.minStock && p.minStock > 0).length;

  const kpiItems = [
    {
      key: 'products',
      icon: shoppingBagData,
      value: totalProducts,
      label: 'Productos',
      color: 'primary',
    },
    {
      key: 'stock',
      icon: analyticsData,
      value: totalStock,
      label: 'Stock Total',
      color: 'teal',
    },
    {
      key: 'valuationUsd',
      icon: walletData,
      value: formatUsd(totalValuationUsd),
      label: 'Valoración ($)',
      color: 'success',
    },
    {
      key: 'valuationBs',
      icon: creditCardData,
      value: formatBs(totalValuationUsd),
      label: 'Valoración (Bs)',
      color: 'purple',
    },
    {
      key: 'lowStock',
      icon: warningData,
      value: lowStockCount,
      label: 'Stock Bajo',
      color: 'danger',
    },
  ];

  const colorMap: Record<string, string> = {
    primary: 'var(--color-primary)',
    teal: 'var(--color-teal)',
    success: 'var(--color-success)',
    purple: 'var(--color-purple)',
    danger: 'var(--color-danger)',
  };

  return (
    <div className="flex flex-wrap gap-4">
      {kpiItems.map((k) => (
        <Card
          key={k.key}
          className="flex-1 min-w-[180px] max-w-[240px]"
          style={{ '--kpi-color': colorMap[k.color] } as React.CSSProperties}
          onMouseEnter={() => setHoveredKpi(k.key)}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <Card.Body className="p-4 flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: `var(--kpi-color, var(--color-primary))` }}
            >
              <LottieIcon data={k.icon} size={20} play={hoveredKpi === k.key} />
            </div>
            <div className="min-w-0">
              <Text variant="h4" weight="semibold" style={{ color: 'var(--kpi-color, var(--color-primary))' }}>
                {k.value}
              </Text>
              <Text variant="label" color="muted">
                {k.label}
              </Text>
            </div>
          </Card.Body>
        </Card>
      ))}
    </div>
  );
}