// src/features/inventory/components/ProductsTab.tsx
import { useState, useCallback, useMemo } from 'react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useProducts } from '../../hooks/useProducts';
import {
  createInventoryProduct,
  updateInventoryProduct,
  deleteInventoryProduct,
  getInventoryMovements,
  createCategory,
} from '../../api/inventory.api';
import { ProductKpiBar } from '../ProductKpiBar';
import { ProductForm, type ProductFormData } from '../ProductForm';
import { ProductDetailPanel } from '../ProductDetailPanel';
import { ProductTable } from '../ProductTable';
import { ProductCardView } from '../ProductCardView';
import { ProductFilters } from '../ProductFilters';
import { Modal, ConfirmModal, SkeletonTable, SkeletonCards, ImportModal, Stack } from '@shared/ui';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import type { Product } from '@types';
import type { ViewMode } from '../../types';

const PRODUCT_COLUMNS: ColumnMapping[] = [
  { header: 'Nombre', key: 'name', type: 'string' },
  { header: 'Marca', key: 'brand', type: 'string' },
  { header: 'Código', key: 'barcode', type: 'string' },
  { header: 'Precio ($)', key: 'price', type: 'number' },
  { header: 'Costo ($)', key: 'cost', type: 'number' },
  { header: 'Stock', key: 'stock', type: 'number' },
  { header: 'Stock Mínimo', key: 'minStock', type: 'number' },
  { header: 'Descripción', key: 'description', type: 'string' },
  { header: 'Imagen URL', key: 'imageUrl', type: 'string' },
];

export function ProductsTab() {
  const { showToast } = useToast();
  const { user, licenseStatus, licenseUsage } = useAuth();
  const { formatUsd, formatBs } = useExchangeRate();
  const {
    products,
    categories,
    warehouses,
    initialLoading,
    loadProducts,
    loadCategories,
  } = useProducts();

  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>({
    name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0,
    description: '', brand: '', imageUrl: '', categoryId: '',
  });
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>('table');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');

  const isLimitExceeded = !editingId && licenseUsage?.products && licenseUsage.products.limit !== null && licenseUsage.products.current >= licenseUsage.products.limit;
  const nextRequiredPlan = 'pro';

  const handleExportProducts = useCallback(() => {
    exportToExcel(products, PRODUCT_COLUMNS, 'inventario_productos', 'xlsx');
    showToast('Inventario exportado correctamente', 'success');
  }, [products, showToast]);

  const handleImportProducts = useCallback(async (data: any[], onProgress: (c: number, t: number) => void) => {
    let successCount = 0, errorCount = 0;
    const details: string[] = [];
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) throw new Error('El nombre del producto es obligatorio.');
        const existing = products.find((p) => p.barcode && p.barcode === row.barcode);
        const payload = {
          name: row.name, barcode: row.barcode || null, price: Number(row.price) || 0,
          cost: Number(row.cost) || 0, stock: Number(row.stock) || 0, minStock: Number(row.minStock) || 0,
          description: row.description || null, brand: row.brand || null, imageUrl: row.imageUrl || null, categoryId: null,
        };
        if (existing) {
          await updateInventoryProduct(existing.id, payload);
          details.push(`Actualizado: ${row.name}`);
        } else {
          await createInventoryProduct(payload);
          details.push(`Creado: ${row.name}`);
        }
        successCount++;
      } catch (err: any) {
        errorCount++;
        details.push(`Error en fila ${i + 1} (${row.name || 'Sin Nombre'}): ${err.message}`);
      }
      onProgress(i + 1, data.length);
    }
    await loadProducts();
    return { successCount, errorCount, details };
  }, [products, loadProducts]);

  const filteredProducts = useMemo(() => {
    let result = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
    );
    if (sortField) {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        const aVal = (a as any)[sortField];
        const bVal = (b as any)[sortField];
        if (aVal == null && bVal == null) return 0;
        if (aVal == null) return 1;
        if (bVal == null) return -1;
        if (typeof aVal === 'string') cmp = aVal.localeCompare(bVal);
        else cmp = aVal - bVal;
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [products, search, sortField, sortDirection]);

  const handleSubmit = useCallback(async (data: ProductFormData) => {
    setLoading(true);
    try {
      const payload: any = { ...data };
      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.imageUrl) payload.imageUrl = null;
      if (!payload.brand) payload.brand = null;
      if (editingId) await updateInventoryProduct(editingId, payload);
      else await createInventoryProduct(payload);
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' });
      await loadProducts();
      showToast(editingId ? 'Producto actualizado' : 'Producto creado', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  }, [editingId, loadProducts, showToast]);

  const startEdit = useCallback((product: Product) => {
    setForm({
      name: product.name, barcode: product.barcode || '', price: product.price, cost: product.cost,
      stock: product.stock, minStock: product.minStock, description: product.description || '',
      brand: (product as any).brand || '', imageUrl: (product as any).imageUrl || '', categoryId: product.categoryId || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  }, []);

  const handleDelete = useCallback((id: string, name: string) => setDeleteConfirm({ id, name }), []);

  const confirmDelete = useCallback(async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInventoryProduct(deleteConfirm.id);
      showToast('Producto eliminado exitosamente', 'success');
      await loadProducts();
      setDeleteConfirm(null);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar el producto', 'error');
    }
  }, [deleteConfirm, loadProducts, showToast]);

  const handleViewDetails = useCallback(async (product: Product) => {
    setViewProduct(product);
    setLoadingMovements(true);
    try {
      setMovements(await getInventoryMovements(product.id));
    } catch { setMovements([]); }
    finally { setLoadingMovements(false); }
  }, []);

  const handleCreateCategory = useCallback(async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory({ name: newCategoryName.trim() });
      await loadCategories();
      setForm((p) => ({ ...p, categoryId: cat.id }));
      setNewCategoryName(''); setShowNewCategory(false);
      showToast(`Categoría "${cat.name}" creada`, 'success');
    } catch (err: any) { showToast(err.message, 'error'); }
  }, [newCategoryName, loadCategories, showToast]);

  const getCategoryName = useCallback((catId: string | null) => {
    if (!catId) return '—';
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : '—';
  }, [categories]);

  const handleSort = useCallback((field: string) => {
    if (sortField === field) setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('asc'); }
  }, [sortField]);

  const canManage = user?.role !== 'cajero';
  const showExportImport = licenseStatus?.tier !== 'free';

  return (
    <>
      <ProductKpiBar products={products} />

      <Stack gap="lg" className="wFull">
        <ProductFilters
          search={search}
          onSearchChange={setSearch}
          warehouseFilter={warehouseFilter}
          onWarehouseFilterChange={setWarehouseFilter}
          warehouses={warehouses}
          currentViewMode={currentViewMode}
          onViewModeChange={setCurrentViewMode}
          onExport={showExportImport ? handleExportProducts : undefined}
          onImport={showExportImport ? () => setShowImport(true) : undefined}
          showExportImport={showExportImport}
          canManage={canManage}
          onAdd={canManage ? () => {
            setShowForm(true); setEditingId(null);
            setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' });
            setShowNewCategory(false);
          } : undefined}
        />

        {initialLoading ? (
          currentViewMode === 'cards' ? <SkeletonCards count={8} /> : <SkeletonTable rows={8} cols={10} />
        ) : currentViewMode === 'cards' ? (
          <ProductCardView
            products={filteredProducts}
            formatUsd={formatUsd}
            formatBs={formatBs}
            canManage={canManage}
            onView={handleViewDetails}
            onEdit={startEdit}
            onDelete={handleDelete}
          />
        ) : (
          <ProductTable
            products={filteredProducts}
            formatUsd={formatUsd}
            formatBs={formatBs}
            canManage={canManage}
            getCategoryName={getCategoryName}
            onView={handleViewDetails}
            onEdit={startEdit}
            onDelete={handleDelete}
            sortField={sortField}
            sortDirection={sortDirection}
            onSort={handleSort}
          />
        )}
      </Stack>

      <ProductForm
        key={editingId || 'new'}
        open={showForm}
        editingId={editingId}
        initialData={form}
        onClose={() => { setShowForm(false); setEditingId(null); setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' }); }}
        onSubmit={handleSubmit}
        loading={loading}
        isLimitExceeded={isLimitExceeded}
        nextRequiredPlan={nextRequiredPlan}
        categories={categories}
        onShowNewCategory={() => setShowNewCategory(!showNewCategory)}
        showNewCategory={showNewCategory}
        newCategoryName={newCategoryName}
        onNewCategoryNameChange={setNewCategoryName}
        onCreateCategory={handleCreateCategory}
      />

      <Modal open={!!viewProduct} onClose={() => setViewProduct(null)} title="DETALLES DEL PRODUCTO" xwide>
        {viewProduct && (
          <ProductDetailPanel
            product={viewProduct}
            movements={movements}
            loadingMovements={loadingMovements}
            getCategoryName={getCategoryName}
          />
        )}
      </Modal>

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Productos"
        columns={PRODUCT_COLUMNS}
        templateFilename="plantilla_productos"
        onImport={handleImportProducts}
      />

      <ConfirmModal
        open={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        onConfirm={confirmDelete}
        title="Eliminar producto"
        message={deleteConfirm ? `¿Estás seguro de que deseas eliminar "${deleteConfirm.name}"?` : ''}
        confirmText="Eliminar"
        cancelText="Cancelar"
        type="danger"
      />
    </>
  );
}