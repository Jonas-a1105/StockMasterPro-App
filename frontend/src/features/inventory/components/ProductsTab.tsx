import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Wrench, Edit2, Trash2, Eye, Package, LayoutGrid, LayoutList, Download, Upload, Shield, Lock, X } from 'lucide-react';
import { useAuth } from '@contexts/AuthContext';
import { useToast } from '@contexts/ToastContext';
import { useTheme } from '@contexts/ThemeContext';
import { useExchangeRate } from '@contexts/ExchangeRateContext';
import { useProducts } from '../hooks/useProducts';
import { createInventoryProduct, updateInventoryProduct, deleteInventoryProduct, getInventoryMovements, createCategory } from '../api/inventory.api';
import { ProductKpiBar } from './ProductKpiBar';
import { ProductFilters } from './ProductFilters';
import { ProductForm, type ProductFormData } from './ProductForm';
import { ProductDetailPanel } from '../pages/ProductDetailPanel';
import { Modal } from '@shared/ui/Modal';
import { ConfirmModal } from '@shared/ui/ConfirmModal';
import { PremiumLockButton } from '@shared/ui/PremiumLockButton';
import { SkeletonTable, SkeletonCards } from '@shared/ui/Skeleton';
import { Skeleton } from '@shared/ui/Skeleton';
import { ImportModal } from '@shared/ui/ImportModal';
import { exportToExcel, type ColumnMapping } from '@shared/lib/excelHelper';
import { exportToPdf } from '@shared/lib/print/pdfHelper';
import type { Product } from '@types';
import type { SortField, SortDirection, ViewMode } from '../types';
import styles from '../pages/InventoryPage.module.css';

const PRODUCT_COLUMNS: ColumnMapping[] = [
  { header: 'Nombre', key: 'name', type: 'string' }, { header: 'Marca', key: 'brand', type: 'string' },
  { header: 'Código', key: 'barcode', type: 'string' }, { header: 'Precio ($)', key: 'price', type: 'number' },
  { header: 'Costo ($)', key: 'cost', type: 'number' }, { header: 'Stock', key: 'stock', type: 'number' },
  { header: 'Stock Mínimo', key: 'minStock', type: 'number' }, { header: 'Descripción', key: 'description', type: 'string' },
  { header: 'Imagen URL', key: 'imageUrl', type: 'string' },
];

export function ProductsTab() {
  const { showToast } = useToast();
  const { user, licenseStatus, licenseUsage } = useAuth();
  const navigate = useNavigate();
  const { formatUsd, formatBs } = useExchangeRate();
  const { config, updateConfig } = useTheme();
  const { products, setProducts, categories, warehouses, initialLoading, loadProducts, loadCategories } = useProducts();

  const [search, setSearch] = useState('');
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductFormData>({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' });
  const [loading, setLoading] = useState(false);
  const [showImport, setShowImport] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);

  const isLimitExceeded = !editingId && licenseUsage?.products && licenseUsage.products.limit !== null && licenseUsage.products.current >= licenseUsage.products.limit;
  const nextRequiredPlan = 'pro';
  const currentViewMode: ViewMode = config.productViewMode;
  const toggleViewMode = (mode: ViewMode) => updateConfig({ productViewMode: mode });

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) setShowSortMenu(false);
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) setShowToolsMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSort = (field: SortField) => {
    if (sortField === field) { setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc'); }
    else { setSortField(field); setSortDirection('asc'); }
    setShowSortMenu(false);
  };

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
        const existing = products.find(p => p.barcode && p.barcode === row.barcode);
        const payload = { name: row.name, barcode: row.barcode || null, price: Number(row.price) || 0, cost: Number(row.cost) || 0, stock: Number(row.stock) || 0, minStock: Number(row.minStock) || 0, description: row.description || null, brand: row.brand || null, imageUrl: row.imageUrl || null, categoryId: null };
        if (existing) { await updateInventoryProduct(existing.id, payload); details.push(`Actualizado: ${row.name}`); }
        else { await createInventoryProduct(payload); details.push(`Creado: ${row.name}`); }
        successCount++;
      } catch (err: any) { errorCount++; details.push(`Error en fila ${i + 1} (${row.name || 'Sin Nombre'}): ${err.message}`); }
      onProgress(i + 1, data.length);
    }
    await loadProducts();
    return { successCount, errorCount, details };
  };

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase()) || p.barcode?.includes(search) || (p.brand && p.brand.toLowerCase().includes(search.toLowerCase())));
    if (sortField !== 'none') {
      result = [...result].sort((a, b) => {
        let cmp = 0;
        if (sortField === 'name') cmp = a.name.localeCompare(b.name);
        else if (sortField === 'price') cmp = a.price - b.price;
        else if (sortField === 'stock') cmp = a.stock - b.stock;
        else if (sortField === 'status') { const aL = a.stock <= a.minStock ? 0 : 1; const bL = b.stock <= b.minStock ? 0 : 1; cmp = aL - bL; }
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }
    return result;
  }, [products, search, sortField, sortDirection]);

  const handleSubmit = async (data: ProductFormData) => {
    setLoading(true);
    try {
      const payload: any = { ...data };
      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.imageUrl) payload.imageUrl = null;
      if (!payload.brand) payload.brand = null;
      if (editingId) { await updateInventoryProduct(editingId, payload); } else { await createInventoryProduct(payload); }
      setShowForm(false); setEditingId(null);
      setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' });
      await loadProducts();
      showToast(editingId ? 'Producto actualizado' : 'Producto creado', 'success');
    } catch (err: any) { showToast(err.message, 'error'); } finally { setLoading(false); }
  };

  const startEdit = (product: Product) => {
    setForm({ name: product.name, barcode: product.barcode || '', price: product.price, cost: product.cost, stock: product.stock, minStock: product.minStock, description: product.description || '', brand: (product as any).brand || '', imageUrl: (product as any).imageUrl || '', categoryId: product.categoryId || '' });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string, name: string) => {
    setDeleteConfirm({ id, name });
  };

  const confirmDelete = async () => {
    if (!deleteConfirm) return;
    try { await deleteInventoryProduct(deleteConfirm.id); showToast('Producto eliminado exitosamente', 'success'); await loadProducts(); setDeleteConfirm(null); } catch (err: any) { showToast(err.message || 'Error al eliminar el producto', 'error'); }
  };

  const handleViewDetails = async (product: Product) => {
    setViewProduct(product);
    setLoadingMovements(true);
    try { setMovements(await getInventoryMovements(product.id)); } catch { setMovements([]); } finally { setLoadingMovements(false); }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await createCategory({ name: newCategoryName.trim() });
      await loadCategories();
      setForm(p => ({ ...p, categoryId: cat.id }));
      setNewCategoryName(''); setShowNewCategory(false);
      showToast(`Categoría "${cat.name}" creada`, 'success');
    } catch (err: any) { showToast(err.message, 'error'); }
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return '—';
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '—';
  };

  return (
    <>
      <ProductKpiBar products={products} />
      <ProductFilters search={search} onSearchChange={setSearch} warehouseFilter={warehouseFilter} onWarehouseChange={setWarehouseFilter} warehouses={warehouses} sortField={sortField} sortDirection={sortDirection} onSort={handleSort} showSortMenu={showSortMenu} setShowSortMenu={setShowSortMenu} sortRef={sortRef}>
        <div className={styles.viewToggle}>
          <button className={`${styles.viewToggleBtn} ${currentViewMode === 'table' ? styles.viewToggleBtnActive : ''}`} onClick={() => toggleViewMode('table')} title="Vista de Tabla"><LayoutList size={15} /></button>
          <button className={`${styles.viewToggleBtn} ${currentViewMode === 'cards' ? styles.viewToggleBtnActive : ''}`} onClick={() => toggleViewMode('cards')} title="Vista de Tarjetas"><LayoutGrid size={15} /></button>
        </div>

        <div className={styles.toolsDropdown} ref={toolsRef}>
          <button className={styles.toolsDropdownBtn} onClick={() => { setShowToolsMenu(!showToolsMenu); setShowSortMenu(false); }}><Wrench size={14} /> <span>Herramientas</span></button>
          {showToolsMenu && (
            <div className={styles.toolsDropdownMenu}>
              {licenseStatus?.tier === 'free' ? (
                <button className={styles.toolsMenuItem} onClick={() => { setShowToolsMenu(false); showToast('Esta función requiere Plan Intermedio o superior', 'info'); navigate('/settings?tab=licenses&upgrade=intermedio'); }} style={{ opacity: 0.65, display: 'flex', alignItems: 'center' }}>
                  <Download size={14} className={styles.toolsMenuIcon} /> <span>Exportar Excel</span> <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
                </button>
              ) : (
                <button className={styles.toolsMenuItem} onClick={() => { handleExportProducts(); setShowToolsMenu(false); }}><Download size={14} className={styles.toolsMenuIcon} /> <span>Exportar Excel</span></button>
              )}
              {licenseStatus?.tier !== 'free' && (
                <button className={styles.toolsMenuItem} onClick={() => { exportToPdf(products, PRODUCT_COLUMNS, 'Inventario - Productos', 'inventario_productos'); setShowToolsMenu(false); }}><Download size={14} className={styles.toolsMenuIcon} /> <span>Exportar PDF</span></button>
              )}
              {licenseStatus?.tier === 'free' ? (
                <button className={styles.toolsMenuItem} onClick={() => { setShowToolsMenu(false); showToast('Esta función requiere Plan Intermedio o superior', 'info'); navigate('/settings?tab=licenses&upgrade=intermedio'); }} style={{ opacity: 0.65, display: 'flex', alignItems: 'center' }}>
                  <Upload size={14} className={styles.toolsMenuIcon} /> <span>Importar Archivo</span> <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
                </button>
              ) : (
                <button className={styles.toolsMenuItem} onClick={() => { setShowImport(true); setShowToolsMenu(false); }}><Upload size={14} className={styles.toolsMenuIcon} /> <span>Importar Archivo</span></button>
              )}
              <div className={styles.toolsMenuDivider} />
              <button className={styles.toolsMenuItem} onClick={() => { showToast('Respaldo local en desarrollo', 'info'); setShowToolsMenu(false); }}><Shield size={14} className={styles.toolsMenuIcon} /> <span>Crear Respaldo</span></button>
            </div>
          )}
        </div>

        {user?.role !== 'cajero' && (
          <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' }); setShowNewCategory(false); }}>
            <Plus size={18} /> Nuevo Producto
          </button>
        )}
      </ProductFilters>

      <ProductForm key={editingId || 'new'} open={showForm} editingId={editingId} initialData={form} onClose={() => { setShowForm(false); setEditingId(null); setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' }); }} onSubmit={handleSubmit} loading={loading} isLimitExceeded={isLimitExceeded} nextRequiredPlan={nextRequiredPlan} categories={categories} onShowNewCategory={() => setShowNewCategory(!showNewCategory)} showNewCategory={showNewCategory} newCategoryName={newCategoryName} onNewCategoryNameChange={setNewCategoryName} onCreateCategory={handleCreateCategory} />

      <Modal open={!!viewProduct} onClose={() => setViewProduct(null)} title="DETALLES DEL PRODUCTO" xwide>
        {viewProduct && <ProductDetailPanel product={viewProduct} movements={movements} loadingMovements={loadingMovements} getCategoryName={getCategoryName} />}
      </Modal>

      {initialLoading && config.skeletonEnabled ? (
        config.productViewMode === 'cards' ? <SkeletonCards count={8} /> : <SkeletonTable rows={8} cols={10} />
      ) : currentViewMode === 'cards' ? (
        <div className={styles.productsGrid}>
          {filteredProducts.map(product => {
            const isBajo = product.stock <= product.minStock;
            return (
              <div key={product.id} className={`${styles.productCard} ${isBajo ? styles.prodLowStock : ''}`}>
                <div className={styles.prodImageContainer} onClick={() => handleViewDetails(product)}>
                  {product.imageUrl ? <img src={product.imageUrl} alt="" /> : <Package size={28} style={{ color: 'var(--text-muted)' }} />}
                  {product.stock === 0 ? <div className={`${styles.prodBadge} ${styles.prodBadgeOut}`}>Agotado</div> : isBajo ? <div className={`${styles.prodBadge} ${styles.prodBadgeLow}`}>Bajo Stock</div> : null}
                </div>
                <div className={styles.prodInfoGrid}>
                  <div className={styles.prodPriceUsd}>{formatUsd(product.price)}</div>
                  <div className={styles.prodUnitsStock}>{product.stock} ud.</div>
                  <div className={styles.prodProductName}>{product.name}</div>
                </div>
                <div className={styles.prodBottomCapsule}>
                  <div className={styles.prodPriceBsAndActionsRow}>
                    <div className={styles.prodPriceBsGroup}>
                      <span className={styles.prodPriceBsLabel}>Ref. Bs</span>
                      <span className={styles.prodPriceBsValue}>{formatBs(product.price)}</span>
                    </div>
                    <div className={styles.prodActionsRow}>
                      <button className={styles.iconBtn} onClick={() => handleViewDetails(product)} title="Ver"><Eye size={16} /></button>
                      {user?.role !== 'cajero' && (<><button className={styles.iconBtn} onClick={() => startEdit(product)} title="Editar"><Edit2 size={16} /></button><button className={`${styles.iconBtn} ${styles.iconBtnDelete}`} onClick={() => handleDelete(product.id, product.name)} title="Eliminar"><Trash2 size={16} /></button></>)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && <div className={styles.emptyGrid}>No hay productos registrados</div>}
        </div>
      ) : (
        <div className="lista-container">
          <table className="lista-table">
            <thead>
              <tr>
                <th>Producto</th><th>Marca</th><th>Categoría</th><th>Código</th>
                <th style={{ textAlign: 'right' }}>Precio ($)</th><th style={{ textAlign: 'right' }}>Precio (Bs)</th>
                <th style={{ textAlign: 'right' }}>Costo ($)</th><th style={{ textAlign: 'right' }}>Costo (Bs)</th>
                <th style={{ textAlign: 'right' }}>Ganancia ($)</th><th style={{ textAlign: 'right' }}>Ganancia (Bs)</th>
                <th style={{ textAlign: 'right' }}>Stock</th><th style={{ textAlign: 'right' }}>Min.</th>
                <th style={{ textAlign: 'center' }}>Estado</th><th style={{ textAlign: 'center' }}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const profit = product.price - product.cost;
                return (
                  <tr key={product.id}>
                    <td><div className="lista-name-cell">{product.imageUrl ? <img src={product.imageUrl} alt="" style={{ width: 28, height: 28, objectFit: 'cover', flexShrink: 0 }} /> : <span style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: 'var(--bg-main)', flexShrink: 0 }}><Package size={14} /></span>}<span className="lista-name-text">{product.name}</span></div></td>
                    <td style={{ color: 'var(--text-muted)' }}>{(product as any).brand || '—'}</td>
                    <td style={{ color: 'var(--text-muted)' }}>{getCategoryName(product.categoryId)}</td>
                    <td><span className="lista-code">{product.barcode || '—'}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="lista-number-value">{formatUsd(product.price)}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="lista-number-value">{formatBs(product.price)}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="lista-number-value">{formatUsd(product.cost)}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="lista-number-value">{formatBs(product.cost)}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="lista-number-value" style={{ color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatUsd(profit)}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="lista-number-value" style={{ color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>{formatBs(profit)}</span></td>
                    <td style={{ textAlign: 'right' }}><span className="lista-number-value">{product.stock}</span></td>
                    <td style={{ textAlign: 'right' }}>{product.minStock}</td>
                    <td style={{ textAlign: 'center' }}><span className={`lista-badge ${product.stock <= product.minStock ? 'saturated' : 'active'}`}>{product.stock <= product.minStock ? 'Stock Bajo' : 'OK'}</span></td>
                    <td style={{ textAlign: 'center' }}>
                      <div className="lista-actions">
                        <button className="lista-action-btn" onClick={() => handleViewDetails(product)} title="Ver Detalles"><Eye size={14} /></button>
                        {user?.role !== 'cajero' && (<><button className="lista-action-btn" onClick={() => startEdit(product)} title="Editar"><Edit2 size={14} /></button><button className="lista-action-btn danger" onClick={() => handleDelete(product.id, product.name)} title="Eliminar"><Trash2 size={14} /></button></>)}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && <p style={{ textAlign: 'center', padding: 40, color: 'var(--text-muted)' }}>No hay productos registrados</p>}
        </div>
      )}

      <ImportModal open={showImport} onClose={() => setShowImport(false)} title="Productos" columns={PRODUCT_COLUMNS} templateFilename="plantilla_productos" onImport={handleImportProducts} />

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
