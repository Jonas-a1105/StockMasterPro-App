import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Search, X, ChevronRight, Loader2 } from 'lucide-react';
import { api } from '@shared/lib/http/client';
import { useGlobalSearch } from '../hooks/useGlobalSearch';
import { Modal } from '@shared/ui/Modal';
import { useKeyboardShortcut } from '@shared/hooks/useKeyboardShortcut';
import { useTheme } from '@contexts/ThemeContext';
import styles from './GlobalSearchModal.module.css';

interface GlobalSearchResult {
  type: 'product' | 'customer' | 'supplier' | 'sale' | 'purchaseOrder' | 'inventoryCount';
  id: string;
  title: string;
  subtitle: string;
  metadata?: Record<string, any>;
}

const TYPE_CONFIG = {
  product: { label: 'Producto', icon: '📦', color: '#3b82f6' },
  customer: { label: 'Cliente', icon: '👤', color: '#10b981' },
  supplier: { label: 'Proveedor', icon: '🚚', color: '#8b5cf6' },
  sale: { label: 'Venta', icon: '💰', color: '#f59e0b' },
  purchaseOrder: { label: 'OC', icon: '📦', color: '#06b6d4' },
  inventoryCount: { label: 'Conteo', icon: '📋', color: '#ec4899' },
} as const;

type ResultType = keyof typeof TYPE_CONFIG;

export function GlobalSearchModal() {
  const [open, setOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);
  const { config } = useTheme();
  const { search: doSearch, debouncedSearch, loading, results } = useGlobalSearch();

  const debouncedQuery = useMemo(() => query, [query]);
  const debouncedSearch = useMemo(
    () =>
      useDebounce((q: string) => {
        if (q.length >= 2) {
          doSearch(q, 8);
        } else {
          setResults([]);
        }
      }, 150),
    [doSearch]
  );

  const [results, setResults] = useState<GlobalSearchResult[]>([]);

  useKeyboardShortcut('k', true, () => {
    if (
      document.activeElement?.tagName !== 'INPUT' &&
      document.activeElement?.tagName !== 'TEXTAREA'
    ) {
      setOpen(true);
    }
  });

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  useEffect(() => {
    if (open && query) {
      debouncedSearch(query);
    } else if (!query) {
      setResults([]);
    }
  }, [query, debouncedSearch, open]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const maxIndex = results.length - 1;
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((i) => Math.min(i + 1, maxIndex));
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((i) => Math.max(i - 1, 0));
          break;
        case 'Enter':
          e.preventDefault();
          if (results[selectedIndex]) {
            handleResultClick(results[selectedIndex]);
          }
          break;
        case 'Escape':
          close();
          break;
      }
    },
    [results, selectedIndex]
  );

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setResults([]);
    setSelectedIndex(0);
  }, []);

  const handleResultClick = useCallback((result: any) => {
    close();
    navigateToResult(result);
  }, []);

  const navigateToResult = useCallback((result: any) => {
    const routes: Record<string, string> = {
      product: `/inventory?search=${result.id}`,
      customer: `/customers?id=${result.id}`,
      supplier: `/suppliers?id=${result.id}`,
      sale: `/sales?id=${result.id}`,
      purchaseOrder: `/purchase-orders?id=${result.id}`,
      inventoryCount: `/inventory-counts?id=${result.id}`,
    };
    const basePath = window.location.pathname.includes('/admin') ? '/admin' : '';
    window.location.href = `${basePath}${routes[result.type] || '/dashboard'}`;
  }, []);

  useEffect(() => {
    const resultsEl = resultsRef.current;
    const selectedEl = resultsEl?.querySelector(`[data-index="${selectedIndex}"]`);
    if (selectedEl) {
      selectedEl.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex, results]);

  if (!open) return null;

  return createPortal(
    <div className={styles.overlay} onClick={() => setOpen(false)}>
      <div
        className={styles.modal}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label="Búsqueda global"
      >
        <header className={styles.header}>
          <div className={styles.headerLeft}>
            <Search className={styles.searchIcon} />
            <input
              ref={inputRef}
              className={styles.input}
              type="search"
              placeholder="Buscar productos, clientes, ventas, proveedores..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              autoComplete="off"
              autoFocus
              aria-label="Búsqueda global"
              aria-autocomplete="list"
              aria-controls="search-results"
              aria-expanded="true"
            />
            <span className={styles.shortcut}>⌘K</span>
          </div>
          <button className={styles.closeBtn} onClick={close} aria-label="Cerrar">
            <X size={20} />
          </button>
        </header>

        {loading && <div className={styles.loadingBar} />}

        <div
          id="search-results"
          ref={resultsRef}
          className={styles.results}
          role="listbox"
          aria-label="Resultados de búsqueda"
        >
          {loading && (
            <div className={styles.loading}>
              <Loader2 className={styles.spinner} /> Buscando...
            </div>
          )}
          {!loading && results.length === 0 && query.length >= 2 && (
            <div className={styles.empty}>No se encontraron resultados para "{query}"</div>
          )}
          {!loading && results.length === 0 && query.length < 2 && (
            <div className={styles.hint}>Escribe al menos 2 caracteres para buscar</div>
          )}
          <div id="search-results" role="listbox" aria-label="Resultados de búsqueda">
            {results.map((result, index) => (
              <div
                key={result.id}
                className={`${styles.result} ${index === selectedIndex ? styles.selected : ''}`}
                role="option"
                aria-selected={index === selectedIndex}
                data-index={index}
                onClick={() => handleResultClick(result)}
                onMouseEnter={() => setSelectedIndex(index)}
              >
                <span
                  className={styles.typeBadge}
                  style={
                    { '--badge-bg': TYPE_CONFIG[result.type as any]?.color } as React.CSSProperties
                  }
                >
                  {TYPE_CONFIG[result.type as any]?.icon || '📦'}
                  {TYPE_CONFIG[result.type as any]?.label}
                </span>
                <div className={styles.resultContent}>
                  <div className={styles.resultTitle}>{result.title}</div>
                  <div className={styles.resultSubtitle}>{result.subtitle}</div>
                </div>
                <ChevronRight className={styles.arrow} size={20} />
              </div>
            ))}
          </div>
        </div>

        {!loading && results.length === 0 && query.length < 2 && (
          <div className={styles.hint}>
            <kbd className={styles.shortcut}>⌘</kbd> + <kbd className={styles.shortcut}>K</kbd> para
            abrir búsqueda
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}

const typeColors = {
  product: '#3b82f6',
  customer: '#10b981',
  supplier: '#8b5cf6',
  sale: '#f59e0b',
  purchaseOrder: '#06b6d4',
  inventoryCount: '#ec4899',
} as const;

export default GlobalSearchModal;
