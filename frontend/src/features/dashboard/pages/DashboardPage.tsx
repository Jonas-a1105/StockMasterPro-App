import { useDashboard } from '../hooks/useDashboard';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useTheme } from '@contexts/ThemeContext';
import { SkeletonKPI, SkeletonChart } from '@shared/ui/Skeleton';
import { KpiGrid } from '@shared/ui';
import { SalesTrendChart } from '../components/SalesTrendChart';
import { TopSellersDonut } from '../components/TopSellersDonut';
import { RecentActivity } from '../components/RecentActivity';
import { CriticalStockList } from '../components/CriticalStockList';
import { EventsCalendar } from '../components/EventsCalendar';
import walletData from '@assets/lottie/wallet.json';
import creditCardData from '@assets/lottie/credit-card.json';
import shoppingBagData from '@assets/lottie/shopping-bag.json';
import analyticsData from '@assets/lottie/analytics.json';
import warningData from '@assets/lottie/warning.json';
import trendingUpData from '@assets/lottie/trending-up.json';
import styles from './DashboardPage.module.css';

export function DashboardPage() {
  const {
    summary,
    products,
    loading,
    lowStockProducts,
    recentActivity,
    totalStock,
    salesChartData,
    bestSellersData,
    netProfit,
    todaySales,
  } = useDashboard();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();

  if (loading) {
    return (
      <>
        <SkeletonKPI count={6} />
        <div className={`${styles.grid} ${styles.mt16}`}>
          <div className={styles.card}>
            <SkeletonChart height={250} />
          </div>
          <div className={styles.card}>
            <SkeletonChart height={250} />
          </div>
        </div>
      </>
    );
  }

  const kpiItems = [
    {
      value: formatPrice(summary.total),
      label: 'Ventas hoy',
      lottie: walletData,
      color: 'var(--color-primary)',
    },
    {
      value: summary.count,
      label: 'Transacciones',
      lottie: creditCardData,
      color: 'var(--color-purple)',
    },
    {
      value: products.length,
      label: 'Productos',
      lottie: shoppingBagData,
      color: 'var(--color-success)',
    },
    {
      value: totalStock,
      label: 'Stock total',
      lottie: analyticsData,
      color: 'var(--color-teal)',
    },
    {
      value: lowStockProducts.length,
      label: 'Stock bajo',
      lottie: warningData,
      color: 'var(--color-danger)',
    },
    {
      value: formatPrice(netProfit),
      label: 'Utilidad neta',
      lottie: trendingUpData,
      color: 'var(--color-primary)',
    },
  ];

  return (
    <div className={styles.container}>
      <KpiGrid items={kpiItems} />
      <div className={styles.grid}>
        <SalesTrendChart data={salesChartData} />
        <TopSellersDonut data={bestSellersData} />
      </div>
      <div className={styles.grid3}>
        <RecentActivity activities={recentActivity} />
        <CriticalStockList products={lowStockProducts} />
        <EventsCalendar todaySales={todaySales} lowStockProducts={lowStockProducts} />
      </div>
    </div>
  );
}
