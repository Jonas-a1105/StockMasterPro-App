import { Button } from '@shared/ui';
import { Eye, Edit2, Trash2 } from 'lucide-react';

interface ProductActionsProps {
  product: any;
  onView: () => void;
  onEdit: () => void;
  onDelete: () => void;
  canManage?: boolean;
}

export function ProductActions({ product: _product, onView, onEdit, onDelete, canManage = true }: ProductActionsProps) {
  if (!canManage) return null;

  return (
    <div className="flex items-center justify-center gap-1.5">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onView}
        aria-label="Ver producto"
      >
        <Eye size={14} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onEdit}
        aria-label="Editar producto"
      >
        <Edit2 size={14} />
      </Button>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={onDelete}
        aria-label="Eliminar producto"
        color="danger"
      >
        <Trash2 size={14} />
      </Button>
    </div>
  );
}