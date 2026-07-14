import { useState, useRef, useEffect, type ReactNode } from 'react';
import { Search, X, Download, Upload, Plus, Wrench, ChevronDown } from 'lucide-react';
import { Button, Input, Text } from '@shared/ui';
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

export function Toolbar({
  search,
  searchExtra,
  addBtn,
  onExport,
  onImport,
  children,
}: ToolbarProps) {
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
            <Input
              type="text"
              className="global-search-input"
              placeholder={search.placeholder || 'Buscar...'}
              value={search.value}
              onChange={(e) => search.onChange(e.target.value)}
            />
            {search.value && (
              <Button variant="ghost" size="sm" onClick={() => search.onChange('')}>
                <X size={14} />
              </Button>
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
              <Button variant="outline" size="sm" onClick={() => setShowTools(!showTools)}>
                <Wrench size={14} />
                <span>Herramientas</span>
                <ChevronDown size={12} className={`${styles.chevron} ${showTools ? styles.chevronOpen : ''}`} />
              </Button>
              {showTools && (
                <div className={styles.toolsMenu}>
                  <Text variant="xs" weight="bold" color="muted" className={styles.toolsMenuHeader}>Transferencia de Datos</Text>
                  {onExport && (
                    <Button variant="ghost" size="sm" className={styles.toolsMenuItem} onClick={() => { onExport(); setShowTools(false); }} leftIcon={<Download size={14} className={styles.toolsMenuIcon} />}>
                      Exportar Excel
                    </Button>
                  )}
                  {onImport && (
                    <Button variant="ghost" size="sm" className={styles.toolsMenuItem} onClick={() => { onImport(); setShowTools(false); }} leftIcon={<Upload size={14} className={styles.toolsMenuIcon} />}>
                      Importar Archivo
                    </Button>
                  )}
                </div>
              )}
            </div>
          )}

          {addBtn && addBtn.show !== false && (
            <Button variant="primary" size="sm" onClick={addBtn.onClick} leftIcon={addBtn.icon || <Plus size={18} />}>
              {addBtn.label}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}