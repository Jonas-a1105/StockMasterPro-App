import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { Card } from '@shared/ui/Card';
import { Table } from '@shared/ui/Table';
import { Text } from '@shared/ui/Text';

const COLORS = ['#a3a3a3', '#22c55e', '#eab308', '#f97316', '#3b82f6'];

export function TopSellersDonut({
  data,
}: {
  data: { items: { name: string; qty: number; total: number; share: number }[]; totalQty: number };
}) {
  const { formatUsd } = useExchangeRate();

  if (data.items.length === 0) {
    return (
      <Card>
        <Card.Header>
          <Card.Title as="h4">Participación de top ventas</Card.Title>
        </Card.Header>
        <Card.Body>
          <Text variant="description">No hay datos de ventas.</Text>
        </Card.Body>
      </Card>
    );
  }

  const columns = [
    {
      key: 'name',
      header: 'Producto',
      render: (item: typeof data.items[0]) => (
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full" style={{ backgroundColor: COLORS[data.items.indexOf(item)] }} />
          <Text variant="bodySm" weight="semibold" title={item.name}>
            {item.name.length > 22 ? item.name.slice(0, 20) + '...' : item.name}
          </Text>
        </div>
      ),
    },
    { key: 'qty', header: 'Cant.', align: 'right' as const, render: (v: number) => `${v} u.` },
    { key: 'total', header: 'Ingreso', align: 'right' as const, render: (v: number) => formatUsd(v) },
    { key: 'share', header: '% Share', align: 'right' as const, render: (v: number) => `${v}%` },
  ];

  return (
    <Card>
      <Card.Header>
        <Card.Title as="h4">Participación de top ventas</Card.Title>
      </Card.Header>
      <Card.Body>
        <div className="grid grid-cols-[5fr_7fr] gap-4">
          <div className="relative flex items-center justify-center" style={{ height: 200 }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.items}
                  dataKey="qty"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={58}
                  outerRadius={82}
                  paddingAngle={4}
                  cornerRadius={6}
                  stroke="none"
                >
                  {data.items.map((_, index) => (
                    <Cell key={index} fill={COLORS[index]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--color-surface)',
                    border: '1px solid var(--color-border)',
                    fontSize: '12px',
                    borderRadius: 'var(--card-radius)',
                  }}
                  labelStyle={{ color: 'var(--color-text)' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
              <div className="text-center">
                <Text variant="caption" weight="semibold" color="muted">
                  Total
                </Text>
                <Text variant="h3" weight="bold">
                  {data.totalQty} u.
                </Text>
              </div>
            </div>
          </div>
          <Table
            data={data.items}
            columns={columns}
            keyExtractor={(_, i) => String(i)}
          />
        </div>
      </Card.Body>
    </Card>
  );
}
