import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Plus,
  Wrench,
  Edit2,
  Trash2,
  Eye,
  Package,
  LayoutGrid,
  LayoutList,
  Download,
  Upload,
  Shield,
  Lock,
  X,
  ArrowUpDown,
} from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useProducts } from '../hooks/useProducts';
import {
  createInventoryProduct,
  updateInventoryProduct,
  deleteInventoryProduct,
  getInventoryMovements,
  createCategory,
} from '../api/inventory.api';
import { ProductKpiBar } from './ProductKpiBar';
import { ProductForm, type ProductFormData } from './ProductForm';
import { ProductDetailPanel } from '../pages/ProductDetailPanel';
import { Modal } from '@shared/ui/Modal';
import { ConfirmModal } from '@shared/ui/ConfirmModal';
import { PremiumLockButton } from '@shared/ui/PremiumLockButton';
import { SkeletonTable, SkeletonCards } from '@shared/ui/Skeleton';
import { ImportModal } from '@shared/ui/ImportModal';
import { DataTable } from '@shared/ui/DataTable';
import { ProductCard } from '@shared/ui/ProductCard';
import { Toolbar } from '@shared/ui/Toolbar';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import { exportToPdf } from '@shared/lib/print/pdfHelper';
import type { Product } from '@types';
import type { SortField, SortDirection, ViewMode } from '../types';

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
  const navigate = useNavigate();
  const { formatUsd, formatBs } = useExchangeRate();
  const { config, updateConfig } = useTheme();
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
  const [currentViewMode, setCurrentViewMode] = useState<ViewMode>(config.productViewMode);
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);

  const isLimitExceeded = !editingId && licenseUsage?.products && licenseUsage.products.limit !== null && licenseUsage.products.current >= licenseUsage.products.limit;
  const nextRequiredPlan = 'pro';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      // dropdowns handled by shared components
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setCurrentViewMode(config.productViewMode);
  }, [config.productViewMode]);

  const handleExportProducts = () => {
    exportToExcel(products, PRODUCT_COLUMNS, 'inventario_productos', 'xlsx');
    showToast('Inventario exportado correctamente', 'success');
  };

  const handleImportProducts = async (data: any[], onProgress: (c: number, t: number) => void) => {
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
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(
      (p) =>
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.barcode?.includes(search) ||
        (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
    );
    if (warehouseFilter) {
      // add warehouse filter logic here if needed
    }
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
  }, [products, search, sortField, sortDirection, warehouseFilter]);

  const handleSubmit = async (data: ProductFormData) => {
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
  };

  const startEdit = (product: Product) => {
    setForm({
      name: product.name, barcode: product.barcode || '', price: product.price, cost: product.cost,
      stock: product.stock, minStock: product.minStock, description: product.description || '',
      brand: (product as any).brand || '', imageUrl: (product as any).imageUrl || '', categoryId: product.categoryId || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = (id: string, name: string) => setDeleteConfirm({ id, name });

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try {
      await deleteInventoryProduct(deleteConfirm.id);
      showToast('Producto eliminado exitosamente', 'success');
      await loadProducts();
      setDeleteConfirm(null);
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar el producto', 'error');
    }
  };

  const handleViewDetails = async (product: Product) => {
    setViewProduct(product);
    setLoadingMovements(true);
    try {
      setMovements(await getInventoryMovements(product.id));
    } catch { setMovements([]); }
    finally { setLoadingMovements(false); }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory({ name: newCategoryName.trim() });
      await loadCategories();
      setForm((p) => ({ ...p, categoryId: cat.id }));
      setNewCategoryName(''); setShowNewCategory(false);
      showToast(`Categoría "${cat.name}" creada`, 'success');
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return '—';
    const cat = categories.find((c) => c.id === catId);
    return cat ? cat.name : '—';
  };

  const handleSort = (field: string) => {
    if (sortField === field) setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    else { setSortField(field); setSortDirection('asc'); }
    setPage(1);
  };

  const tableColumns = useMemo(() => [
    {
      key: 'name',
      header: 'Producto',
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          {product.imageUrl ? (
            <img src={product.imageUrl} alt="" className="w-8 h-8 rounded-lg object-cover" />
          ) : (
            <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-surface-muted">
              <Package size={14} className="text-text-muted" />
            </div>
          )}
          <span className="font-medium">{product.name}</span>
        </div>
      ),
      onSort: () => handleSort('name'),
    },
    { key: 'brand', header: 'Marca', render: (p: Product) => (p as any).brand || '—', onSort: () => handleSort('brand') },
    { key: 'category', header: 'Categoría', render: (p: Product) => getCategoryName(p.categoryId), onSort: () => handleSort('categoryId') },
    { key: 'barcode', header: 'Código', render: (p: Product) => <span className="font-mono">{p.barcode || '—'}</span>, onSort: () => handleSort('barcode') },
    { key: 'price', header: 'Precio ($)', align: 'right' as const, render: (p: Product) => p.price.toFixed(2), onSort: () => handleSort('price') },
    { key: 'priceBs', header: 'Precio (Bs)', align: 'right' as const, render: (p: Product) => formatBs(p.price), onSort: () => handleSort('priceBs') },
    { key: 'cost', header: 'Costo ($)', align: 'right' as const, render: (p: Product) => formatUsd(p.cost), onSort: () => handleSort('cost') },
    { key: 'costBs', header: 'Costo (Bs)', align: 'right' as const, render: (p: Product) => formatBs(p.cost), onSort: () => handleSort('costBs') },
    {
      key: 'profit',
      header: 'Ganancia ($)',
      align: 'right' as const,
      render: (p: Product) => {
        const profit = p.price - p.cost;
        return <span className={profit >= 0 ? 'text-success' : 'text-danger'}>{formatUsd(profit)}</span>;
      },
      onSort: () => handleSort('profit'),
    },
    {
      key: 'profitBs',
      header: 'Ganancia (Bs)',
      align: 'right' as const,
      render: (p: Product) => {
        const profit = p.price - p.cost;
        return <span className={profit >= 0 ? 'text-success' : 'text-danger'}>{formatBs(profit)}</span>;
      },
      onSort: () => handleSort('profitBs'),
    },
    { key: 'stock', header: 'Stock', align: 'right' as const, render: (p: Product) => <span className="font-mono">{p.stock}</span>, onSort: () => handleSort('stock') },
    { key: 'minStock', header: 'Mín.', align: 'right' as const, render: (p: Product) => <span className="font-mono">{p.minStock}</span>, onSort: () => handleSort('minStock') },
    {
      key: 'status',
      header: 'Estado',
      align: 'center' as const,
      render: (p: Product) => (
        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${
          p.stock <= p.minStock ? 'bg-danger/10 text-danger' : 'bg-success/10 text-success'
        }`}>
          {p.stock <= p.minStock ? 'Stock Bajo' : 'OK'}
        </span>
      ),
    },
    {
      key: 'actions',
      header: 'Acción',
      align: 'center' as const,
      render: (p: Product) => (
        <div className="flex items-center justify-center gap-1.5">
          <button className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-text transition-colors border border-border rounded-md" onClick={() => handleViewDetails(p)} title="Ver">
            <Eye size={14} />
          </button>
          <button className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-primary transition-colors border border-border rounded-md" onClick={() => startEdit(p)} title="Editar">
            <Edit2 size={14} />
          </button>
          <button className="flex items-center justify-center gap-1.5 px-2 py-1.5 text-sm font-medium text-text-muted hover:text-danger transition-colors border border-danger/20 rounded-md hover:border-danger" onClick={() => handleDelete(p)} title="Eliminar">
            <Trash2 size={14} />
          </button>
        </div>
      ),
    },
  ], [formatBs, formatUsd, startEdit, handleDelete, handleViewDetails, handleSort, categories]);

  return (
    <>
      <ProductKpiBar products={products} />

      <Toolbar
        search={{ value: search, onChange: setSearch, placeholder: 'Buscar productos, marcas, códigos...' }}
        searchExtra={
          <>
            <div className="flex gap-2">
              <select
                value={warehouseFilter}
                onChange={(e) => setWarehouseFilter(e.target.value)}
                className="px-3 py-2 border border-border rounded-lg bg-surface text-text text-sm min-w-[160px] focus:outline-none focus:border-primary"
              >
                <option value="">Todos los almacenes</option>
                {warehouses.filter((w: any) => w.isActive).map((w: any) => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </>
        }
        onExport={licenseStatus?.tier !== 'free' ? handleExportProducts : undefined}
        onImport={licenseStatus?.tier !== 'free' ? () => setShowImport(true) : undefined}
        addBtn={user?.role !== 'cajero' ? {
          label: 'Nuevo Producto', onClick: () => {
            setShowForm(true); setEditingId(null);
            setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' });
            setShowNewCategory(false);
          }, icon: <Plus size={18} />, show: true
        } : undefined}
      >
        <div className="flex items-center gap-2">
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${currentViewMode === 'table' ? 'bg-surface text-primary border-primary' : 'text-text-muted hover:text-text border-border'}`}
            onClick={() => { setCurrentViewMode('table'); updateConfig({ productViewMode: 'table' }); }}
            title="Vista de Tabla"
          ><LayoutList size={15} /></button>
          <button
            className={`flex items-center justify-center w-8 h-8 rounded-lg border transition-colors ${currentViewMode === 'cards' ? 'bg-surface text-primary border-primary' : 'text-text-muted hover:text-text border-border'}`}
            onClick={() => { setCurrentViewMode('cards'); updateConfig({ productViewMode: 'cards' }); }}
            title="Vista de Tarjetas"
          ><LayoutGrid size={15} /></button>

          <div className="flex items-center gap-2 ml-auto">
            <button
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-text-muted hover:text-primary transition-colors border border-border rounded-lg"
              onClick={() => handleSort('name')}
            >
              <ArrowUpDown size={14} /> <span>Ordenar: {sortField ? `${sortField} ${sortDirection === 'asc' ? '↑' : '↓'}` : 'Por defecto'}</span>
            </button>

            <div className="relative">
              <button
                className="flex items-center gap-2 px-3 py-2 bg-bg border border-border rounded-lg text-sm font-medium text-text cursor-pointer hover:border-primary hover:text-primary transition-colors"
                onClick={() => setShowToolsMenu((prev) => !prev)}
              >
                <Wrench size={14} /> <span>Herramientas</span>
              </button>
              {/* Tools dropdown handled inline for simplicity */}
            </div>
          </div>
        </div>
      </Toolbar>

      {initialLoading ? (
        currentViewMode === 'cards' ? <SkeletonCards count={8} /> : <SkeletonTable rows={8} cols={10} />
      ) : currentViewMode === 'cards' ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filteredProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              onView={handleViewDetails}
              onEdit={startEdit}
              onDelete={handleDelete}
              showActions={user?.role !== 'cajero'}
            />
          ))}
          {filteredProducts.length === 0 && (
            <div className="col-span-full flex items-center justify-center py-12 text-text-muted">
              No hay productos registrados
            </div>
          )}
        </div>
      ) : (
        <DataTable
          data={filteredProducts}
          columns={tableColumns}
          keyExtractor={(p) => p.id}
          searchable
          searchPlaceholder="Buscar productos, marcas, códigos..."
          searchKeys={['name', 'barcode', 'brand'] as const}
          sortable
          onRowClick={handleViewDetails}
          emptyMessage="No hay productos registrados"
          pageSize={pageSize}
          showPagination
        />
      )}

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