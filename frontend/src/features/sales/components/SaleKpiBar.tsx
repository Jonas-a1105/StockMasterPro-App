import { KpiGrid } from '@features/shared-ui/KpiGrid';
import { ShoppingCart, DollarSign, CreditCard, ShoppingBag, Package } from 'lucide-react';

interface SaleKpiBarProps {
  dailySummary: any;
  filteredSales: any[];
  formatPrice: (val: number) => string;
}

export function SaleKpiBar({ dailySummary, filteredSales, formatPrice }: SaleKpiBarProps) {
  const totalListed = filteredSales.reduce((s: number, sale: any) => s + Number(sale.total), 0);

  const kpiItems = [
    {
      label: 'Ventas del día',
      value: dailySummary?.count ?? '—',
      icon: <ShoppingCart size={22} />,
      color: 'var(--color-primary)',
    },
    {
      label: 'Total del día',
      value: formatPrice(dailySummary?.total ?? 0),
      icon: <DollarSign size={22} />,
      color: 'var(--color-success)',
    },
    {
      label: 'Total listado',
      value: formatPrice(totalListed),
      icon: <DollarSign size={22} />,
      color: 'var(--color-warning)',
    },
    {
      label: 'Productos vendidos',
      value: filteredSales.reduce((s: number, sale: any) => s + (sale.items?.reduce((a: number, i: any) => a + (i.quantity || 0), 0) || 0), 0),
      icon: <Package size={22} />,
      color: 'var(--color-info)',
    },
  ];

  return <KpiGrid items={kpiItems} />;
}