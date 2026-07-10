import type { ReactNode } from 'react';
import { Search, X, ArrowUpDown, ChevronDown } from 'lucide-react';
import type { SortField, SortDirection } from '../types';
import styles from '../pages/InventoryPage.module.css';

export function ProductFilters({
  search, onSearchChange, warehouseFilter, onWarehouseChange, warehouses,
  sortField, sortDirection, onSort, showSortMenu, setShowSortMenu, sortRef,
  children,
}: {
  search: string; onSearchChange: (s: string) => void;
  warehouseFilter: string; onWarehouseChange: (w: string) => void; warehouses: any[];
  sortField: SortField; sortDirection: SortDirection; onSort: (field: SortField) => void;
  showSortMenu: boolean; setShowSortMenu: (v: boolean) => void; sortRef: React.RefObject<HTMLDivElement | null>;
  children?: ReactNode;
}) {
  const getSortLabel = () => {
    const labels: Record<SortField, string> = { none: 'Ordenar', name: `Nombre ${sortDirection === 'asc' ? 'A-Z' : 'Z-A'}`, price: `Precio ${sortDirection === 'asc' ? '↑' : '↓'}`, stock: `Stock ${sortDirection === 'asc' ? '↑' : '↓'}`, status: 'Stock Bajo primero' };
    return labels[sortField];
  };

  return (
    <div className={styles.toolbarContainer}>
      <div className={styles.toolbarRow}>
        <div className={styles.searchFilterUnified}>
          <div className={`${styles.searchSection} global-search-section`}>
            <Search size={16} />
            <input type="text" className="global-search-input" placeholder="Buscar productos, marcas, códigos..." value={search} onChange={e => onSearchChange(e.target.value)} />
            {search && <button className={styles.clearSearchBtn} onClick={() => onSearchChange('')} title="Limpiar búsqueda"><X size={14} /></button>}
          </div>
          <div className={styles.searchFilterDivider} />
          <div className={`${styles.warehouseSection} global-warehouse-section`}>
            <select className="global-search-select" value={warehouseFilter} onChange={e => onWarehouseChange(e.target.value)}>
              <option value="">Todos los almacenes</option>
              {warehouses.filter((w: any) => w.isActive).map((w: any) => (<option key={w.id} value={w.id}>{w.name}</option>))}
            </select>
          </div>
        </div>
        <div className={styles.toolbarActions}>
          {children}
          <div className={styles.sortDropdown} ref={sortRef}>
            <button className={styles.sortDropdownBtn} onClick={() => setShowSortMenu(!showSortMenu)}>
              <ArrowUpDown size={14} /> <span>{getSortLabel()}</span>
              <ChevronDown size={12} className={`${styles.sortChevron} ${showSortMenu ? styles.sortChevronOpen : ''}`} />
            </button>
            {showSortMenu && (
              <div className={styles.sortDropdownMenu}>
                <div className={styles.sortMenuHeader}>Ordenar por</div>
                <button className={`${styles.sortMenuItem} ${sortField === 'name' ? styles.sortMenuItemActive : ''}`} onClick={() => onSort('name')}>Nombre {sortField === 'name' && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}</button>
                <button className={`${styles.sortMenuItem} ${sortField === 'price' ? styles.sortMenuItemActive : ''}`} onClick={() => onSort('price')}>Precio {sortField === 'price' && (sortDirection === 'asc' ? '(Menor)' : '(Mayor)')}</button>
                <button className={`${styles.sortMenuItem} ${sortField === 'stock' ? styles.sortMenuItemActive : ''}`} onClick={() => onSort('stock')}>Stock {sortField === 'stock' && (sortDirection === 'asc' ? '(Menor)' : '(Mayor)')}</button>
                <div className={styles.sortMenuDivider} />
                <button className={`${styles.sortMenuItem} ${sortField === 'status' ? styles.sortMenuItemActive : ''}`} onClick={() => onSort('status')}>Stock Bajo primero</button>
                {sortField !== 'none' && (<><div className={styles.sortMenuDivider} /><button className={styles.sortMenuItem} onClick={() => { onSort('none'); setShowSortMenu(false); }}>✕ Quitar orden</button></>)}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
