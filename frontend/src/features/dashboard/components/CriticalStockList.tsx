import { Card } from '@shared/ui/Card';
import { Table } from '@shared/ui/Table';
import { Text } from '@shared/ui/Text';

export function CriticalStockList({ products }: { products: any[] }) {
  const columns = [
    { key: 'name', header: 'Producto' },
    { key: 'barcode', header: 'Código' },
    { key: 'minStock', header: 'Mínimo', align: 'right' as const, render: (v: number) => `${v} u.` },
    {
      key: 'stock',
      header: 'Disponible',
      align: 'right' as const,
      render: (stock: number, idx: number) => {
        const isBelowMin = products[idx].stock < products[idx].minStock;
        return (
          <Text variant="bodySm" weight={isBelowMin ? 'semibold' : 'normal'} color={isBelowMin ? 'danger' : 'warning'}>
            {stock} u.
          </Text>
        );
      },
    },
  ];

  return (
    <Card>
      <Card.Header>
        <Card.Title>Alertas de stock crítico</Card.Title>
      </Card.Header>
      <Card.Body>
        {products.length === 0 ? (
          <Text variant="description">No hay productos con stock bajo.</Text>
        ) : (
          <Table
            data={products.slice(0, 10)}
            columns={columns}
            keyExtractor={(p) => p.id}
          />
        )}
      </Card.Body>
    </Card>
  );
}
