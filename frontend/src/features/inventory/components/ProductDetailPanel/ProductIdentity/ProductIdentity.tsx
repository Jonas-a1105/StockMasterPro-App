import { Stack, Text, Card, Grid, Badge } from '@shared/ui';

interface ProductIdentityProps {
  product: any;
  getCategoryName: (id: string | null) => string;
}

export function ProductIdentity({ product, getCategoryName }: ProductIdentityProps) {
  const isLowStock = product.stock <= product.minStock && product.minStock > 0;

  return (
    <Stack gap="md">
      <Stack gap="xs">
        <Text variant="label" color="muted">NOMBRE</Text>
        <Text variant="h3" weight="bold" className="product-name">
          {product.name}
        </Text>
      </Stack>

      <Grid columns={{ base: 1, sm: 2 }} gap="md">
        <Stack gap="xs">
          <Text variant="label" color="muted">MARCA</Text>
          <Text variant="body">{product.brand || '—'}</Text>
        </Stack>
        <Stack gap="xs">
          <Text variant="label" color="muted">CATEGORÍA</Text>
          <Text variant="body">{getCategoryName(product.categoryId)}</Text>
        </Stack>
      </Grid>

      <Grid columns={{ base: 1, sm: 2 }} gap="md">
        <Stack gap="xs">
          <Text variant="label" color="muted">CÓDIGO DE BARRAS</Text>
          <Text variant="body" fontFamily="mono" className="value-mono">
            {product.barcode || '—'}
          </Text>
        </Stack>
        <Stack gap="xs">
          <Text variant="label" color="muted">STOCK ACTUAL</Text>
          <Stack direction="row" gap="xs" alignItems="baseline">
            <Text variant="h4" weight="bold" className="value-stock">
              {product.stock}
            </Text>
            {product.minStock > 0 && (
              <Text variant="caption" color="muted" className="stock-min">
                (mín: {product.minStock})
              </Text>
            )}
          </Stack>
        </Stack>
      </Grid>

      {isLowStock && (
        <Badge variant="danger" size="sm">
          Stock Bajo
        </Badge>
      )}

      {product.description && (
        <Card padding="md" className="bg-bg rounded-lg">
          <Stack gap="xs">
            <Text variant="label" color="muted">DESCRIPCIÓN</Text>
            <Text variant="body" className="description">
              {product.description}
            </Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}