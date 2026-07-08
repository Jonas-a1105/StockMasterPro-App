import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Edit2, Package, Truck, ShoppingCart, AlertTriangle, FileText, X, Trash2, Eye, DollarSign, Users, Upload, Download, MessageCircle, ArrowUpDown, LayoutGrid, LayoutList, ChevronDown, Wrench, Shield, Lock } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';
import { Modal } from '../components/common/Modal';
import { LoadingDots } from '../components/common/LoadingDots';
import type { Product, Supplier, PurchaseOrder, InventoryMovement } from '../types';
import { useExchangeRate } from '../contexts/ExchangeRateContext';
import styles from './InventoryPage.module.css';
import { useTheme } from '../contexts/ThemeContext';
import { PremiumLockButton } from '../components/common/PremiumLockButton';
import { SkeletonTable, SkeletonCards, Skeleton } from '../components/common/Skeleton';
import { ButtonLoader } from '../components/common/ButtonLoader';
import { SearchableSelect } from '../components/common/SearchableSelect';
import { ImportModal } from '../components/common/ImportModal';
import { exportToExcel, type ColumnMapping } from '../lib/excelHelper';
import { ProductDetailPanel } from './ProductDetailPanel';
import { LottieIcon } from '../components/common/LottieIcon';
import walletData from '../assets/lottie/wallet.json';
import creditCardData from '../assets/lottie/credit-card.json';
import shoppingBagData from '../assets/lottie/shopping-bag.json';
import analyticsData from '../assets/lottie/analytics.json';
import warningData from '../assets/lottie/warning.json';

type Tab = 'products' | 'suppliers' | 'purchase-orders' | 'adjustments' | 'kardex';

const TABS: { key: Tab; label: string; icon: any }[] = [
  { key: 'products', label: 'Productos', icon: Package },
  { key: 'suppliers', label: 'Proveedores', icon: Truck },
  { key: 'purchase-orders', label: 'Órdenes de Compra', icon: ShoppingCart },
  { key: 'adjustments', label: 'Ajustes de Inventario', icon: AlertTriangle },
  { key: 'kardex', label: 'Kardex', icon: FileText },
];

export function InventoryPage() {
  const [activeTab, setActiveTab] = useState<Tab>('products');

  return (
    <div className={styles.container}>
      <div className={styles.tabs}>
        {TABS.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.key}
              className={`${styles.tab} ${activeTab === tab.key ? styles.tabActive : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {activeTab === 'products' && <ProductsTab />}
      {activeTab === 'suppliers' && <SuppliersTab />}
      {activeTab === 'purchase-orders' && <PurchaseOrdersTab />}
      {activeTab === 'adjustments' && <AdjustmentsTab />}
      {activeTab === 'kardex' && <KardexTab />}
    </div>
  );
}

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

type SortField = 'name' | 'price' | 'stock' | 'status' | 'none';
type SortDirection = 'asc' | 'desc';

function ProductsTab() {
  const [hoveredKpi, setHoveredKpi] = useState<string | null>(null);
  const { showToast } = useToast();
  const { user, licenseStatus, licenseUsage } = useAuth();
  const navigate = useNavigate();
  const { formatBs, formatUsd } = useExchangeRate();
  const { config, updateConfig } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [showImport, setShowImport] = useState(false);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const categoryOptions = useMemo(() => [
    { value: '', label: 'Sin categoría' },
    ...categories.map(c => ({ value: c.id, label: c.name }))
  ], [categories]);
  const [search, setSearch] = useState('');
  const [warehouses, setWarehouses] = useState<any[]>([]);
  const [warehouseFilter, setWarehouseFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0,
    description: '', brand: '', imageUrl: '', categoryId: '',
  });

  const isLimitExceeded = !editingId && licenseUsage?.products && licenseUsage.products.limit !== null && licenseUsage.products.current >= licenseUsage.products.limit;
  const nextRequiredPlan = licenseStatus?.tier === 'free' ? 'pro' : 'enterprise';
  const [loading, setLoading] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');

  // View details modal state
  const [viewProduct, setViewProduct] = useState<Product | null>(null);
  const [movements, setMovements] = useState<any[]>([]);
  const [loadingMovements, setLoadingMovements] = useState(false);

  const [initialLoading, setInitialLoading] = useState(true);

  // Sort & Dropdown states
  const [sortField, setSortField] = useState<SortField>('none');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const [showToolsMenu, setShowToolsMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);
  const toolsRef = useRef<HTMLDivElement>(null);
  const kpiScrollRef = useRef<HTMLDivElement>(null);
  const [kpiFadeLeft, setKpiFadeLeft] = useState(0);
  const [kpiFadeRight, setKpiFadeRight] = useState(1);

  useEffect(() => { loadProducts(); loadCategories(); }, []);
  useEffect(() => {
    api.get('/warehouses').then(setWarehouses).catch(() => {});
  }, []);

  // Click-outside handler for dropdown menus
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowToolsMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // KPI carousel scroll handler
  const handleKpiScroll = useCallback(() => {
    const el = kpiScrollRef.current;
    if (!el) return;
    const scrollLeft = el.scrollLeft;
    const maxScroll = el.scrollWidth - el.clientWidth;
    setKpiFadeLeft(scrollLeft <= 5 ? 0 : 1);
    setKpiFadeRight(scrollLeft >= maxScroll - 5 ? 0 : 1);
  }, []);

  // Sort handler
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setShowSortMenu(false);
  };

  const getSortLabel = () => {
    const labels: Record<SortField, string> = {
      none: 'Ordenar',
      name: `Nombre ${sortDirection === 'asc' ? 'A-Z' : 'Z-A'}`,
      price: `Precio ${sortDirection === 'asc' ? '↑' : '↓'}`,
      stock: `Stock ${sortDirection === 'asc' ? '↑' : '↓'}`,
      status: 'Stock Bajo primero',
    };
    return labels[sortField];
  };

  // View mode toggle (syncs with ThemeContext)
  const currentViewMode = config.productViewMode;
  const toggleViewMode = (mode: 'table' | 'cards') => {
    updateConfig({ productViewMode: mode });
  };

  const loadProducts = async () => {
    try {
      const data = await api.getProducts();
      setProducts(data);
    } catch {}
    finally { setInitialLoading(false); }
  };

  const loadCategories = async () => {
    try {
      const data = await api.getCategories();
      setCategories(data);
    } catch {}
  };

  const handleExportProducts = () => {
    exportToExcel(products, PRODUCT_COLUMNS, 'inventario_productos', 'xlsx');
    showToast('Inventario exportado correctamente', 'success');
  };

  const handleImportProducts = async (
    data: any[],
    onProgress: (current: number, total: number) => void
  ) => {
    let successCount = 0;
    let errorCount = 0;
    const details: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) {
          throw new Error('El nombre del producto es obligatorio.');
        }

        const existing = products.find(p => p.barcode && p.barcode === row.barcode);
        
        const payload = {
          name: row.name,
          barcode: row.barcode || null,
          price: Number(row.price) || 0,
          cost: Number(row.cost) || 0,
          stock: Number(row.stock) || 0,
          minStock: Number(row.minStock) || 0,
          description: row.description || null,
          brand: row.brand || null,
          imageUrl: row.imageUrl || null,
          categoryId: null,
        };

        if (existing) {
          await api.updateProduct(existing.id, payload);
          details.push(`Actualizado: ${row.name} (Cód: ${row.barcode || 'N/A'})`);
        } else {
          await api.createProduct(payload);
          details.push(`Creado: ${row.name} (Cód: ${row.barcode || 'N/A'})`);
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

  const filteredProducts = (() => {
    let result = products.filter(p =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.barcode?.includes(search) ||
      (p.brand && p.brand.toLowerCase().includes(search.toLowerCase()))
    );

    // Apply sorting
    if (sortField !== 'none') {
      result = [...result].sort((a, b) => {
        let comparison = 0;
        switch (sortField) {
          case 'name':
            comparison = a.name.localeCompare(b.name);
            break;
          case 'price':
            comparison = a.price - b.price;
            break;
          case 'stock':
            comparison = a.stock - b.stock;
            break;
          case 'status': {
            const aLow = a.stock <= a.minStock ? 0 : 1;
            const bLow = b.stock <= b.minStock ? 0 : 1;
            comparison = aLow - bLow;
            break;
          }
        }
        return sortDirection === 'asc' ? comparison : -comparison;
      });
    }

    return result;
  })();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload: any = { ...form };
      if (!payload.categoryId) payload.categoryId = null;
      if (!payload.imageUrl) payload.imageUrl = null;
      if (!payload.brand) payload.brand = null;
      if (editingId) {
        await api.updateProduct(editingId, payload);
      } else {
        await api.createProduct(payload);
      }
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
      name: product.name,
      barcode: product.barcode || '',
      price: product.price,
      cost: product.cost,
      stock: product.stock,
      minStock: product.minStock,
      description: product.description || '',
      brand: (product as any).brand || '',
      imageUrl: (product as any).imageUrl || '',
      categoryId: product.categoryId || '',
    });
    setEditingId(product.id);
    setShowForm(true);
  };

  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas eliminar el producto "${name}"?`)) return;
    try {
      await api.deleteProduct(id);
      showToast('Producto eliminado exitosamente', 'success');
      await loadProducts();
    } catch (err: any) {
      showToast(err.message || 'Error al eliminar el producto', 'error');
    }
  };

  const handleViewDetails = async (product: Product) => {
    setViewProduct(product);
    setLoadingMovements(true);
    try {
      const data = await api.getMovements(product.id);
      setMovements(data);
    } catch {
      setMovements([]);
    } finally {
      setLoadingMovements(false);
    }
  };

  const handleCreateCategory = async () => {
    if (!newCategoryName.trim()) return;
    try {
      const cat = await api.createCategory({ name: newCategoryName.trim() });
      await loadCategories();
      setForm(p => ({ ...p, categoryId: cat.id }));
      setNewCategoryName('');
      setShowNewCategory(false);
      showToast(`Categoría "${cat.name}" creada`, 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setForm(p => ({ ...p, imageUrl: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleImageUrlChange = (val: string) => {
    let finalUrl = val;
    if (val.includes('google.com/imgres')) {
      try {
        const urlObj = new URL(val);
        const imgUrlParam = urlObj.searchParams.get('imgurl');
        if (imgUrlParam) {
          finalUrl = decodeURIComponent(imgUrlParam);
        }
      } catch (e) {
        // ignore
      }
    }
    setForm(p => ({ ...p, imageUrl: finalUrl }));
  };

  const getCategoryName = (catId: string | null) => {
    if (!catId) return '—';
    const cat = categories.find(c => c.id === catId);
    return cat ? cat.name : '—';
  };

  // Calculate Product KPIs
  const totalProducts = products.length;
  const totalStock = products.reduce((sum, p) => sum + p.stock, 0);
  const totalValuationUsd = products.reduce((sum, p) => sum + (p.cost * p.stock), 0);
  const lowStockCount = products.filter(p => p.stock <= p.minStock && p.minStock > 0).length;

  return (
    <>
      {/* Products KPIs — Carousel en móviles */}
      <div className={styles.kpiCarouselWrapper}>
        <div className={styles.kpiFadeLeft} style={{ opacity: kpiFadeLeft }} />
        <div className={styles.kpiFadeRight} style={{ opacity: kpiFadeRight }} />
        <div className={styles.kpiContainer} ref={kpiScrollRef} onScroll={handleKpiScroll}>
          <div
            className={`${styles.kpiCard} kpi-card`}
            style={{ '--kpi-color': 'var(--color-orange-red)' } as React.CSSProperties}
            onMouseEnter={() => setHoveredKpi('products')}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={shoppingBagData} size={22} play={hoveredKpi === 'products'} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiValue}>{totalProducts}</span>
              <span className={styles.kpiLabel}>Productos</span>
            </div>
          </div>
          <div
            className={`${styles.kpiCard} kpi-card`}
            style={{ '--kpi-color': 'var(--color-teal)' } as React.CSSProperties}
            onMouseEnter={() => setHoveredKpi('stock')}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={analyticsData} size={22} play={hoveredKpi === 'stock'} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiValue}>{totalStock}</span>
              <span className={styles.kpiLabel}>Stock Total</span>
            </div>
          </div>
          <div
            className={`${styles.kpiCard} kpi-card`}
            style={{ '--kpi-color': 'var(--color-green)' } as React.CSSProperties}
            onMouseEnter={() => setHoveredKpi('valuationUsd')}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={walletData} size={22} play={hoveredKpi === 'valuationUsd'} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiValue}>{formatUsd(totalValuationUsd)}</span>
              <span className={styles.kpiLabel}>Valoración ($)</span>
            </div>
          </div>
          <div
            className={`${styles.kpiCard} kpi-card`}
            style={{ '--kpi-color': 'var(--color-purple)' } as React.CSSProperties}
            onMouseEnter={() => setHoveredKpi('valuationBs')}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={creditCardData} size={22} play={hoveredKpi === 'valuationBs'} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiValue}>{formatBs(totalValuationUsd)}</span>
              <span className={styles.kpiLabel}>Valoración (Bs)</span>
            </div>
          </div>
          <div
            className={`${styles.kpiCard} kpi-card`}
            style={{ '--kpi-color': 'var(--color-red)' } as React.CSSProperties}
            onMouseEnter={() => setHoveredKpi('lowStock')}
            onMouseLeave={() => setHoveredKpi(null)}
          >
            <div className={styles.kpiIconWrapper}>
              <LottieIcon data={warningData} size={22} play={hoveredKpi === 'lowStock'} />
            </div>
            <div className={styles.kpiContent}>
              <span className={styles.kpiValue} style={{ color: 'var(--color-red)' }}>{lowStockCount}</span>
              <span className={styles.kpiLabel}>Stock Bajo</span>
            </div>
          </div>
        </div>
      </div>

      {/* TOOLBAR UNIFICADO OPTIMIZADO */}
      <div className={styles.toolbarContainer}>
        <div className={styles.toolbarRow}>
          {/* Búsqueda + Filtro de Almacén Unificados */}
          <div className={styles.searchFilterUnified}>
            <div className={`${styles.searchSection} global-search-section`}>
              <Search size={16} />
              <input
                type="text"
                className="global-search-input"
                placeholder="Buscar productos, marcas, códigos..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              {search && (
                <button className={styles.clearSearchBtn} onClick={() => setSearch('')} title="Limpiar búsqueda">
                  <X size={14} />
                </button>
              )}
            </div>
            <div className={styles.searchFilterDivider} />
            <div className={`${styles.warehouseSection} global-warehouse-section`}>
              <select className="global-search-select" value={warehouseFilter} onChange={e => setWarehouseFilter(e.target.value)}>
                <option value="">Todos los almacenes</option>
                {warehouses.filter(w => w.isActive).map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Acciones del Toolbar */}
          <div className={styles.toolbarActions}>
            {/* Toggle de Vista */}
            <div className={styles.viewToggle}>
              <button
                className={`${styles.viewToggleBtn} ${currentViewMode === 'table' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => toggleViewMode('table')}
                title="Vista de Tabla"
              >
                <LayoutList size={15} />
              </button>
              <button
                className={`${styles.viewToggleBtn} ${currentViewMode === 'cards' ? styles.viewToggleBtnActive : ''}`}
                onClick={() => toggleViewMode('cards')}
                title="Vista de Tarjetas"
              >
                <LayoutGrid size={15} />
              </button>
            </div>

            {/* Dropdown de Ordenamiento */}
            <div className={styles.sortDropdown} ref={sortRef}>
              <button
                className={styles.sortDropdownBtn}
                onClick={() => { setShowSortMenu(!showSortMenu); setShowToolsMenu(false); }}
              >
                <ArrowUpDown size={14} />
                <span>{getSortLabel()}</span>
                <ChevronDown size={12} className={`${styles.sortChevron} ${showSortMenu ? styles.sortChevronOpen : ''}`} />
              </button>
              {showSortMenu && (
                <div className={styles.sortDropdownMenu}>
                  <div className={styles.sortMenuHeader}>Ordenar por</div>
                  <button className={`${styles.sortMenuItem} ${sortField === 'name' ? styles.sortMenuItemActive : ''}`} onClick={() => handleSort('name')}>
                    Nombre {sortField === 'name' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                  </button>
                  <button className={`${styles.sortMenuItem} ${sortField === 'price' ? styles.sortMenuItemActive : ''}`} onClick={() => handleSort('price')}>
                    Precio {sortField === 'price' && (sortDirection === 'asc' ? '(Menor)' : '(Mayor)')}
                  </button>
                  <button className={`${styles.sortMenuItem} ${sortField === 'stock' ? styles.sortMenuItemActive : ''}`} onClick={() => handleSort('stock')}>
                    Stock {sortField === 'stock' && (sortDirection === 'asc' ? '(Menor)' : '(Mayor)')}
                  </button>
                  <div className={styles.sortMenuDivider} />
                  <button className={`${styles.sortMenuItem} ${sortField === 'status' ? styles.sortMenuItemActive : ''}`} onClick={() => handleSort('status')}>
                    Stock Bajo primero
                  </button>
                  {sortField !== 'none' && (
                    <>
                      <div className={styles.sortMenuDivider} />
                      <button className={styles.sortMenuItem} onClick={() => { setSortField('none'); setShowSortMenu(false); }}>
                        ✕ Quitar orden
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Menú de Herramientas Consolidado */}
            {user?.role !== 'cajero' && (
              <div className={styles.toolsDropdown} ref={toolsRef}>
                <button
                  className={styles.toolsDropdownBtn}
                  onClick={() => { setShowToolsMenu(!showToolsMenu); setShowSortMenu(false); }}
                >
                  <Wrench size={14} />
                  <span>Herramientas</span>
                  <ChevronDown size={12} className={`${styles.sortChevron} ${showToolsMenu ? styles.sortChevronOpen : ''}`} />
                </button>
                {showToolsMenu && (
                  <div className={styles.toolsDropdownMenu}>
                    <div className={styles.toolsMenuHeader}>Transferencia de Datos</div>
                    {licenseStatus?.tier === 'free' ? (
                      <button
                        className={styles.toolsMenuItem}
                        onClick={() => {
                          setShowToolsMenu(false);
                          showToast('Esta función requiere Plan Intermedio o superior', 'info');
                          navigate('/settings?tab=licenses&upgrade=intermedio');
                        }}
                        style={{ opacity: 0.65, display: 'flex', alignItems: 'center' }}
                      >
                        <Download size={14} className={styles.toolsMenuIcon} />
                        <span>Exportar Excel</span>
                        <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
                      </button>
                    ) : (
                      <button className={styles.toolsMenuItem} onClick={() => { handleExportProducts(); setShowToolsMenu(false); }}>
                        <Download size={14} className={styles.toolsMenuIcon} />
                        <span>Exportar Excel</span>
                      </button>
                    )}

                    {licenseStatus?.tier === 'free' ? (
                      <button
                        className={styles.toolsMenuItem}
                        onClick={() => {
                          setShowToolsMenu(false);
                          showToast('Esta función requiere Plan Intermedio o superior', 'info');
                          navigate('/settings?tab=licenses&upgrade=intermedio');
                        }}
                        style={{ opacity: 0.65, display: 'flex', alignItems: 'center' }}
                      >
                        <Upload size={14} className={styles.toolsMenuIcon} />
                        <span>Importar Archivo</span>
                        <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
                      </button>
                    ) : (
                      <button className={styles.toolsMenuItem} onClick={() => { setShowImport(true); setShowToolsMenu(false); }}>
                        <Upload size={14} className={styles.toolsMenuIcon} />
                        <span>Importar Archivo</span>
                      </button>
                    )}

                    <div className={styles.toolsMenuDivider} />

                    {licenseStatus?.tier === 'free' ? (
                      <button
                        className={styles.toolsMenuItem}
                        onClick={() => {
                          setShowToolsMenu(false);
                          showToast('Esta función requiere Plan Intermedio o superior', 'info');
                          navigate('/settings?tab=licenses&upgrade=intermedio');
                        }}
                        style={{ opacity: 0.65, display: 'flex', alignItems: 'center' }}
                      >
                        <Shield size={14} className={styles.toolsMenuIcon} />
                        <span>Crear Respaldo</span>
                        <Lock size={12} style={{ marginLeft: 'auto', color: 'var(--color-primary)' }} />
                      </button>
                    ) : (
                      <button className={styles.toolsMenuItem} onClick={() => { showToast('Respaldo local en desarrollo', 'info'); setShowToolsMenu(false); }}>
                        <Shield size={14} className={styles.toolsMenuIcon} />
                        <span>Crear Respaldo</span>
                      </button>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Botón Nuevo Producto */}
            {user?.role !== 'cajero' && (
              <button className={styles.addBtn} onClick={() => {
                setShowForm(true);
                setEditingId(null);
                setForm({ name: '', barcode: '', price: 0, cost: 0, stock: 0, minStock: 0, description: '', brand: '', imageUrl: '', categoryId: '' });
                setShowNewCategory(false);
              }}>
                <Plus size={18} /> Nuevo Producto
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Form Modal */}
      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Editar Producto' : 'Nuevo Producto'}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nombre *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className={styles.field}>
              <label>Código de Barras</label>
              <input type="text" value={form.barcode} onChange={e => setForm(p => ({ ...p, barcode: e.target.value }))} />
            </div>
            <div className={styles.field}>
              <label>Marca</label>
              <input type="text" value={form.brand} onChange={e => setForm(p => ({ ...p, brand: e.target.value }))} placeholder="Ej: Samsung, Nike..." />
            </div>
            <div className={styles.field}>
              <label>Precio de Venta ($) *</label>
              <input type="number" step="0.01" value={form.price || ''} onChange={e => setForm(p => ({ ...p, price: Number(e.target.value) }))} required placeholder="0.00" />
            </div>
            <div className={styles.field}>
              <label>Costo ($)</label>
              <input type="number" step="0.01" value={form.cost || ''} onChange={e => setForm(p => ({ ...p, cost: Number(e.target.value) }))} placeholder="0.00" />
            </div>
            <div className={styles.field}>
              <label>Stock</label>
              <input type="number" value={form.stock || ''} onChange={e => setForm(p => ({ ...p, stock: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div className={styles.field}>
              <label>Stock Mínimo</label>
              <input type="number" value={form.minStock || ''} onChange={e => setForm(p => ({ ...p, minStock: Number(e.target.value) }))} placeholder="0" />
            </div>
            <div className={styles.field}>
              <label>Categoría</label>
              <div className={styles.categoryRow}>
                <SearchableSelect
                  value={form.categoryId}
                  onChange={val => setForm(p => ({ ...p, categoryId: val }))}
                  options={categoryOptions}
                  placeholder="Sin categoría"
                />
                <button type="button" className={styles.quickAddBtn} onClick={() => setShowNewCategory(!showNewCategory)} title="Crear categoría">
                  <Plus size={16} />
                </button>
              </div>
              {showNewCategory && (
                <div className={styles.newCategoryInline}>
                  <input
                    type="text"
                    value={newCategoryName}
                    onChange={e => setNewCategoryName(e.target.value)}
                    placeholder="Nombre de la categoría"
                    onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleCreateCategory(); } }}
                  />
                  <button type="button" className={`${styles.smallBtn} ${styles.smallBtnPrimary}`} onClick={handleCreateCategory}>Crear</button>
                  <button type="button" className={`${styles.smallBtn} ${styles.smallBtnSecondary}`} onClick={() => { setShowNewCategory(false); setNewCategoryName(''); }}>
                    <X size={12} />
                  </button>
                </div>
              )}
            </div>
            <div className={styles.fieldFull}>
              <label>Imagen del Producto</label>
              <div className={styles.imageUploadArea}>
                <input type="text" value={form.imageUrl} onChange={e => handleImageUrlChange(e.target.value)} placeholder="URL de imagen o subir archivo" />
                <label className={styles.imageUploadLabel}>
                  📁 Subir
                  <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageUpload} />
                </label>
              </div>
              {form.imageUrl && <img src={form.imageUrl} alt="Preview" className={styles.imagePreview} style={{ marginTop: 8 }} />}
            </div>
            <div className={styles.fieldFull}>
              <label>Descripción</label>
              <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancelar
            </button>
            {isLimitExceeded ? (
              <PremiumLockButton
                requiredPlan={nextRequiredPlan}
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

      {/* View Product Details Modal */}
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

      {initialLoading && config.skeletonEnabled ? (
        config.productViewMode === 'cards' ? <SkeletonCards count={8} /> : <SkeletonTable rows={8} cols={10} />
      ) : config.productViewMode === 'cards' ? (
        <div className={styles.productsGrid}>
          {filteredProducts.map(product => {
            const isBajo = product.stock <= product.minStock;
            const targetCapacity = product.minStock * 2;
            const rawPercent = targetCapacity > 0 ? Math.round((product.stock / targetCapacity) * 100) : 100;
            const percent = Math.min(Math.max(rawPercent, 0), 100);
            const profit = product.price - product.cost;
            const isProfitNegative = profit < 0;

            return (
              <div key={product.id} className={`${styles.productCard} ${isBajo ? styles.prodLowStock : ''}`}>
                <div className={styles.prodImageContainer} onClick={() => handleViewDetails(product)}>
                  {product.imageUrl ? (
                    <img src={product.imageUrl} alt="" />
                  ) : (
                    <Package size={28} style={{ color: 'var(--text-muted)' }} />
                  )}
                  {product.stock === 0 ? (
                    <div className={`${styles.prodBadge} ${styles.prodBadgeOut}`}>
                      Agotado
                    </div>
                  ) : isBajo ? (
                    <div className={`${styles.prodBadge} ${styles.prodBadgeLow}`}>
                      Bajo Stock
                    </div>
                  ) : null}
                </div>

                <div className={styles.prodInfoGrid}>
                  <div className={styles.prodPriceUsd}>{formatUsd(product.price)}</div>
                  <div className={styles.prodUnitsStock}>{product.stock} ud.</div>
                  <div className={styles.prodProductName}>{product.name}</div>
                </div>

                <div className={styles.stockProgressWrapper}>
                  <div className={styles.stockProgressTextRow}>
                    <span>Mín. {product.minStock} ud.</span>
                    <span className={isBajo ? styles.stockTextDanger : styles.stockTextOk}>
                      {percent}%
                    </span>
                  </div>
                  <div className={styles.stockProgressBarContainer}>
                    <div 
                      className={styles.stockProgressBarFill} 
                      style={{ 
                        width: `${percent}%`, 
                        backgroundColor: isBajo ? 'var(--color-danger, #dc2626)' : 'var(--color-success, #00b050)' 
                      }} 
                    />
                  </div>
                </div>

                <div className={styles.prodBottomCapsule}>
                  <div className={styles.prodPriceBsAndActionsRow}>
                    <div className={styles.prodPriceBsGroup}>
                      <span className={styles.prodPriceBsLabel}>Ref. Bs</span>
                      <span className={styles.prodPriceBsValue}>{formatBs(product.price)}</span>
                    </div>

                    <div className={styles.prodActionsRow}>
                      <button className={styles.iconBtn} onClick={() => handleViewDetails(product)} title="Ver">
                        <Eye size={16} />
                      </button>
                      {user?.role !== 'cajero' && (
                        <>
                          <button className={styles.iconBtn} onClick={() => startEdit(product)} title="Editar">
                            <Edit2 size={16} />
                          </button>
                          <button className={`${styles.iconBtn} ${styles.iconBtnDelete}`} onClick={() => handleDeleteProduct(product.id, product.name)} title="Eliminar">
                            <Trash2 size={16} />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
          {filteredProducts.length === 0 && (
            <div className={styles.emptyGrid}>No hay productos registrados</div>
          )}
        </div>
      ) : (
        <div className="lista-container">
          <table className="lista-table">
            <thead>
              <tr>
                <th>Producto</th>
                <th>Marca</th>
                <th>Categoría</th>
                <th>Código</th>
                <th style={{textAlign:'right'}}>Precio ($)</th>
                <th style={{textAlign:'right'}}>Precio (Bs)</th>
                <th style={{textAlign:'right'}}>Costo ($)</th>
                <th style={{textAlign:'right'}}>Costo (Bs)</th>
                <th style={{textAlign:'right'}}>Ganancia ($)</th>
                <th style={{textAlign:'right'}}>Ganancia (Bs)</th>
                <th style={{textAlign:'right'}}>Stock</th>
                <th style={{textAlign:'right'}}>Min.</th>
                <th style={{textAlign:'center'}}>Estado</th>
                <th style={{textAlign:'center'}}>Acción</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => {
                const profit = product.price - product.cost;
                return (
                  <tr key={product.id}>
                    <td>
                      <div className="lista-name-cell">
                        {(product as any).imageUrl ? (
                          <img src={(product as any).imageUrl} alt="" style={{width:28,height:28,objectFit:'cover',flexShrink:0}} />
                        ) : (
                          <span style={{width:28,height:28,display:'flex',alignItems:'center',justifyContent:'center',backgroundColor:'var(--bg-main)',flexShrink:0}}>
                            <Package size={14} />
                          </span>
                        )}
                        <span className="lista-name-text">{product.name}</span>
                      </div>
                    </td>
                    <td style={{color:'var(--text-muted)'}}>{(product as any).brand || '—'}</td>
                    <td style={{color:'var(--text-muted)'}}>{getCategoryName(product.categoryId)}</td>
                    <td><span className="lista-code">{product.barcode || '—'}</span></td>
                    <td style={{textAlign:'right'}}><span className="lista-number-value">{formatUsd(product.price)}</span></td>
                    <td style={{textAlign:'right'}}><span className="lista-number-value">{formatBs(product.price)}</span></td>
                    <td style={{textAlign:'right'}}><span className="lista-number-value">{formatUsd(product.cost)}</span></td>
                    <td style={{textAlign:'right'}}><span className="lista-number-value">{formatBs(product.cost)}</span></td>
                    <td style={{textAlign:'right'}}>
                      <span className="lista-number-value" style={{color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}}>
                        {formatUsd(profit)}
                      </span>
                    </td>
                    <td style={{textAlign:'right'}}>
                      <span className="lista-number-value" style={{color: profit >= 0 ? 'var(--color-success)' : 'var(--color-danger)'}}>
                        {formatBs(profit)}
                      </span>
                    </td>
                    <td style={{textAlign:'right'}}><span className="lista-number-value">{product.stock}</span></td>
                    <td style={{textAlign:'right'}}>{product.minStock}</td>
                    <td style={{textAlign:'center'}}>
                      <span className={`lista-badge ${product.stock <= product.minStock ? 'saturated' : 'active'}`}>
                        {product.stock <= product.minStock ? 'Stock Bajo' : 'OK'}
                      </span>
                    </td>
                    <td style={{textAlign:'center'}}>
                      <div className="lista-actions">
                        <button className="lista-action-btn" onClick={() => handleViewDetails(product)} title="Ver Detalles">
                          <Eye size={14} />
                        </button>
                        {user?.role !== 'cajero' && (
                          <>
                            <button className="lista-action-btn" onClick={() => startEdit(product)} title="Editar">
                              <Edit2 size={14} />
                            </button>
                            <button className="lista-action-btn danger" onClick={() => handleDeleteProduct(product.id, product.name)} title="Eliminar">
                              <Trash2 size={14} />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filteredProducts.length === 0 && (
            <p style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay productos registrados</p>
          )}
        </div>
      )}

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Productos"
        columns={PRODUCT_COLUMNS}
        templateFilename="plantilla_productos"
        onImport={handleImportProducts}
      />
    </>
  );
}

const SUPPLIER_COLUMNS: ColumnMapping[] = [
  { header: 'Nombre', key: 'name', type: 'string' },
  { header: 'Contacto', key: 'contact', type: 'string' },
  { header: 'Teléfono', key: 'phone', type: 'string' },
  { header: 'Email', key: 'email', type: 'string' },
  { header: 'Dirección', key: 'address', type: 'string' },
];

function SuppliersTab() {
  const { showToast } = useToast();
  const { user, licenseStatus, licenseUsage } = useAuth();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', contact: '', phone: '', email: '', address: '' });
  const [loading, setLoading] = useState(false);
  
  const isLimitExceeded = !editingId && licenseUsage?.suppliers && licenseUsage.suppliers.limit !== null && licenseUsage.suppliers.current >= licenseUsage.suppliers.limit;
  const nextRequiredPlan = licenseStatus?.tier === 'free' ? 'pro' : 'enterprise';
  const [showImport, setShowImport] = useState(false);

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    try {
      const data = await api.getSuppliers();
      setSuppliers(data);
    } catch {}
  };

  const handleExportSuppliers = () => {
    exportToExcel(suppliers, SUPPLIER_COLUMNS, 'proveedores', 'xlsx');
    showToast('Lista de proveedores exportada correctamente', 'success');
  };

  const handleImportSuppliers = async (
    data: any[],
    onProgress: (current: number, total: number) => void
  ) => {
    let successCount = 0;
    let errorCount = 0;
    const details: string[] = [];

    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      try {
        if (!row.name) {
          throw new Error('El nombre del proveedor es obligatorio.');
        }

        const existing = suppliers.find(s => s.name.toLowerCase() === row.name.toLowerCase());

        const payload = {
          name: row.name,
          contact: row.contact || '',
          phone: row.phone || '',
          email: row.email || '',
          address: row.address || '',
        };

        if (existing) {
          await api.updateSupplier(existing.id, payload);
          details.push(`Actualizado: ${row.name}`);
        } else {
          await api.createSupplier(payload);
          details.push(`Creado: ${row.name}`);
        }
        successCount++;
      } catch (err: any) {
        errorCount++;
        details.push(`Error en fila ${i + 1} (${row.name || 'Sin Nombre'}): ${err.message}`);
      }
      onProgress(i + 1, data.length);
    }

    await loadSuppliers();
    return { successCount, errorCount, details };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const emailPayload = form.email.trim() && !form.email.includes('@')
      ? `${form.email.trim()}@gmail.com`
      : form.email.trim();

    const cleanPhone = form.phone.replace(/[\s\-()]/g, '');
    const phonePayload = cleanPhone === '+58' 
      ? '' 
      : (cleanPhone && !cleanPhone.startsWith('+')
          ? `+58${cleanPhone}`
          : cleanPhone);

    try {
      const payload: any = { name: form.name };
      if (form.contact) payload.contact = form.contact;
      if (phonePayload) payload.phone = phonePayload;
      if (emailPayload) payload.email = emailPayload;
      if (form.address) payload.address = form.address;

      if (editingId) {
        await api.updateSupplier(editingId, payload);
      } else {
        await api.createSupplier(payload);
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', contact: '', phone: '', email: '', address: '' });
      await loadSuppliers();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (supplier: Supplier) => {
    setForm({
      name: supplier.name,
      contact: supplier.contact || '',
      phone: supplier.phone || '',
      email: supplier.email || '',
      address: supplier.address || '',
    });
    setEditingId(supplier.id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este proveedor?')) return;
    try {
      await api.deleteSupplier(id);
      await loadSuppliers();
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  const openWhatsApp = (phone: string, name: string) => {
    const cleanPhone = phone.replace(/[\s\-()]/g, '');
    const message = encodeURIComponent(`Hola ${name}, te contacto desde StockMaster Pro. `);
    window.open(`https://wa.me/${cleanPhone}?text=${message}`, '_blank');
  };

  const handleEmailBlur = () => {
    const email = form.email.trim();
    if (email && !email.includes('@')) {
      setForm(p => ({ ...p, email: email + '@gmail.com' }));
    }
  };

  // Calculate KPIs
  const totalSuppliers = suppliers.length;
  const suppliersWithPhone = suppliers.filter(s => s.phone).length;
  const suppliersWithEmail = suppliers.filter(s => s.email).length;
  const suppliersWithAddress = suppliers.filter(s => s.address).length;

  return (
    <>
      {/* Suppliers KPIs */}
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <Users size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{totalSuppliers}</span>
            <span className={styles.kpiLabel}>Total Proveedores</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <Truck size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{suppliersWithPhone}</span>
            <span className={styles.kpiLabel}>Con Teléfono</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <Truck size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{suppliersWithEmail}</span>
            <span className={styles.kpiLabel}>Con Email</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <Truck size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{suppliersWithAddress}</span>
            <span className={styles.kpiLabel}>Con Dirección</span>
          </div>
        </div>
      </div>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Proveedores</h3>
        {user?.role !== 'cajero' && (
          <div style={{ display: 'flex', gap: '8px' }}>
            <button className={styles.exportBtn} onClick={handleExportSuppliers} title="Exportar proveedores a Excel">
              <Download size={16} /> Exportar
            </button>
            <button className={styles.importBtn} onClick={() => setShowImport(true)} title="Importar proveedores desde Excel/CSV">
              <Upload size={16} /> Importar
            </button>
            <button className={styles.addBtn} onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', contact: '', phone: '', email: '', address: '' }); }}>
              <Plus size={18} /> Nuevo Proveedor
            </button>
          </div>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setEditingId(null); }} title={editingId ? 'Editar Proveedor' : 'Nuevo Proveedor'}>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Nombre *</label>
              <input type="text" value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))} required placeholder="Nombre del proveedor" />
            </div>
            <div className={styles.field}>
              <label>Contacto</label>
              <input type="text" value={form.contact} onChange={e => setForm(p => ({ ...p, contact: e.target.value }))} placeholder="Persona de contacto" />
            </div>
            <div className={styles.field}>
              <label>Teléfono / WhatsApp</label>
              {(form.phone.startsWith('+58') || !form.phone.startsWith('+')) ? (
                <div className={styles.inputPrefix}>
                  <span>+58</span>
                  <input
                    type="text"
                    value={form.phone.startsWith('+58') ? form.phone.slice(3) : form.phone}
                    onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                    placeholder="4XX XXX XXXX"
                  />
                </div>
              ) : (
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm(p => ({ ...p, phone: e.target.value }))}
                  placeholder="+58 4XX XXX XXXX"
                />
              )}
            </div>
            <div className={styles.field}>
              <label>Email</label>
              {(!form.email.includes('@') || form.email.endsWith('@gmail.com')) ? (
                <div className={styles.inputSuffix}>
                  <input
                    type="text"
                    value={form.email.endsWith('@gmail.com') ? form.email.slice(0, -10) : form.email}
                    onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                    placeholder="usuario"
                  />
                  <span>@gmail.com</span>
                </div>
              ) : (
                <input
                  type="email"
                  value={form.email}
                  onChange={e => setForm(p => ({ ...p, email: e.target.value }))}
                  placeholder="correo@gmail.com"
                />
              )}
            </div>
            <div className={styles.fieldFull}>
              <label>Dirección</label>
              <input type="text" value={form.address} onChange={e => setForm(p => ({ ...p, address: e.target.value }))} placeholder="Dirección del proveedor" />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); setEditingId(null); }}>
              Cancelar
            </button>
            {isLimitExceeded ? (
              <PremiumLockButton
                requiredPlan={nextRequiredPlan}
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

      <div className="lista-container">
        <table className="lista-table">
          <thead>
            <tr>
              <th>Nombre</th>
              <th>Contacto</th>
              <th>Teléfono</th>
              <th>Email</th>
              {user?.role !== 'cajero' && <th style={{textAlign:'center'}}>Acción</th>}
            </tr>
          </thead>
          <tbody>
            {suppliers.map(supplier => (
              <tr key={supplier.id}>
                <td><span className="lista-name-text">{supplier.name}</span></td>
                <td style={{color:'var(--text-muted)'}}>{supplier.contact || '—'}</td>
                <td>{supplier.phone || '—'}</td>
                <td>{supplier.email || '—'}</td>
                {user?.role !== 'cajero' && (
                  <td style={{textAlign:'center'}}>
                    <div className="lista-actions">
                      {supplier.phone && (
                        <button className="lista-action-btn" onClick={() => openWhatsApp(supplier.phone!, supplier.name)} title="Enviar WhatsApp">
                          <MessageCircle size={14} />
                        </button>
                      )}
                      <button className="lista-action-btn" onClick={() => startEdit(supplier)} title="Editar">
                        <Edit2 size={14} />
                      </button>
                      <button className="lista-action-btn danger" onClick={() => handleDelete(supplier.id)} title="Eliminar">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
        {suppliers.length === 0 && (
          <p style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay proveedores registrados</p>
        )}
      </div>

      <ImportModal
        open={showImport}
        onClose={() => setShowImport(false)}
        title="Proveedores"
        columns={SUPPLIER_COLUMNS}
        templateFilename="plantilla_proveedores"
        onImport={handleImportSuppliers}
      />
    </>
  );
}

function PurchaseOrdersTab() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingOrders, setLoadingOrders] = useState(true);
  const [form, setForm] = useState({ supplierId: '', notes: '', items: [] as { productId: string; quantity: number; cost: number }[] });

  useEffect(() => {
    loadOrders();
    api.getProducts().then(setProducts).catch(() => {});
    api.getSuppliers().then(setSuppliers).catch(() => {});
  }, []);

  const loadOrders = async () => {
    setLoadingOrders(true);
    try {
      const data = await api.getPurchaseOrders();
      setOrders(data);
    } catch {} finally {
      setLoadingOrders(false);
    }
  };

  const addItem = () => {
    setForm(p => ({ ...p, items: [...p.items, { productId: '', quantity: 1, cost: 0 }] }));
  };

  const removeItem = (idx: number) => {
    setForm(p => ({ ...p, items: p.items.filter((_, i) => i !== idx) }));
  };

  const updateItem = (idx: number, field: string, value: any) => {
    setForm(p => {
      const items = [...p.items];
      items[idx] = { ...items[idx], [field]: value };
      return { ...p, items };
    });
  };

  const total = form.items.reduce((sum, item) => sum + item.quantity * item.cost, 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        supplierId: form.supplierId || null,
        notes: form.notes || null,
        items: form.items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          cost: i.cost,
        })),
      };
      await api.createPurchaseOrder(payload);
      setShowForm(false);
      setForm({ supplierId: '', notes: '', items: [] });
      await loadOrders();
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  const getSupplierName = (id: string | null) => {
    if (!id) return '—';
    const s = suppliers.find(s => s.id === id);
    return s ? s.name : id;
  };

  const statusBadge = (status: string) => {
    const cls = status === 'completed' ? styles.badgeOk : status === 'pending' ? styles.badgeWarning : styles.badgeDanger;
    const label = status === 'completed' ? 'Completada' : status === 'pending' ? 'Pendiente' : 'Cancelada';
    return <span className={`${styles.badge} ${cls}`}>{label}</span>;
  };

  // Calculate KPIs
  const totalOrders = orders.length;
  const completedOrders = orders.filter(o => o.status === 'completed').length;
  const pendingOrders = orders.filter(o => o.status === 'pending').length;
  const totalInvestmentUsd = orders.filter(o => o.status !== 'cancelled').reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <>
      {/* Purchase Orders KPIs */}
      <div className={styles.kpiContainer}>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <ShoppingCart size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue}>{totalOrders}</span>
            <span className={styles.kpiLabel}>Total Órdenes</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(22, 163, 74, 0.1)', color: '#16a34a' }}>
            <Package size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue} style={{ color: '#16a34a' }}>{completedOrders}</span>
            <span className={styles.kpiLabel}>Completadas</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper} style={{ backgroundColor: 'rgba(202, 138, 4, 0.1)', color: '#ca8a04' }}>
            <AlertTriangle size={18} />
          </div>
          <div className={styles.kpiContent}>
            <span className={styles.kpiValue} style={{ color: '#ca8a04' }}>{pendingOrders}</span>
            <span className={styles.kpiLabel}>Pendientes</span>
          </div>
        </div>
        <div className={styles.kpiCard}>
          <div className={styles.kpiIconWrapper}>
            <DollarSign size={18} />
          </div>
          <div className={styles.kpiContent}>
            {(() => {
              const formatted = formatPrice(totalInvestmentUsd);
              if (formatted.includes(' · ')) {
                return (
                  <span className={styles.kpiValue} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span>{formatted.split(' · ')[0]}</span>
                    <span className={styles.kpiSubValue}>{formatted.split(' · ')[1]}</span>
                  </span>
                );
              }
              return <span className={styles.kpiValue}>{formatted}</span>;
            })()}
            <span className={styles.kpiLabel}>Total Inversión</span>
          </div>
        </div>
      </div>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Órdenes de Compra</h3>
        {user?.role !== 'cajero' && (
          <button className={styles.addBtn} onClick={() => setShowForm(true)}>
            <Plus size={18} /> Nueva Orden de Compra
          </button>
        )}
      </div>

      <Modal open={showForm} onClose={() => { setShowForm(false); setForm({ supplierId: '', notes: '', items: [] }); }} title="Nueva Orden de Compra" wide>
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.field}>
              <label>Proveedor</label>
              <select value={form.supplierId} onChange={e => setForm(p => ({ ...p, supplierId: e.target.value }))}>
                <option value="">Sin proveedor</option>
                {suppliers.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            </div>
            <div className={styles.fieldFull}>
              <label>Notas</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>

          <div className={styles.poItemsHeader}>
            <h4>Productos</h4>
            <button type="button" className={styles.addBtn} onClick={addItem}>
              <Plus size={16} /> Agregar Producto
            </button>
          </div>

          {form.items.length > 0 && (
            <div className={styles.poItems}>
              {form.items.map((item, idx) => (
                <div key={idx} className={styles.poItemRow}>
                  <div className={styles.field} style={{ flex: 2 }}>
                    <label>Producto</label>
                    <select value={item.productId} onChange={e => updateItem(idx, 'productId', e.target.value)} required>
                      <option value="">Seleccionar...</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} ({formatPrice(p.cost)})</option>
                      ))}
                    </select>
                  </div>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>Cantidad</label>
                    <input type="number" min="1" value={item.quantity || ''} onChange={e => updateItem(idx, 'quantity', Number(e.target.value))} required placeholder="1" />
                  </div>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>Costo Uni.</label>
                    <input type="number" step="0.01" min="0" value={item.cost || ''} onChange={e => updateItem(idx, 'cost', Number(e.target.value))} required placeholder="0.00" />
                  </div>
                  <div className={styles.field} style={{ flex: 1 }}>
                    <label>Subtotal</label>
                    <div className={styles.poSubtotal}>{formatPrice(item.quantity * item.cost)}</div>
                  </div>
                  <button type="button" className={styles.removeItemBtn} onClick={() => removeItem(idx)}>
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}

          <div className={styles.poTotal}>
            <strong>Total: {formatPrice(total)}</strong>
          </div>

          <div className={styles.formActions}>
            <button type="button" className={styles.cancelBtn} onClick={() => { setShowForm(false); setForm({ supplierId: '', notes: '', items: [] }); }}>
              Cancelar
            </button>
             <button type="submit" className={styles.saveBtn} disabled={loading || form.items.length === 0}>
               {loading ? <ButtonLoader /> : 'Crear Orden'}
             </button>
          </div>
        </form>
      </Modal>

      <div className="lista-container">
        <table className="lista-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Proveedor</th>
              <th style={{textAlign:'center'}}>Estado</th>
              <th style={{textAlign:'right'}}>Total</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loadingOrders ? (
              config.skeletonEnabled ? (
                Array.from({ length: 5 }).map((_, idx) => (
                  <tr key={`loader-${idx}`}>
                    <td><Skeleton height={14} width="60px" /></td>
                    <td><Skeleton height={14} width="120px" /></td>
                    <td><Skeleton height={14} width="80px" /></td>
                    <td><div style={{ display: 'flex', justifyContent: 'flex-end' }}><Skeleton height={14} width="60px" /></div></td>
                    <td><Skeleton height={14} width="100px" /></td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{textAlign:'center',padding:40}}><LoadingDots text="Cargando órdenes..." /></td>
                </tr>
              )
            ) : (
              orders.map(order => (
                <tr key={order.id}>
                  <td style={{fontFamily:'monospace',fontWeight:700,color:'var(--text-muted)'}}>{order.id.slice(0, 8)}</td>
                  <td><span className="lista-name-text">{getSupplierName(order.supplierId)}</span></td>
                  <td style={{textAlign:'center'}}>{statusBadge(order.status)}</td>
                  <td style={{textAlign:'right'}}><span className="lista-number-value">{formatPrice(order.total)}</span></td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        {!loadingOrders && orders.length === 0 && (
          <p style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>No hay órdenes de compra</p>
        )}
      </div>
    </>
  );
}

function AdjustmentsTab() {
  const { showToast } = useToast();
  const { user } = useAuth();
  const { formatPrice } = useExchangeRate();
  const { config } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [adjustments, setAdjustments] = useState<any[]>([]);
  const [loadingAdjustments, setLoadingAdjustments] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [form, setForm] = useState({ quantity: 0, type: 'adjustment', notes: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {});
    api.getAdjustments().then(setAdjustments).catch(() => {}).finally(() => setLoadingAdjustments(false));
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.barcode?.includes(productSearch)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;
    setLoading(true);
    try {
      await api.adjustStock(selectedProduct.id, {
        quantity: Number(form.quantity),
        type: form.type,
        notes: form.notes || null,
      });
      setShowModal(false);
      setSelectedProduct(null);
      setProductSearch('');
      setForm({ quantity: 0, type: 'adjustment', notes: '' });
      api.getAdjustments().then(setAdjustments).catch(() => {});
      showToast('Ajuste registrado exitosamente', 'success');
    } catch (err: any) {
      showToast(err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Ajustes de Inventario</h3>
        {user?.role !== 'cajero' && (
          <button className={styles.addBtn} onClick={() => setShowModal(true)}>
            <Plus size={18} /> Nuevo Ajuste
          </button>
        )}
      </div>

      <div className="lista-container">
        {loadingAdjustments ? (
          config.skeletonEnabled ? <SkeletonTable rows={6} cols={5} /> : <LoadingDots text="Cargando ajustes..." />
        ) : adjustments.length === 0 ? (
          <div style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>
            <AlertTriangle size={40} />
            <p>Presiona "Nuevo Ajuste" para registrar una entrada, salida, merma o devolución de inventario.</p>
          </div>
        ) : (
          <table className="lista-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Producto</th>
                <th>Tipo</th>
                <th style={{textAlign:'right'}}>Cantidad</th>
                <th>Notas</th>
                <th>Usuario</th>
              </tr>
            </thead>
            <tbody>
              {adjustments.map((adj: any) => (
                <tr key={adj.id}>
                  <td>{new Date(adj.createdAt).toLocaleDateString()}</td>
                  <td><span className="lista-name-text">{adj.product?.name || adj.productName || '—'}</span></td>
                  <td style={{color:'var(--text-muted)'}}>{adj.type}</td>
                  <td style={{textAlign:'right'}}>
                    <span className="lista-number-value" style={{ color: adj.quantity >= 0 ? 'var(--color-success)' : 'var(--color-danger)' }}>
                      {adj.quantity >= 0 ? '+' : ''}{adj.quantity}
                    </span>
                  </td>
                  <td>{adj.notes || '—'}</td>
                  <td>{adj.user?.name || adj.userName || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={showModal} onClose={() => { setShowModal(false); setSelectedProduct(null); setProductSearch(''); }} title="Registrar Ajuste de Inventario">
        <form onSubmit={handleSubmit}>
          <div className={styles.formGrid}>
            <div className={styles.fieldFull}>
              <label>Producto</label>
              <div className={styles.selectWithSearch}>
                <input
                  type="text"
                  placeholder="Buscar producto..."
                  value={productSearch}
                  onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct(null); }}
                  onFocus={() => setShowDropdown(true)}
                />
                {showDropdown && filteredProducts.length > 0 && (
                  <div className={styles.dropdown}>
                    {filteredProducts.map(p => (
                      <div
                        key={p.id}
                        className={styles.dropdownItem}
                        onClick={() => { setSelectedProduct(p); setProductSearch(p.name); setShowDropdown(false); }}
                      >
                        <span>{p.name}</span>
                        <span className={styles.dropdownMeta}>Stock: {p.stock} | {formatPrice(p.cost)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
              {selectedProduct && (
                <p className={styles.selectedInfo}>
                  Stock actual: <strong>{selectedProduct.stock}</strong> | Costo: <strong>{formatPrice(selectedProduct.cost)}</strong>
                </p>
              )}
            </div>
            <div className={styles.field}>
              <label>Cantidad</label>
              <input
                type="number"
                value={form.quantity || ''}
                onChange={e => setForm(p => ({ ...p, quantity: Number(e.target.value) }))}
                required
                placeholder="Positivo o negativo"
              />
            </div>
            <div className={styles.field}>
              <label>Tipo de Ajuste</label>
              <select value={form.type} onChange={e => setForm(p => ({ ...p, type: e.target.value }))}>
                <option value="adjustment">Ajuste</option>
                <option value="waste">Merma</option>
                <option value="return">Devolución</option>
                <option value="theft">Robo</option>
              </select>
            </div>
            <div className={styles.fieldFull}>
              <label>Motivo / Notas</label>
              <textarea value={form.notes} onChange={e => setForm(p => ({ ...p, notes: e.target.value }))} rows={2} />
            </div>
          </div>
          <div className={styles.formActions}>
            <button type="submit" className={styles.saveBtn} disabled={loading || !selectedProduct}>
              {loading ? <ButtonLoader /> : 'Registrar Ajuste'}
            </button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function KardexTab() {
  const { config } = useTheme();
  const [products, setProducts] = useState<Product[]>([]);
  const [movements, setMovements] = useState<InventoryMovement[]>([]);
  const [productSearch, setProductSearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    api.getProducts().then(setProducts).catch(() => {});
  }, []);

  const filteredProducts = products.filter(p =>
    p.name.toLowerCase().includes(productSearch.toLowerCase()) ||
    p.barcode?.includes(productSearch)
  );

  const loadMovements = async (productId: string) => {
    setLoading(true);
    try {
      const data = await api.getMovements(productId);
      setMovements(data);
    } catch {
      setMovements([]);
    } finally {
      setLoading(false);
    }
  };

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    setProductSearch(product.name);
    setShowDropdown(false);
    loadMovements(product.id);
  };

  const typeColor = (type: string) => {
    switch (type) {
      case 'sale': return styles.movementSale;
      case 'purchase': return styles.movementPurchase;
      case 'adjustment': case 'return': return styles.movementAdjustment;
      case 'waste': case 'theft': return styles.movementWaste;
      default: return '';
    }
  };

  const typeLabel = (type: string) => {
    const labels: Record<string, string> = {
      sale: 'Venta', purchase: 'Compra', adjustment: 'Ajuste',
      waste: 'Merma', return: 'Devolución', theft: 'Robo',
    };
    return labels[type] || type;
  };

  return (
    <>
      <div className={styles.header}>
        <h3 className={styles.sectionTitle}>Kardex de Inventario</h3>
      </div>

      <div className={styles.form}>
        <div className={styles.formGrid}>
          <div className={styles.fieldFull}>
            <label>Producto</label>
            <div className={styles.selectWithSearch}>
              <input
                type="text"
                placeholder="Buscar producto..."
                value={productSearch}
                onChange={e => { setProductSearch(e.target.value); setShowDropdown(true); setSelectedProduct(null); setMovements([]); }}
                onFocus={() => setShowDropdown(true)}
              />
              {showDropdown && filteredProducts.length > 0 && (
                <div className={styles.dropdown}>
                  {filteredProducts.map(p => (
                    <div
                      key={p.id}
                      className={styles.dropdownItem}
                      onClick={() => selectProduct(p)}
                    >
                      <span>{p.name}</span>
                      <span className={styles.dropdownMeta}>Stock: {p.stock}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {selectedProduct && (
        <>
          <div className={styles.kardexInfo}>
            <Package size={18} />
            <span><strong>{selectedProduct.name}</strong> — Stock actual: {selectedProduct.stock}</span>
          </div>

      {loading ? (
        config.skeletonEnabled ? <SkeletonTable rows={5} cols={5} /> : <LoadingDots text="Cargando movimientos..." />
      ) : (
      <div className="lista-container">
        <table className="lista-table">
              <thead>
                <tr>
                  <th>Fecha</th>
                  <th>Tipo</th>
                  <th style={{textAlign:'right'}}>Cantidad</th>
                  <th>Referencia</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {movements.length === 0 ? (
                  <tr><td colSpan={5} style={{textAlign:'center',padding:40,color:'var(--text-muted)'}}>Sin movimientos</td></tr>
                ) : (
                  movements.map(m => (
                    <tr key={m.id}>
                      <td>{new Date(m.createdAt).toLocaleString()}</td>
                      <td>
                        <span className={`lista-badge ${m.type === 'sale' || m.type === 'exit' ? 'saturated' : m.type === 'purchase' || m.type === 'entry' ? 'active' : 'warning'}`}>
                          {typeLabel(m.type)}
                        </span>
                      </td>
                      <td style={{textAlign:'right'}}>
                        <span className="lista-number-value" style={{color: m.quantity > 0 ? 'var(--color-success)' : 'var(--color-danger)'}}>
                          {m.quantity > 0 ? '+' : ''}{m.quantity}
                        </span>
                      </td>
                      <td>{m.reference || '-'}</td>
                      <td>{m.userId ? m.userId.slice(0, 8) : '-'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
        </>
      )}
    </>
  );
}

