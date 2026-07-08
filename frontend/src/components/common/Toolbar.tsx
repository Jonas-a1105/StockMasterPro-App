import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Search, X, Download, Upload, Plus, Wrench, ChevronDown } from 'lucide-react';
import styles from './Toolbar.module.css';

interface SearchConfig {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

interface AddBtnConfig {
  label: string;
  onClick: () => void;
  show?: boolean;
  icon?: ReactNode;
}

interface ToolbarProps {
  search?: SearchConfig;
  searchExtra?: ReactNode;
  addBtn?: AddBtnConfig;
  onExport?: () => void;
  onImport?: () => void;
  children?: ReactNode;
}

export function Toolbar({ search, searchExtra, addBtn, onExport, onImport, children }: ToolbarProps) {
  const [showTools, setShowTools] = useState(false);
  const toolsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (toolsRef.current && !toolsRef.current.contains(e.target as Node)) {
        setShowTools(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const hasTools = onExport || onImport;

  return (
    <div className={styles.container}>
      <div className={styles.row}>
        {search && (
          <div className={`${styles.searchSection} global-search-section`}>
            <Search size={16} />
            <input
              type="text"
              className="global-search-input"
              placeholder={search.placeholder || 'Buscar...'}
              value={search.value}
              onChange={e => search.onChange(e.target.value)}
            />
            {search.value && (
              <button className={styles.clearBtn} onClick={() => search.onChange('')}>
                <X size={14} />
              </button>
            )}
            {searchExtra && (
              <>
                <div className={styles.divider} />
                <div className={styles.searchExtra}>{searchExtra}</div>
              </>
            )}
          </div>
        )}

        <div className={styles.actions}>
          {children}

          {hasTools && (
            <div className={styles.toolsDropdown} ref={toolsRef}>
              <button className={styles.toolsBtn} onClick={() => setShowTools(!showTools)}>
                <Wrench size={14} />
                <span>Herramientas</span>
                <ChevronDown
                  size={12}
                  className={`${styles.chevron} ${showTools ? styles.chevronOpen : ''}`}
                />
              </button>
              {showTools && (
                <div className={styles.toolsMenu}>
                  <div className={styles.toolsMenuHeader}>Transferencia de Datos</div>
                  {onExport && (
                    <button
                      className={styles.toolsMenuItem}
                      onClick={() => { onExport(); setShowTools(false); }}
                    >
                      <Download size={14} className={styles.toolsMenuIcon} />
                      <span>Exportar Excel</span>
                    </button>
                  )}
                  {onImport && (
                    <button
                      className={styles.toolsMenuItem}
                      onClick={() => { onImport(); setShowTools(false); }}
                    >
                      <Upload size={14} className={styles.toolsMenuIcon} />
                      <span>Importar Archivo</span>
                    </button>
                  )}
                </div>
              )}
            </div>
          )}

          {addBtn && addBtn.show !== false && (
            <button className={styles.addBtn} onClick={addBtn.onClick}>
              {addBtn.icon || <Plus size={18} />}
              {addBtn.label}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
