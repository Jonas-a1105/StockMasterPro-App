import { useState, useRef } from 'react';
import { Plus, X, Upload } from 'lucide-react';
import { Modal, ConfirmModal, Button, FormField, Input, Textarea, SearchableSelect, Stack, Flex, Grid, Text, ImageContainer } from '@shared/ui';
import { PremiumLockButton } from '@features/billing/components/PremiumLockButton';
import { formatUsd } from '@shared/lib/format/currency';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import type { ProductFormData } from '../../types';

interface ProductFormProps {
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
}: ProductFormProps) {
  const [form, setForm] = useState<ProductFormData>(initialData);
  const [uploading, setUploading] = useState(false);
  const [showPriceWarning, setShowPriceWarning] = useState(false);
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
      setShowPriceWarning(true);
      return;
    }
    await onSubmit(form);
  };

  const confirmPriceWarning = async () => {
    setShowPriceWarning(false);
    await onSubmit(form);
  };

  const cancelPriceWarning = () => {
    setShowPriceWarning(false);
  };

  return (
    <>
      <Modal open={open && !showNewCategory} onClose={onClose} title={editingId ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit}>
          <Grid columns={{ base: 1, md: 2, lg: 3 }} gap="md">
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
                <Text variant="caption" color="warning" className="mt-1">
                  ⚠️ Precio por debajo del costo (margen negativo: -{formatUsd(form.cost - form.price)})
                </Text>
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

            <FormField label="Categoría" columnSpan={{ md: 2 }}>
              <Flex gap="sm" align="start">
                <SearchableSelect
                  value={form.categoryId}
                  onChange={(val) => setForm((p) => ({ ...p, categoryId: val }))}
                  options={categoryOptions}
                  placeholder="Sin categoría"
                  flex="1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={onShowNewCategory}
                  aria-label="Crear categoría"
                >
                  <Plus size={18} />
                </Button>
              </Flex>
            </FormField>

            <FormField label="Imagen del Producto" columnSpan={3}>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                className="hidden"
                ref={fileInputRef}
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                leftIcon={<Upload size={14} />}
              >
                {uploading ? 'Subiendo...' : form.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
              </Button>
              {form.imageUrl && (
                <Flex gap="sm" align="center" className="mt-2">
                  <ImageContainer src={form.imageUrl} alt="Preview" aspectRatio="1" width={64} height={64} />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                    aria-label="Eliminar imagen"
                  >
                    <X size={18} />
                  </Button>
                </Flex>
              )}
            </FormField>

            <FormField label="Descripción" columnSpan={3}>
              <Textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
                placeholder="Descripción del producto"
              />
            </FormField>
          </Grid>

          <Flex justify="end" gap="sm" className="mt-6 pt-4 border-t">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancelar
            </Button>
            {isLimitExceeded ? (
              <PremiumLockButton
                requiredPlan={nextRequiredPlan as any}
                width="140px"
                height="38px"
                label="Límite Superado"
                sublabel="Mantén pulsado para ampliar"
              />
            ) : (
              <Button type="submit" loading={loading}>
                Guardar
              </Button>
            )}
          </Flex>
        </form>
      </Modal>

      <ConfirmModal
        open={showPriceWarning}
        onClose={cancelPriceWarning}
        onConfirm={confirmPriceWarning}
        title="Precio por debajo del costo"
        message={`El precio de venta (${formatUsd(form.price)}) es menor que el costo (${formatUsd(form.cost)}).
Esto genera pérdida en cada venta. ¿Desea continuar?`}
        confirmText="Continuar"
        cancelText="Cancelar"
        type="warning"
      />

      <Modal open={showNewCategory} onClose={onShowNewCategory} title="Nueva Categoría" small>
        <Stack gap="md">
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
          <Flex justify="end" gap="sm">
            <Button type="button" variant="secondary" onClick={onShowNewCategory}>
              Cancelar
            </Button>
            <Button onClick={onCreateCategory} disabled={!newCategoryName.trim()}>
              Crear
            </Button>
          </Flex>
        </Stack>
      </Modal>
    </>
  );
}
