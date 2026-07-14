import { Button } from '@shared/ui';
import { ChevronUpDown } from 'lucide-react';
import type { SortDirection } from '../../types';

interface SortDropdownProps {
  sortField: string;
  sortDirection: SortDirection;
  onSort: (field: string) => void;
}

export function SortDropdown({ sortField, sortDirection, onSort }: SortDropdownProps) {
  const fields = [
    { key: 'name', label: 'Nombre' },
    { key: 'brand', label: 'Marca' },
    { key: 'category', label: 'Categoría' },
    { key: 'barcode', label: 'Código' },
    { key: 'price', label: 'Precio ($)' },
    { key: 'cost', label: 'Costo ($)' },
    { key: 'stock', label: 'Stock' },
    { key: 'minStock', label: 'Stock Mín.' },
  ];

  return (
    <div className="relative">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => onSort(sortField || 'name')}
        leftIcon={<ChevronUpDown size={14} />}
      >
        Ordenar: {sortField ? `${fields.find(f => f.key === sortField)?.label || sortField} ${sortDirection === 'asc' ? '↑' : '↓'}` : 'Por defecto'}
      </Button>
    </div>
  );
}