import { KpiGrid } from '@features/shared-ui/KpiGrid';
import { Users, CreditCard, AlertTriangle, DollarSign } from 'lucide-react';

interface CustomerKpiBarProps {
  customers: any[];
}

export function CustomerKpiBar({ customers }: CustomerKpiBarProps) {
  const totalCustomers = customers.length;
  const withDebt = customers.filter(c => c.balance > 0).length;
  const overLimit = customers.filter(c => c.creditLimit > 0 && c.balance >= c.creditLimit).length;
  const totalDebt = customers.reduce((sum, c) => sum + Math.max(0, c.balance), 0);

  const kpiItems = [
    {
      value: totalCustomers,
      label: 'Total clientes',
      icon: <Users size={22} />,
      color: 'var(--color-primary)',
    },
    {
      value: withDebt,
      label: 'Con deuda',
      icon: <CreditCard size={22} />,
      color: 'var(--color-warning)',
    },
    {
      value: overLimit,
      label: 'Límite excedido',
      icon: <AlertTriangle size={22} />,
      color: 'var(--color-danger)',
    },
    {
      value: formatUsd(totalDebt),
      label: 'Deuda total',
      icon: <DollarSign size={22} />,
      color: 'var(--color-success)',
    },
  ];

  if (kpiItems.length === 0) return null;

  return <KpiGrid items={kpiItems} />;
}

function formatUsd(value: number): string {
  return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', minimumFractionDigits: 2 }).format(value);
}