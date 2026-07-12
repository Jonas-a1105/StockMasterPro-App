import { useState, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { PremiumLockButton } from '@shared/ui/PremiumLockButton';
import { SearchableSelect } from '@shared/ui/SearchableSelect';
import { FormField } from '@shared/ui/FormField';
import { Input } from '@shared/ui/Input';
import { formatUsd } from '@shared/lib/format/currency';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';

export interface ProductFormData {
  name: string;
  barcode: string;
  price: number;
  cost: number;
  stock: number;
  minStock: number;
  description: string;
  brand: string;
  imageUrl: string;
  categoryId: string;
}

export function ProductForm({
  open,
  editingId,
  initialData,
  onClose,
  onSubmit,
  loading,
  isLimitExceeded,
  nextRequiredPlan,
  categories,
  onShowNewCategory,
  showNewCategory,
  newCategoryName,
  onNewCategoryNameChange,
  onCreateCategory,
}: {
  open: boolean;
  editingId: string | null;
  initialData: ProductFormData;
  onClose: () => void;
  onSubmit: (data: ProductFormData) => Promise<void>;
  loading: boolean;
  isLimitExceeded: boolean;
  nextRequiredPlan: string;
  categories: { id: string; name: string }[];
  onShowNewCategory: () => void;
  showNewCategory: boolean;
  newCategoryName: string;
  onNewCategoryNameChange: (value: string) => void;
  onCreateCategory: () => void;
}) {
  const [form, setForm] = useState<ProductFormData>(initialData);
  const [uploading, setUploading] = useState(false);
  const { showToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const categoryOptions = [
    { value: '', label: 'Sin categoría' },
    ...categories.map((c) => ({ value: c.id, label: c.name })),
  ];

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match(/^image\/(jpeg|png|webp|gif)$/)) {
      showToast('Solo se permiten imágenes (jpg, png, webp, gif)', 'error');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await api.post('/uploads/image', formData);
      setForm((p) => ({ ...p, imageUrl: res.url }));
      showToast('Imagen subida correctamente', 'success');
    } catch (err: any) {
      showToast(err.message || 'Error al subir imagen', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.cost > 0 && form.price < form.cost) {
      if (
        !window.confirm(
          `⚠️ El precio de venta (${formatUsd(form.price)}) es menor que el costo (${formatUsd(form.cost)}).\n\nEsto genera pérdida en cada venta. ¿Desea continuar?`
        )
      )
        return;
    }
    await onSubmit(form);
  };

  return (
    <>
      <Modal
        open={open && !showNewCategory}
        onClose={onClose}
        title={editingId ? 'Editar Producto' : 'Nuevo Producto'}
      >
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <FormField label="Nombre *" required>
              <Input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Nombre del producto"
                required
              />
            </FormField>

            <FormField label="Código de Barras">
              <Input
                value={form.barcode}
                onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
                placeholder="Código de barras"
              />
            </FormField>

            <FormField label="Marca">
              <Input
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                placeholder="Ej: Samsung, Nike..."
              />
            </FormField>

            <FormField label="Precio de Venta ($) *" required>
              <Input
                type="number"
                step="0.01"
                value={form.price || ''}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                placeholder="0.00"
                required
              />
            </FormField>

            <FormField label="Costo ($)">
              <Input
                type="number"
                step="0.01"
                value={form.cost || ''}
                onChange={(e) => setForm((p) => ({ ...p, cost: Number(e.target.value) }))}
                placeholder="0.00"
              />
              {form.cost > 0 && form.price > 0 && form.price < form.cost && (
                <p className="text-xs text-warning mt-1">
                  ⚠️ Precio por debajo del costo (margen negativo: -${formatUsd(form.cost - form.price)})
                </p>
              )}
            </FormField>

            <FormField label="Stock">
              <Input
                type="number"
                value={form.stock || ''}
                onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                placeholder="0"
              />
            </FormField>

            <FormField label="Stock Mínimo">
              <Input
                type="number"
                value={form.minStock || ''}
                onChange={(e) => setForm((p) => ({ ...p, minStock: Number(e.target.value) }))}
                placeholder="0"
              />
            </FormField>

            <FormField label="Categoría" className="md:col-span-2">
              <div className="flex gap-2">
                <SearchableSelect
                  value={form.categoryId}
                  onChange={(val) => setForm((p) => ({ ...p, categoryId: val }))}
                  options={categoryOptions}
                  placeholder="Sin categoría"
                  className="flex-1"
                />
                <button
                  type="button"
                  className="w-10 h-10 rounded-lg border border-primary bg-transparent text-primary hover:bg-primary/5 flex items-center justify-center transition-colors"
                  onClick={onShowNewCategory}
                  title="Crear categoría"
                >
                  <Plus size={18} />
                </button>
              </div>
            </FormField>

            <FormField label="Imagen del Producto" className="md:col-span-3">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                ref={fileInputRef}
              />
              <button
                type="button"
                className="inline-flex items-center justify-center px-4 py-2 border border-border rounded-lg bg-surface text-text text-sm font-medium cursor-pointer hover:border-primary hover:text-primary transition-colors disabled:opacity-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Subiendo...' : form.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              {form.imageUrl && (
                <div className="mt-2 flex items-center gap-2">
                  <img src={form.imageUrl} alt="Preview" className="w-16 h-16 rounded-lg object-cover border border-border" />
                  <button
                    type="button"
                    className="text-text-muted hover:text-danger transition-colors text-xl leading-none"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              )}
            </FormField>

            <FormField label="Descripción" className="md:col-span-3">
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                className="w-full px-3 py-2 border border-border rounded-lg bg-surface text-text placeholder-text-muted focus:outline-none focus:border-primary"
              />
            </FormField>
          </div>

          <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
            <button type="button" className="px-4 py-2 border border-border rounded-lg text-text hover:bg-bg-hover transition-colors" onClick={onClose}>
              Cancelar
            </button>
            {isLimitExceeded ? (
              <PremiumLockButton
                requiredPlan={nextRequiredPlan as any}
                width="140px"
                height="38px"
                label="Límite Superado"
                sublabel="Mantén pulsado para ampliar"
              />
            ) : (
              <button type="submit" className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50" disabled={loading}>
                {loading ? <ButtonLoader /> : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </Modal>

      <Modal open={showNewCategory} onClose={onShowNewCategory} title="Nueva Categoría" small>
        <div className="space-y-4">
          <Input
            value={newCategoryName}
            onChange={(e) => onNewCategoryNameChange(e.target.value)}
            placeholder="Nombre de la categoría"
            autoFocus
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onCreateCategory();
              }
            }}
          />
          <div className="flex justify-end gap-2">
            <button type="button" onClick={onShowNewCategory} className="px-4 py-2 border border-border rounded-lg text-text hover:bg-bg-hover transition-colors">
              Cancelar
            </button>
            <button
              type="button"
              onClick={onCreateCategory}
              disabled={!newCategoryName.trim()}
              className="px-4 py-2 bg-primary text-white rounded-lg font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              Crear
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}