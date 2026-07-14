import { useState, useMemo, useRef, useEffect, type ReactNode, type HTMLAttributes } from 'react';
import { ArrowUpDown, ChevronDown, Search, X, Download, Upload, Wrench } from 'lucide-react';
import { Toolbar } from '../Toolbar';
import styles from './DataTable.module.css';
import { Table, TableHead, TableBody, TableRow, TableHeaderCell, TableCell } from '../';

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T, index: number) => ReactNode;
  className?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
}

interface DataTableProps<T> {
  data: T[];
  columns: Column<T>[];
  keyExtractor: (row: T, index: number) => string;
  searchable?: boolean;
  searchPlaceholder?: string;
  searchKeys?: (keyof T)[];
  sortable?: boolean;
  filterable?: boolean;
  filterOptions?: { key: string; label: string; options: { value: string; label: string }[] }[];
  filterValues?: Record<string, string>;
  onFilterChange?: (filters: Record<string, string>) => void;
  onExport?: () => void;
  onImport?: () => void;
  onAdd?: () => void;
  addLabel?: string;
  addIcon?: ReactNode;
  emptyMessage?: string;
  striped?: boolean;
  hoverable?: boolean;
  className?: string;
  onRowClick?: (row: T) => void;
  simple?: boolean;
}


export function DataTable<T>({
  data,
  columns,
  keyExtractor,
  searchable = true,
  searchPlaceholder = 'Buscar...',
  searchKeys,
  sortable = true,
  filterable = false,
  filterOptions,
  filterValues,
  onFilterChange,
  onExport,
  onImport,
  onAdd,
  addLabel = 'Nuevo',
  addIcon,
  emptyMessage = 'No hay datos',
  striped = false,
  hoverable = true,
  className = '',
  onRowClick,
  simple = false,
}: DataTableProps<T>) {
  const [search, setSearch] = useState('');
  const [sortField, setSortField] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc');
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (sortRef.current && !sortRef.current.contains(e.target as Node)) {
        setShowSortMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const filteredData = useMemo(() => {
    let result = [...data];

    if (search && searchable && !simple) {
      const searchLower = search.toLowerCase();
      if (searchKeys && searchKeys.length > 0) {
        result = result.filter((item) =>
          searchKeys.some((key) => {
            const value = item[key];
            return value != null && String(value).toLowerCase().includes(searchLower);
          })
        );
      } else {
        result = result.filter((item) =>
          Object.values(item).some(
            (value) => value != null && String(value).toLowerCase().includes(searchLower)
          )
        );
      }
    }

    if (filterable && filterValues && !simple) {
      Object.entries(filterValues).forEach(([key, value]) => {
        if (value) {
          result = result.filter((item) => String(item[key as keyof T]) === value);
        }
      });
    }

    if (sortable && sortField && !simple) {
      result.sort((a, b) => {
        const aVal = a[sortField as keyof T];
        const bVal = b[sortField as keyof T];
        let cmp = 0;
        if (aVal < bVal) cmp = -1;
        else if (aVal > bVal) cmp = 1;
        return sortDirection === 'asc' ? cmp : -cmp;
      });
    }

    return result;
  }, [data, search, sortField, sortDirection, filterValues, searchable, filterable, searchKeys, simple]);

  const handleSort = (field: string) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
    setShowSortMenu(false);
  };

  const getSortLabel = () => {
    if (!sortField) return 'Ordenar';
    const dir = sortDirection === 'asc' ? '\u2191' : '\u2193';
    const col = columns.find((c) => c.key === sortField);
    return `${col?.header || sortField} ${dir}`;
  };

  if (data.length === 0) {
    return (
      <div className={className}>
        {!simple && (
          <Toolbar
            search={searchable ? { value: search, onChange: setSearch, placeholder: searchPlaceholder } : undefined}
            searchExtra={filterable && filterOptions ? (
              <>
                <div className={styles.divider} />
                <div className={styles.filterSelects}>
                  {filterOptions.map((filter) => (
                    <select
                      key={filter.key}
                      value={filterValues?.[filter.key] || ''}
                      onChange={(e) => onFilterChange?.({ ...filterValues, [filter.key]: e.target.value })}
                      className={styles.filterSelect}
                    >
                      <option value="">{filter.label}</option>
                      {filter.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>{opt.label}</option>
                      ))}
                    </select>
                  ))}
                </div>
              </>
            ) : undefined}
            onExport={onExport}
            onImport={onImport}
            addBtn={onAdd ? { label: addLabel, onClick: onAdd, icon: addIcon, show: true } : undefined}
          />
        )}
        <div className={styles.emptyState}><p>{emptyMessage}</p></div>
      </div>
    );
  }

  return (
    <div className={className}>
      {!simple && (
        <Toolbar
          search={searchable ? { value: search, onChange: setSearch, placeholder: searchPlaceholder } : undefined}
          searchExtra={filterable && filterOptions ? (
            <>
              <div className={styles.divider} />
              <div className={styles.filterSelects}>
                {filterOptions.map((filter) => (
                  <select
                    key={filter.key}
                    value={filterValues?.[filter.key] || ''}
                    onChange={(e) => onFilterChange?.({ ...filterValues, [filter.key]: e.target.value })}
                    className={styles.filterSelect}
                  >
                    <option value="">{filter.label}</option>
                    {filter.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                ))}
              </div>
            </>
          ) : undefined}
          onExport={onExport}
          onImport={onImport}
          addBtn={onAdd ? { label: addLabel, onClick: onAdd, icon: addIcon, show: true } : undefined}
        >
          {sortable && columns.some((c) => c.key !== 'actions') && (
            <div className={styles.sortDropdown} ref={sortRef}>
              <button
                className={styles.sortDropdownBtn}
                onClick={() => setShowSortMenu(!showSortMenu)}
              >
                <ArrowUpDown size={14} />
                <span>{getSortLabel()}</span>
                <ChevronDown size={12} className={`${styles.sortChevron} ${showSortMenu ? styles.sortChevronOpen : ''}`} />
              </button>
              {showSortMenu && (
                <div className={styles.sortDropdownMenu}>
                  <div className={styles.sortMenuHeader}>Ordenar por</div>
                  {columns.filter((c) => c.key !== 'actions').map((col) => (
                    <button
                      key={col.key}
                      className={`${styles.sortMenuItem} ${sortField === col.key ? styles.sortMenuItemActive : ''}`}
                      onClick={() => handleSort(col.key)}
                    >
                      {col.header} {sortField === col.key && (sortDirection === 'asc' ? '(A-Z)' : '(Z-A)')}
                    </button>
                  ))}
                  {sortField && (
                    <>
                      <div className={styles.sortMenuDivider} />
                      <button className={styles.sortMenuItem} onClick={() => { setSortField(''); setShowSortMenu(false); }}>
                        {'\u2715'} Quitar orden
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </Toolbar>
      )}

      <Table striped={striped} hoverable={hoverable}>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <TableHeaderCell key={col.key} align={col.align} style={{ width: col.width }} className={col.className}>
                {col.header}
              </TableHeaderCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredData.map((row, rowIndex) => (
            <TableRow
              key={keyExtractor(row, rowIndex)}
              onClick={() => onRowClick?.(row)}
              style={{ cursor: onRowClick ? 'pointer' : 'default' }}
            >
              {columns.map((col) => (
                <TableCell key={col.key} align={col.align} className={col.className}>
                  {col.render ? col.render(row, rowIndex) : (row as Record<string, unknown>)[col.key] as ReactNode}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
