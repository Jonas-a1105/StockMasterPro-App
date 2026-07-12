import { useState, useRef } from 'react';
import { Plus, X } from 'lucide-react';
import { Modal } from '@shared/ui/Modal';
import { ButtonLoader } from '@shared/ui/ButtonLoader';
import { PremiumLockButton } from '@shared/ui/PremiumLockButton';
import { SearchableSelect } from '@shared/ui/SearchableSelect';
import { formatUsd } from '@shared/lib/format/currency';
import { api } from '@shared/lib/http/client';
import { useToast } from '@contexts/ToastContext';
import styles from '../pages/InventoryPage.module.css';

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
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nombre *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className={styles.field}>
              <label>Código de Barras</label>
              <input
                type="text"
                value={form.barcode}
                onChange={(e) => setForm((p) => ({ ...p, barcode: e.target.value }))}
              />
            </div>
            <div className={styles.field}>
              <label>Marca</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => setForm((p) => ({ ...p, brand: e.target.value }))}
                placeholder="Ej: Samsung, Nike..."
              />
            </div>
            <div className={styles.field}>
              <label>Precio de Venta ($) *</label>
              <input
                type="number"
                step="0.01"
                value={form.price || ''}
                onChange={(e) => setForm((p) => ({ ...p, price: Number(e.target.value) }))}
                required
                placeholder="0.00"
              />
            </div>
            <div className={styles.field}>
              <label>Costo ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.cost || ''}
                onChange={(e) => setForm((p) => ({ ...p, cost: Number(e.target.value) }))}
                placeholder="0.00"
              />
              {form.cost > 0 && form.price > 0 && form.price < form.cost && (
                <span className={styles.warningText}>
                  ⚠️ Precio por debajo del costo (margen negativo: -$
                  {formatUsd(form.cost - form.price)})
                </span>
              )}
            </div>
            <div className={styles.field}>
              <label>Stock</label>
              <input
                type="number"
                value={form.stock || ''}
                onChange={(e) => setForm((p) => ({ ...p, stock: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className={styles.field}>
              <label>Stock Mínimo</label>
              <input
                type="number"
                value={form.minStock || ''}
                onChange={(e) => setForm((p) => ({ ...p, minStock: Number(e.target.value) }))}
                placeholder="0"
              />
            </div>
            <div className={styles.field}>
              <label>Categoría</label>
              <div className={styles.categoryRow}>
                <SearchableSelect
                  value={form.categoryId}
                  onChange={(val) => setForm((p) => ({ ...p, categoryId: val }))}
                  options={categoryOptions}
                  placeholder="Sin categoría"
                />
                <button
                  type="button"
                  className={styles.quickAddBtn}
                  onClick={onShowNewCategory}
                  title="Crear categoría"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>
            <div className={styles.fieldFull}>
              <label>Imagen del Producto</label>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleImageUpload}
                disabled={uploading}
                className={styles.hidden}
                ref={fileInputRef}
              />
              <button
                type="button"
                className={styles.uploadBtn}
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
              >
                {uploading ? 'Subiendo...' : form.imageUrl ? 'Cambiar imagen' : 'Subir imagen'}
              </button>
              {form.imageUrl && (
                <div className={styles.imageWrapper}>
                  <img src={form.imageUrl} alt="Preview" className={styles.imagePreview} />
                  <button
                    type="button"
                    className={styles.removeImageBtn}
                    onClick={() => setForm((p) => ({ ...p, imageUrl: '' }))}
                    title="Eliminar imagen"
                  >
                    ×
                  </button>
                </div>
              )}
            </div>
            <div className={styles.fieldFull}>
              <label>Descripción</label>
              <textarea
                value={form.description}
                onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                rows={2}
              />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={onClose}>
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
              <button type="submit" className={styles.saveBtn} disabled={loading}>
                {loading ? <ButtonLoader /> : 'Guardar'}
              </button>
            )}
          </div>
        </form>
      </Modal>

      <Modal open={showNewCategory} onClose={onShowNewCategory} title="Nueva Categoría" small>
        <div className={styles.categoryFormContainer}>
          <input
            type="text"
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
            className={styles.categoryFormInput}
          />
          <div className={styles.categoryFormActions}>
            <button
              type="button"
              onClick={onShowNewCategory}
              className={styles.categoryFormCancelBtn}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={onCreateCategory}
              disabled={!newCategoryName.trim()}
              className={styles.categoryFormCreateBtn}
            >
              Crear
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
}
