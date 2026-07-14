import { useMemo } from 'react';
import { KpiGrid } from '@shared/ui';
import { DollarSign, ShoppingCart, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

interface KpiBarProps {
  dailySummary: any;
  filteredSales: any[];
  formatPrice: (value: number) => string;
}

export function KpiBar({ dailySummary, filteredSales, formatPrice }: KpiBarProps) {
  const todayRevenue = useMemo(() => 
    filteredSales.reduce((s, sale) => s + Number(sale.total), 0), 
    [filteredSales]
  );

  const todayCount = filteredSales.length;
  const avgTicket = todayCount > 0 ? todayRevenue / todayCount : 0;

  const kpiItems = [
    {
      value: formatPrice(todayRevenue),
      label: 'Ventas hoy',
      icon: <DollarSign size={22} />,
      color: 'var(--color-primary)',
    },
    {
      value: todayCount,
      label: 'Transacciones',
      icon: <ShoppingCart size={22} />,
      color: 'var(--color-purple)',
    },
    {
      value: formatPrice(avgTicket),
      label: 'Ticket promedio',
      icon: <TrendingUp size={22} />,
      color: 'var(--color-teal)',
    },
    {
      value: dailySummary?.totalSales || todayCount,
      label: 'Total del día',
      icon: <ArrowUp size={22} />,
      color: 'var(--color-success)',
    },
  ];

  return <KpiGrid items={kpiItems} />;
}