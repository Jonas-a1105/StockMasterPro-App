import { useDashboard } from '../hooks/useDashboard';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useTheme } from '@contexts/ThemeContext';
import { SkeletonKPI, SkeletonChart } from '@shared/ui/Skeleton';
import { KpiRow } from '../components/KpiRow';
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
  const { summary, products, loading, lowStockProducts, recentActivity, totalStock, salesChartData, bestSellersData, netProfit, todaySales } = useDashboard();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();

  if (loading && config.skeletonEnabled) {
    return (
      <>
        <SkeletonKPI count={6} />
        <div className={`${styles.grid} ${styles.mt16}`}>
          <div className={styles.card}><SkeletonChart height={250} /></div>
          <div className={styles.card}><SkeletonChart height={250} /></div>
        </div>
      </>
    );
  }

  const kpis = [
    { key: 'total', cls: styles.total, icon: walletData, title: 'Ventas hoy', value: formatPrice(summary.total) },
    { key: 'views', cls: styles.views, icon: creditCardData, title: 'Transacciones', value: summary.count },
    { key: 'visitors', cls: styles.visitors, icon: shoppingBagData, title: 'Productos', value: products.length },
    { key: 'shares', cls: styles.shares, icon: analyticsData, title: 'Stock total', value: totalStock },
    { key: 'low', cls: styles.low, icon: warningData, title: 'Stock bajo', value: lowStockProducts.length },
    { key: 'profit', cls: styles.profit, icon: trendingUpData, title: 'Utilidad neta', value: formatPrice(netProfit) },
  ];

  return (
    <div className={styles.container}>
      <KpiRow kpis={kpis} />
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
