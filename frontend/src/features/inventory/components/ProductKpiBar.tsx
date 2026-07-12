import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { LottieIcon } from '@shared/ui/LottieIcon';
import { useState } from 'react';
import shoppingBagData from '@assets/lottie/shopping-bag.json';
import analyticsData from '@assets/lottie/analytics.json';
import walletData from '@assets/lottie/wallet.json';
import creditCardData from '@assets/lottie/credit-card.json';
import warningData from '@assets/lottie/warning.json';
import styles from '../pages/InventoryPage.module.css';

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
      color: 'var(--color-orange-red)',
    },
    {
      key: 'stock',
      icon: analyticsData,
      value: totalStock,
      label: 'Stock Total',
      color: 'var(--color-teal)',
    },
    {
      key: 'valuationUsd',
      icon: walletData,
      value: formatUsd(totalValuationUsd),
      label: 'Valoración ($)',
      color: 'var(--color-green)',
    },
    {
      key: 'valuationBs',
      icon: creditCardData,
      value: formatBs(totalValuationUsd),
      label: 'Valoración (Bs)',
      color: 'var(--color-purple)',
    },
    {
      key: 'lowStock',
      icon: warningData,
      value: lowStockCount,
      label: 'Stock Bajo',
      color: 'var(--color-red)',
      danger: true,
    },
  ];

  return (
    <div className={styles.kpiContainer}>
      {kpiItems.map((k) => (
        <div
          key={k.key}
          className={styles.kpiCard}
          style={{ '--kpi-color': k.color } as React.CSSProperties}
          onMouseEnter={() => setHoveredKpi(k.key)}
          onMouseLeave={() => setHoveredKpi(null)}
        >
          <div className={styles.kpiIconWrapper}>
            <LottieIcon data={k.icon} size={22} play={hoveredKpi === k.key} />
          </div>
          <div className={styles.kpiContent}>
            <span
              className={styles.kpiValue}
              style={(k as any).danger ? { color: 'var(--color-red)' } : {}}
            >
              {k.value}
            </span>
            <span className={styles.kpiLabel}>{k.label}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
