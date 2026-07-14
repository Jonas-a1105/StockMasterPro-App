// src/features/inventory/components/ProductTable/ProductTable.tsx
import { Eye, Edit2, Trash2, ArrowUpDown } from 'lucide-react';
import { DataTable, Text, Badge, Stack } from '@shared/ui';
import type { Product } from '../../types';

interface ProductTableProps {
  products: Product[];
  formatUsd: (val: number) => string;
  formatBs: (val: number) => string;
  canManage: boolean;
  getCategoryName: (catId: string | null) => string;
  onView: (product: Product) => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string, name: string) => void;
  sortField: string;
  sortDirection: 'asc' | 'desc';
  onSort: (field: string) => void;
}

export function ProductTable({
  products,
  formatUsd,
  formatBs,
  canManage,
  getCategoryName,
  onView,
  onEdit,
  onDelete,
  sortField,
  sortDirection,
  onSort,
}: ProductTableProps) {

  const SortHeader = ({ field, label, align }: { field: string; label: string; align?: 'left' | 'center' | 'right' }) => (
    <button
      onClick={() => onSort(field)}
      className={`flex itemsCenter gap1 hoverTextPrimary wFull ${
        align === 'right' ? 'justifyEnd' : align === 'center' ? 'justifyCenter' : 'justifyStart'
      }`}
    >
      <span>{label}</span> <ArrowUpDown size={14} />
    </button>
  );

  return (
    <DataTable
      data={products}
      keyExtractor={(item) => item.id}
      emptyMessage="No hay productos que coincidan con la búsqueda"
      simple
      columns={[
        {
          key: 'name',
          header: 'Producto / Categoría',
          render: (row) => (
            <Stack gap="xs">
              <Text weight="semibold">{row.name}</Text>
              <Text variant="caption" color="muted">
                {getCategoryName(row.categoryId)}
              </Text>
            </Stack>
          ),
        },
        {
          key: 'barcode',
          header: 'Código / Marca',
          render: (row) => (
            <Stack gap="xs">
              <Text>{row.barcode || '—'}</Text>
              <Text variant="caption" color="muted">
                {row.brand || 'Sin marca'}
              </Text>
            </Stack>
          ),
        },
        {
          key: 'price',
          header: <SortHeader field="price" label="Precio" align="right" />,
          align: 'right',
          render: (row) => (
            <Stack gap="xs" className="itemsEnd">
              <Text weight="semibold">{formatUsd(row.price)}</Text>
              <Text variant="caption" color="muted">{formatBs(row.price)}</Text>
            </Stack>
          ),
        },
        {
          key: 'cost',
          header: <SortHeader field="cost" label="Costo" align="right" />,
          align: 'right',
          render: (row) => (
            <Stack gap="xs" className="itemsEnd">
              <Text>{formatUsd(row.cost)}</Text>
              <Text variant="caption" color="muted">{formatBs(row.cost)}</Text>
            </Stack>
          ),
        },
        {
          key: 'profit',
          header: 'Ganancia Est.',
          align: 'right',
          render: (row) => {
            const profit = row.price - row.cost;
            return (
              <Stack gap="xs" className="itemsEnd">
                <Text color={profit > 0 ? 'success' : 'danger'} weight="medium">
                  {formatUsd(profit)}
                </Text>
                <Text variant="caption" color="muted">{formatBs(profit)}</Text>
              </Stack>
            );
          },
        },
        {
          key: 'stock',
          header: <SortHeader field="stock" label="Stock / Mín" align="center" />,
          align: 'center',
          render: (row) => (
            <Stack gap="xs" className="itemsCenter">
              <Text weight="medium">{row.stock}</Text>
              <Text variant="caption" color="muted">Mín: {row.minStock}</Text>
            </Stack>
          ),
        },
        {
          key: 'status',
          header: 'Estado',
          align: 'center',
          render: (row) => {
            const isLow = row.stock <= row.minStock && row.minStock > 0;
            return (
              <Badge variant={isLow ? 'danger' : 'success'}>
                {isLow ? 'Bajo Stock' : 'Disponible'}
              </Badge>
            );
          },
        },
        {
          key: 'actions',
          header: 'Acciones',
          align: 'center',
          render: (row) => (
            <div className="flex itemsCenter justifyCenter gap2">
              <button onClick={() => onView(row)} className="p1 textMuted hoverTextPrimary">
                <Eye size={16} />
              </button>
              {canManage && (
                <>
                  <button onClick={() => onEdit(row)} className="p1 textMuted hoverTextPrimary">
                    <Edit2 size={16} />
                  </button>
                  <button onClick={() => onDelete(row.id, row.name)} className="p1 textMuted hoverTextDanger">
                    <Trash2 size={16} />
                  </button>
                </>
              )}
            </div>
          ),
        },
      ]}
    />
  );
}