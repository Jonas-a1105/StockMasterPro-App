// src/features/inventory/components/ProductFilters/ProductFilters.tsx
import { List, Grid, Upload, Download, Plus } from 'lucide-react';
import { Input, SelectDropdown, Button } from '@shared/ui';
import type { ViewMode } from '../../types';
import styles from './ProductFilters.module.css';


interface ProductFiltersProps {
  search: string;
  onSearchChange: (val: string) => void;
  warehouseFilter: string;
  onWarehouseFilterChange: (val: string) => void;
  warehouses: any[];
  currentViewMode: ViewMode;
  onViewModeChange: (mode: ViewMode) => void;
  onExport?: () => void;
  onImport?: () => void;
  showExportImport: boolean;
  canManage: boolean;
  onAdd?: () => void;
}

export function ProductFilters({
  search,
  onSearchChange,
  warehouseFilter,
  onWarehouseFilterChange,
  warehouses,
  currentViewMode,
  onViewModeChange,
  onExport,
  onImport,
  showExportImport,
  canManage,
  onAdd,
}: ProductFiltersProps) {
  return (
    <div className={`${styles.island} flex justifyBetween itemsCenter gap4`}>
      {/* Grupo Izquierda: Búsqueda y Almacén */}
      <div className={`${styles.leftGroup} flex itemsCenter gap3`}>
        <div className="flex1">
          <Input
            placeholder="Buscar productos, marcas, códigos..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <SelectDropdown
          value={warehouseFilter}
          onChange={onWarehouseFilterChange}
          placeholder="Todos los almacenes"
          options={warehouses.map((w) => ({ value: w.id, label: w.name }))}
          className={styles.warehouseSelect}
        />
      </div>

      {/* Grupo Derecha: Toggle Vista, Import/Export y Botón Añadir */}
      <div className={`${styles.rightGroup} flex itemsCenter gap3`}>
        {/* Selector de Modo de Vista (List / Grid) */}
        {/* Selector de Modo de Vista (List / Grid) */}
        <div className={styles.viewModeContainer}>
          <button
            onClick={() => onViewModeChange('table')}
            className={`${styles.viewModeBtn} ${
              currentViewMode === 'table' ? styles.viewModeBtnActive : ''
            }`}
          >
            <List size={16} />
          </button>
          <button
            onClick={() => onViewModeChange('cards')}
            className={`${styles.viewModeBtn} ${
              currentViewMode === 'cards' ? styles.viewModeBtnActive : ''
            }`}
          >
            <Grid size={16} />
          </button>
        </div>

        {/* Acciones de Datos */}
        {showExportImport && (
          <div className="flex itemsCenter gap2">
            <Button variant="secondary" onClick={onImport}>
              <Upload size={16} /> Importar
            </Button>
            <Button variant="secondary" onClick={onExport}>
              <Download size={16} /> Exportar
            </Button>
          </div>
        )}

        {/* Acciones de Negocio */}
        {canManage && onAdd && (
          <Button variant="primary" onClick={onAdd}>
            <Plus size={16} /> Nuevo Producto
          </Button>
        )}
      </div>
    </div>
  );
}